import { hashKey, useQueries } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useRef } from 'react';

import { normalizeError } from '@core/errors';
import type { AppError } from '@core/errors';

import { LOADING, failed, ready } from './state';
import type { DataState, ScreenQuery } from './state';
import type { ApiQueryOptions } from './useApiQuery';

/**
 * `useApiQuery`'s sibling for a DYNAMIC number of reads — one Home carousel card per active
 * booking, where the count varies per customer, and React hooks cannot be called a variable
 * number of times in one component. `@tanstack/react-query`'s `useQueries` is the library's own
 * answer to exactly this; this is the same `ApiQueryOptions` -> `ScreenQuery` bridge `useApiQuery`
 * already provides, just for N queries instead of one.
 *
 * Each entry gets its own independent `DataState` — one booking's fetch failing does not fail the
 * others, matching how N separate `useApiQuery` calls would behave if the hook-count problem did
 * not exist.
 *
 * ## Why `combine`, and why a `refetch` cache
 *
 * The naive version of this hook (`useQueries(...).map(...)`) hands back a brand-new array of
 * brand-new objects on every render, whether or not any query's data actually changed — there is
 * nothing for a caller's own `useMemo` to key off, so a memo built from this hook's output can
 * never skip recomputation. `combine` is `useQueries`' own answer to that: TanStack applies
 * structural sharing to its return value, handing back the PREVIOUS reference for any part that
 * compares deep-equal to last time, which is what lets a caller's `useMemo` actually memoize.
 *
 * That sharing only helps if every field on each item is itself stable when unchanged — an inline
 * `refetch: () => query.refetch()` is a fresh closure every call, which would make every item look
 * "different" forever regardless of `state`. Caching one `refetch` wrapper per query (keyed by its
 * hashed `queryKey`, not by array position, so reordering the input list reuses the same wrapper
 * for the same booking) is what makes an unchanged item's `refetch` compare equal too.
 */
export function useApiQueries<TData>(
  optionsList: readonly ApiQueryOptions<TData>[],
): readonly ScreenQuery<TData>[] {
  const refetchers = useRef(new Map<string, () => void>());

  return useQueries({
    queries: optionsList.map((options) => {
      const queryOptions = {
        queryKey: options.queryKey,
        queryFn: ({ signal }: { signal: AbortSignal }) => options.queryFn({ signal }),
        ...(options.enabled === undefined ? {} : { enabled: options.enabled }),
        ...(options.staleTime === undefined ? {} : { staleTime: options.staleTime }),
        ...(options.refetchInterval === undefined
          ? {}
          : {
              refetchInterval:
                typeof options.refetchInterval === 'function'
                  ? (query: { state: { data: TData | undefined } }) =>
                      (options.refetchInterval as (data: TData | undefined) => number | false)(
                        query.state.data,
                      )
                  : options.refetchInterval,
            }),
        ...(options.placeholderData === undefined
          ? {}
          : { placeholderData: options.placeholderData }),
      } as UseQueryOptions<TData, AppError> & { queryKey: QueryKey };
      return queryOptions;
    }),
    combine: (queries) => {
      const seenKeys = new Set<string>();

      const combined = queries.map((query, i) => {
        const state: DataState<TData> =
          query.data !== undefined
            ? ready(query.data)
            : query.error !== null && query.error !== undefined
              ? failed(normalizeError(query.error))
              : LOADING;

        const key = hashKey(optionsList[i]?.queryKey ?? []);
        seenKeys.add(key);
        let refetch = refetchers.current.get(key);
        if (refetch === undefined) {
          refetch = () => {
            void query.refetch();
          };
          refetchers.current.set(key, refetch);
        }

        return { state, refetch };
      });

      // Drop wrappers for queries that are no longer in this render's list, so a booking that
      // leaves the active set (rated, cancelled window elapsed, ...) does not leak its closure
      // forever.
      for (const key of refetchers.current.keys()) {
        if (!seenKeys.has(key)) refetchers.current.delete(key);
      }

      return combined;
    },
  });
}
