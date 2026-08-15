/**
 * Server-state -> view resolution. (FRONTEND_FOUNDATION_PLAN.md §18)
 *
 * The client NEVER computes, infers or advances a state. A single server-provided status field
 * selects the view through one mapping table, and an unrecognised status renders a safe fallback
 * and logs — it does not crash and does not guess. The backend will add states, and old app
 * versions must survive them.
 */

export type StatusViewRegistry<TView> = Readonly<Record<string, TView>>;

export interface StatusResolution<TView> {
  readonly view: TView;
  readonly isKnown: boolean;
  readonly status: string | null;
}

export function resolveStatusView<TView>(
  registry: StatusViewRegistry<TView>,
  status: string | null | undefined,
  fallback: TView,
  onUnknown?: (status: string | null) => void,
): StatusResolution<TView> {
  const normalized = typeof status === 'string' && status.length > 0 ? status : null;
  // Own-property check: a status called "constructor" or "toString" must not resolve to
  // something off Object.prototype.
  const view =
    normalized !== null && Object.prototype.hasOwnProperty.call(registry, normalized)
      ? registry[normalized]
      : undefined;

  if (view === undefined) {
    onUnknown?.(normalized);
    return { view: fallback, isKnown: false, status: normalized };
  }

  return { view, isKnown: true, status: normalized };
}

/**
 * Compile-time exhaustiveness guard, for use once a real status union exists.
 * Paired with `noFallthroughCasesInSwitch` in tsconfig.
 */
export function assertNever(value: never, message = 'Unexpected variant'): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}
