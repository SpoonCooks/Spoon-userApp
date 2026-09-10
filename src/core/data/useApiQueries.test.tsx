import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useApiQueries } from './useApiQueries';

/**
 * `useApiQueries` used to hand back a brand-new array of brand-new objects on every render,
 * whether or not any query's data had actually changed — which meant a caller's own `useMemo`
 * built from this hook's output could never skip recomputation. These tests lock down the fix:
 * `combine` (structural sharing) plus a `refetch` wrapper cached per query key, so an unchanged
 * result is the SAME reference across renders, not just deep-equal to it.
 */

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function client(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('useApiQueries', () => {
  it('gives each entry its own state — one failure does not fail the others', async () => {
    const { result } = renderHook(
      () =>
        useApiQueries<number>([
          { queryKey: ['a'], queryFn: () => Promise.resolve(1) },
          {
            queryKey: ['b'],
            queryFn: () => Promise.reject(new Error('boom')),
          },
        ]),
      { wrapper: wrapperFor(client()) },
    );

    await waitFor(() => expect(result.current[0]?.state.status).toBe('ready'));
    await waitFor(() => expect(result.current[1]?.state.status).toBe('error'));
    expect(result.current[0]?.state).toMatchObject({ status: 'ready', data: 1 });
  });

  it('returns the SAME array, item and refetch reference across a re-render once settled', async () => {
    const { result, rerender } = renderHook(
      () => useApiQueries<number>([{ queryKey: ['stable'], queryFn: () => Promise.resolve(42) }]),
      { wrapper: wrapperFor(client()) },
    );

    await waitFor(() => expect(result.current[0]?.state.status).toBe('ready'));
    const first = result.current;

    // An unrelated re-render with the exact same query list — nothing about the data changed.
    rerender({});

    expect(result.current).toBe(first);
    expect(result.current[0]).toBe(first[0]);
    expect(result.current[0]?.refetch).toBe(first[0]?.refetch);
  });

  it('reuses the same refetch wrapper for a query that moves position across renders', async () => {
    const optionsFor = (order: readonly string[]) =>
      order.map((id) => ({ queryKey: ['booking', id], queryFn: () => Promise.resolve(id) }));

    const { result, rerender } = renderHook(
      ({ order }: { order: readonly string[] }) => useApiQueries<string>(optionsFor(order)),
      { wrapper: wrapperFor(client()), initialProps: { order: ['a', 'b'] } },
    );

    await waitFor(() =>
      expect(result.current.every((entry) => entry.state.status === 'ready')).toBe(true),
    );
    const refetchForA = result.current[0]?.refetch;

    rerender({ order: ['b', 'a'] });
    await waitFor(() =>
      expect(result.current.every((entry) => entry.state.status === 'ready')).toBe(true),
    );

    // 'a' is now at index 1 — still the SAME wrapper, since it's cached by query key, not slot.
    expect(result.current[1]?.refetch).toBe(refetchForA);
  });
});
