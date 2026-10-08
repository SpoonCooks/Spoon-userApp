import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import { normalizeError } from '@core/errors';
import type { AppError } from '@core/errors';

import { LOADING, failed, ready } from './state';
import type { DataState, ScreenQuery } from './state';

/**
 * A cursor-paged list as a `ScreenQuery`, with what a list needs to ask for the next page.
 *
 * `state` is the FIRST page's story, exactly as `useApiQuery` tells it: loading until it lands,
 * `failed` only if it cannot be had. A later page that fails does NOT turn the screen into an
 * error — the rows already read stay on screen and `loadMoreError` says the next page is the
 * thing that failed, so the list can offer a retry at its foot instead of blanking.
 *
 * ## The cursor is opaque
 *
 * `getNextCursor` returns whatever the server gave and `fetchPage` hands it straight back. Nothing
 * here parses or builds one. `null` ends the list.
 *
 * ## Why `refetch` trims first
 *
 * An infinite query refetches EVERY page it holds, one after another, so a refetch from the
 * bottom of a long list would re-read hundreds of rows to learn about the newest few. `refetch`
 * cuts the cache back to page one first: the list restarts from the top, which is also where a
 * pull-to-refresh or a return to the screen expects to be. (A mutation that INVALIDATES the key
 * still refetches the pages already loaded, which is bounded by how far the customer scrolled.)
 */
export interface PagedScreenQuery<TData> extends ScreenQuery<TData> {
  /** Another page exists and no request for it is failing. */
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  /** The NEXT page failed; the pages already loaded are intact. */
  readonly loadMoreError: AppError | null;
  /** Fetch the next page. A no-op while one is in flight, after the last, or while one failed. */
  readonly loadMore: () => void;
  /** Try the failed next page again. */
  readonly retryLoadMore: () => void;
}

export interface ApiInfiniteQueryOptions<TPage, TItem> {
  readonly queryKey: QueryKey;
  readonly fetchPage: (input: { cursor: string | null; signal: AbortSignal }) => Promise<TPage>;
  readonly getNextCursor: (page: TPage) => string | null;
  readonly getItems: (page: TPage) => readonly TItem[];
  readonly enabled?: boolean;
  readonly staleTime?: number;
}

export function useApiInfiniteQuery<TPage, TItem>(
  options: ApiInfiniteQueryOptions<TPage, TItem>,
): PagedScreenQuery<readonly TItem[]> {
  const queryClient = useQueryClient();
  const { queryKey, getItems, getNextCursor } = options;

  const query = useInfiniteQuery<
    TPage,
    AppError,
    InfiniteData<TPage, string | null>,
    QueryKey,
    string | null
  >({
    queryKey,
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) => options.fetchPage({ cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => getNextCursor(lastPage),
    ...(options.enabled === undefined ? {} : { enabled: options.enabled }),
    ...(options.staleTime === undefined ? {} : { staleTime: options.staleTime }),
  });

  const items = useMemo<readonly TItem[] | undefined>(
    () =>
      query.data === undefined ? undefined : query.data.pages.flatMap((page) => getItems(page)),
    [query.data, getItems],
  );

  const state = useMemo<DataState<readonly TItem[]>>(() => {
    if (items !== undefined) return ready(items);
    if (query.error !== null && query.error !== undefined)
      return failed(normalizeError(query.error));
    return LOADING;
  }, [items, query.error]);

  const queryRefetch = query.refetch;
  const refetch = useCallback(() => {
    queryClient.setQueryData<InfiniteData<TPage, string | null>>(queryKey, (data) =>
      data === undefined
        ? data
        : { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) },
    );
    void queryRefetch();
  }, [queryClient, queryKey, queryRefetch]);

  // A failed next page leaves `data` in place; TanStack names that case itself.
  const loadMoreError =
    query.isFetchNextPageError && query.error !== null && query.error !== undefined
      ? normalizeError(query.error)
      : null;

  const hasNextPage = query.hasNextPage;
  const isFetchingNextPage = query.isFetchingNextPage;
  const fetchNextPage = query.fetchNextPage;

  /**
   * One request per page, however fast the list asks.
   *
   * `onEndReached` can fire several times before the first call has re-rendered the screen, so
   * `isFetchingNextPage` read from this render is stale by then. The ref is set synchronously and
   * cleared when the request settles. `cancelRefetch: false` matters as much: TanStack's default
   * CANCELS an in-flight page fetch and starts it again.
   */
  const inFlight = useRef(false);
  const requestNextPage = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    void fetchNextPage({ cancelRefetch: false }).finally(() => {
      inFlight.current = false;
    });
  }, [fetchNextPage]);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || loadMoreError !== null) return;
    requestNextPage();
  }, [hasNextPage, isFetchingNextPage, loadMoreError, requestNextPage]);
  const retryLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    requestNextPage();
  }, [hasNextPage, isFetchingNextPage, requestNextPage]);

  return useMemo(
    () => ({
      state,
      refetch,
      hasMore: hasNextPage && loadMoreError === null,
      loadingMore: isFetchingNextPage,
      loadMoreError,
      loadMore,
      retryLoadMore,
    }),
    [state, refetch, hasNextPage, isFetchingNextPage, loadMoreError, loadMore, retryLoadMore],
  );
}
