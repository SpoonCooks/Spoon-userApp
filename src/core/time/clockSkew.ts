import { computeSkewMs } from './serverClock';

/**
 * The device↔server clock offset, observed once and shared by everything that counts down.
 *
 * ## Why this is central rather than per-screen (§29)
 *
 * Skew is a property of THIS DEVICE against the server, not of a booking. Every response that
 * carries a `serverTime` is evidence of the same single number, so measuring it per screen would
 * mean the in-service countdown and the hold timer could disagree about what time it is. One
 * observation point, one value.
 *
 * ## Why it is measured at the seam
 *
 * `observe` must be called when the response ARRIVES, with the device clock read at that same
 * moment. A `serverTime` carried into a component and compared during a later render has already
 * had the render delay added to it, which is precisely the error the measurement exists to
 * remove.
 *
 * ## What it is not
 *
 * Not a clock. It corrects timestamps the SERVER supplied; it never becomes a source of time in
 * its own right, and it never advances a booking's state. A countdown reaching zero refetches —
 * §34 — because only the server knows what happens next.
 *
 * The unmeasured default is 0, which is the device clock: exactly the behaviour before any
 * `serverTime` existed, so a deployment that does not publish one degrades rather than breaking.
 */

let observedSkewMs = 0;
let hasObservation = false;

/**
 * Records an observation.
 *
 * A malformed or absent timestamp is IGNORED rather than treated as zero skew: forgetting a good
 * measurement because one response omitted the field would make the countdown jump.
 */
export function observeServerTime(
  serverTimeIso: string | null | undefined,
  deviceNowMs: number = Date.now(),
): void {
  if (typeof serverTimeIso !== 'string') return;

  const serverMs = new Date(serverTimeIso).getTime();
  if (Number.isNaN(serverMs)) return;

  observedSkewMs = computeSkewMs(serverMs, deviceNowMs);
  hasObservation = true;
}

/** Milliseconds the device clock is AHEAD of the server. 0 until something has been observed. */
export function currentSkewMs(): number {
  return observedSkewMs;
}

/** Whether any server timestamp has been seen. Lets a caller tell "no skew" from "not measured". */
export function hasSkewObservation(): boolean {
  return hasObservation;
}

/** Test seam. Nothing in the app resets skew — a session's measurement stays valid for it. */
export function resetSkewObservation(): void {
  observedSkewMs = 0;
  hasObservation = false;
}
