import { useQuery } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { normalizeError } from '@core/errors';
import type { AppError } from '@core/errors';

import { LOADING, failed, ready } from './state';
import type { DataState, ScreenQuery } from './state';

/**
 * The bridge from TanStack Query to the `ScreenQuery` contract every screen already renders.
 *
 * This is the whole reason the pixel-perfect screens survive backend integration untouched: they
 * were written against `DataState<T>` — loading / error / ready — and a query produces exactly
 * those three. Swapping `useDevFixture` for `useApiQuery` inside a feature's `data.ts` changes
 * the SOURCE of the data and nothing about its shape.
 *
 * ## Why `isPending` and not `isLoading`
 *
 * A background refetch must not blank a screen that already has data. `isPending` is true only
 * while there is no data at all, so a refetch keeps rendering `ready` with the previous payload
 * and the designed screen simply updates in place — which is what the design assumes.
 *
 * ## Errors
 *
 * Anything thrown by the transport is already an `AppError`, carrying the backend's `code`.
 * `normalizeError` is applied defensively for the case where a `select` or an adapter throws
 * something else, so a screen's error branch always receives the taxonomy.
 */
export interface ApiQueryOptions<TData> {
  readonly queryKey: QueryKey;
  readonly queryFn: (context: { signal: AbortSignal }) => Promise<TData>;
  readonly enabled?: boolean;
  readonly staleTime?: number;
  /**
   * A number, or a function of the latest data so the SERVER can dictate the interval (tracking
   * publishes `refreshAfterSeconds`). A client constant is only ever the fallback.
   */
  readonly refetchInterval?: number | false | ((data: TData | undefined) => number | false);
  /** Placeholder shown while the first fetch is in flight, e.g. a cached list. */
  readonly placeholderData?: TData;
}

export function useApiQuery<TData>(options: ApiQueryOptions<TData>): ScreenQuery<TData> {
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
              ? // TanStack hands the Query; the adapter narrows it to the data the caller asked
                // about, so feature code never touches the query object.
                (query: { state: { data: TData | undefined } }) =>
                  (options.refetchInterval as (data: TData | undefined) => number | false)(
                    query.state.data,
                  )
              : options.refetchInterval,
        }),
    ...(options.placeholderData === undefined ? {} : { placeholderData: options.placeholderData }),
  } as UseQueryOptions<TData, AppError>;

  const query = useQuery(queryOptions);

  const state = useMemo<DataState<TData>>(() => {
    if (query.data !== undefined) return ready(query.data);
    if (query.error !== null && query.error !== undefined) {
      return failed(normalizeError(query.error));
    }
    // Disabled-and-empty reads as loading rather than error: the screen is waiting for a
    // prerequisite (an address id, a session), which is a legitimate in-between, not a failure.
    return LOADING;
  }, [query.data, query.error]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return { state, refetch };
}
