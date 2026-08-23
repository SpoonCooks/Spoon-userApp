/**
 * Idempotency keys.
 *
 * ## The rule this exists to enforce
 *
 * The backend deduplicates a mutation by `Idempotency-Key` (`docs/08_CONCURRENCY_AND_IDEMPOTENCY.md`).
 * That protection only works if the client obeys the other half of the contract:
 *
 *   a NEW user intent   -> a NEW key
 *   a RETRY of the same intent -> the SAME key
 *
 * The dangerous case is the ambiguous one. A booking POST that times out may or may not have
 * created a booking. Retrying it with a fresh key is how a customer gets charged twice; retrying
 * with the same key is how the backend recognises the replay and returns the original result.
 * So a key must NOT be generated at call time — it must be generated when the user forms the
 * intent, and held until that intent succeeds or is abandoned.
 *
 * ## Shape
 *
 * `IdempotencyScope` is a small keyed store. A caller asks for the key belonging to a scope
 * string; it gets the same key back on every subsequent ask until it explicitly releases the
 * scope. The scope string identifies the INTENT, not the attempt — "booking:create:<draftId>",
 * not "booking:create:<timestamp>".
 */

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

/**
 * A fresh key.
 *
 * The backend accepts any string up to 200 characters (`strict-input.ts`), so this deliberately
 * does NOT pull in a native crypto module for a v4 UUID. What matters is that two DIFFERENT
 * intents never collide, and three independent `Math.random` draws plus the millisecond clock
 * put that far below the rate at which a customer can form intents. It is not a security
 * primitive — the key authorises nothing; it only names a replay.
 */
export function createIdempotencyKey(): string {
  const chunk = () => Math.random().toString(36).slice(2, 12).padStart(10, '0');
  return `${Date.now().toString(36)}-${chunk()}-${chunk()}-${chunk()}`;
}

export interface IdempotencyScope {
  /** The key for this intent, minted on first ask and stable until `release`. */
  keyFor(scope: string): string;
  /** Drops the key so the NEXT ask starts a genuinely new intent. */
  release(scope: string): void;
  /** Test/diagnostic: whether a scope currently holds a key. */
  has(scope: string): boolean;
}

export function createIdempotencyScope(
  generate: () => string = createIdempotencyKey,
): IdempotencyScope {
  const keys = new Map<string, string>();

  return {
    keyFor(scope) {
      const existing = keys.get(scope);
      if (existing !== undefined) return existing;
      const created = generate();
      keys.set(scope, created);
      return created;
    },
    release(scope) {
      keys.delete(scope);
    },
    has(scope) {
      return keys.has(scope);
    },
  };
}

/**
 * The app-wide scope store.
 *
 * In memory on purpose. Its job is to survive a RETRY, which happens within one screen session;
 * it is not trying to survive a process restart, and persisting keys would resurrect a stale
 * intent days later. A cold start is a new intent.
 */
export const idempotency: IdempotencyScope = createIdempotencyScope();

/** Convenience: the header object for a scoped mutation. */
export function idempotencyHeader(
  scope: string,
  store: IdempotencyScope = idempotency,
): Record<string, string> {
  return { [IDEMPOTENCY_HEADER]: store.keyFor(scope) };
}
