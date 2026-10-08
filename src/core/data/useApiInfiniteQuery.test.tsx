import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useApiInfiniteQuery } from './useApiInfiniteQuery';

/**
 * A cursor-paged list as a `ScreenQuery`.
 *
 * What these pin: the cursor goes back to the server untouched, pages concatenate in order, the
 * list ends on `null`, a failing LATER page leaves the rows already read on screen (and can be
 * retried), and `refetch` restarts from the newest page instead of re-reading everything loaded.
 */

interface Page {
  readonly items: readonly number[];
  readonly next: string | null;
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const itemsOf = (page: Page) => page.items;
const nextOf = (page: Page) => page.next;

/** Three pages: [1,2] → [3,4] → [5], with opaque cursors that are not numbers. */
function threePages(fail?: { page: string; times: number }) {
  const calls: (string | null)[] = [];
  let failures = fail?.times ?? 0;
  const fetchPage = jest.fn(async ({ cursor }: { cursor: string | null }): Promise<Page> => {
    calls.push(cursor);
    if (fail !== undefined && cursor === fail.page && failures > 0) {
      failures -= 1;
      throw new Error('network');
    }
    if (cursor === null) return { items: [1, 2], next: 'cursor-b' };
    if (cursor === 'cursor-b') return { items: [3, 4], next: 'cursor-c' };
    return { items: [5], next: null };
  });
  return { calls, fetchPage };
}

function render(fetchPage: ReturnType<typeof threePages>['fetchPage'], queryClient = client()) {
  return renderHook(
    () =>
      useApiInfiniteQuery<Page, number>({
        queryKey: ['list'],
        fetchPage,
        getNextCursor: nextOf,
        getItems: itemsOf,
      }),
    { wrapper: wrapperFor(queryClient) },
  );
}

const rows = (result: { current: { state: { status: string; data?: readonly number[] } } }) =>
  result.current.state.status === 'ready' ? result.current.state.data : undefined;

describe('useApiInfiniteQuery', () => {
  it('starts on the first page, loading until it lands', async () => {
    const { fetchPage } = threePages();
    const { result } = render(fetchPage);

    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(rows(result)).toEqual([1, 2]);
    expect(result.current.hasMore).toBe(true);
  });

  it('walks the pages with the cursor the server gave, in order, and ends on null', async () => {
    const { calls, fetchPage } = threePages();
    const { result } = render(fetchPage);
    await waitFor(() => expect(rows(result)).toEqual([1, 2]));

    act(() => result.current.loadMore());
    await waitFor(() => expect(rows(result)).toEqual([1, 2, 3, 4]));
    act(() => result.current.loadMore());
    await waitFor(() => expect(rows(result)).toEqual([1, 2, 3, 4, 5]));

    expect(calls).toEqual([null, 'cursor-b', 'cursor-c']);
    expect(result.current.hasMore).toBe(false);

    // Past the end it asks for nothing.
    act(() => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('does not ask twice for a page that is already loading', async () => {
    const { fetchPage } = threePages();
    const { result } = render(fetchPage);
    await waitFor(() => expect(rows(result)).toEqual([1, 2]));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() => expect(rows(result)).toEqual([1, 2, 3, 4]));

    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('keeps the rows on screen when a LATER page fails, and retries just that page', async () => {
    const { calls, fetchPage } = threePages({ page: 'cursor-b', times: 1 });
    const { result } = render(fetchPage);
    await waitFor(() => expect(rows(result)).toEqual([1, 2]));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadMoreError).not.toBeNull());

    // The list did not blank: the screen is still `ready` with page one.
    expect(result.current.state.status).toBe('ready');
    expect(rows(result)).toEqual([1, 2]);
    expect(result.current.hasMore).toBe(false);

    // Reaching the end again does not hammer a failing page…
    act(() => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(2);

    // …but retry asks for the same cursor again.
    act(() => result.current.retryLoadMore());
    await waitFor(() => expect(rows(result)).toEqual([1, 2, 3, 4]));
    expect(result.current.loadMoreError).toBeNull();
    expect(calls).toEqual([null, 'cursor-b', 'cursor-b']);
  });

  it('reports a failed FIRST page as an error state', async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('boom'));
    const { result } = render(fetchPage);

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.loadMoreError).toBeNull();
  });

  it('restarts from the newest page on refetch instead of re-reading every loaded page', async () => {
    const { calls, fetchPage } = threePages();
    const { result } = render(fetchPage);
    await waitFor(() => expect(rows(result)).toEqual([1, 2]));
    act(() => result.current.loadMore());
    await waitFor(() => expect(rows(result)).toEqual([1, 2, 3, 4]));
    calls.length = 0;

    act(() => result.current.refetch());

    await waitFor(() => expect(calls).toEqual([null]));
    await waitFor(() => expect(rows(result)).toEqual([1, 2]));
    expect(result.current.hasMore).toBe(true);
  });
});
