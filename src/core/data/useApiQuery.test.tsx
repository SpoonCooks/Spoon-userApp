import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useApiQuery } from './useApiQuery';

/**
 * `refetch` used to change identity on every render. Home calls it from a focus effect keyed on
 * it, so each render re-ran the effect, each refetch re-rendered, and the app flooded the API
 * (tens of thousands of availability reads, then 429s and 503s). These lock the identity down.
 */

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function client(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('useApiQuery', () => {
  it('returns the SAME result and refetch across a re-render once settled', async () => {
    const { result, rerender } = renderHook(
      () => useApiQuery<number>({ queryKey: ['stable'], queryFn: () => Promise.resolve(42) }),
      { wrapper: wrapperFor(client()) },
    );

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
    expect(result.current.refetch).toBe(first.refetch);
  });

  it('does not loop when an effect keyed on refetch calls it — even while every fetch fails', async () => {
    let calls = 0;
    const { result } = renderHook(
      () => {
        const query = useApiQuery<number>({
          queryKey: ['failing'],
          queryFn: () => {
            calls += 1;
            return Promise.reject(new Error('rate limited'));
          },
        });
        const { refetch } = query;
        useEffect(() => {
          refetch();
        }, [refetch]);
        return query;
      },
      { wrapper: wrapperFor(client()) },
    );

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(calls).toBeLessThanOrEqual(2);
  });
});
