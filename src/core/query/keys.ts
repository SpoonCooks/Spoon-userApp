/**
 * Query-key conventions. (FRONTEND_FOUNDATION_PLAN.md §6)
 *
 * Keys are declared by per-feature factories built with `createKeyFactory`, never as inline
 * string arrays, so invalidation is auditable in one place per feature.
 *
 * A key is a client-side cache identifier. It is not a backend route and implies no endpoint.
 */

export type QueryKey = readonly unknown[];

export interface KeyFactory<TScope extends string> {
  readonly scope: TScope;
  /** Everything in the feature — the invalidation blast radius. */
  all: () => readonly [TScope];
  /** A named collection within the feature, e.g. `list`, `active`. */
  collection: (name: string, params?: Readonly<Record<string, unknown>>) => QueryKey;
  /** A single entity by opaque server id. */
  detail: (id: string) => QueryKey;
}

export function createKeyFactory<TScope extends string>(scope: TScope): KeyFactory<TScope> {
  return {
    scope,
    all: () => [scope] as const,
    collection: (name, params) =>
      params === undefined ? ([scope, name] as const) : ([scope, name, params] as const),
    detail: (id) => [scope, 'detail', id] as const,
  };
}
