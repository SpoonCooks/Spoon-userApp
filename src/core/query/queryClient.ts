import { QueryClient } from '@tanstack/react-query';

import { isAppError, isRetryable } from '@core/errors';

/**
 * Query defaults. (FRONTEND_FOUNDATION_PLAN.md §6)
 *
 * The backend owns booking state, so nearly everything on screen is a cache of server truth.
 * Mutations invalidate rather than optimistically rewriting booking state — the client is not
 * entitled to predict a transition it does not own.
 */

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Conservative: lifecycle screens refetch on focus rather than trusting a long cache.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (failureCount >= MAX_RETRIES) return false;
          return isAppError(error) ? isRetryable(error) : false;
        },
      },
      mutations: {
        // Never auto-retry a mutation: a retried booking action could double-submit.
        retry: false,
      },
    },
  });
}
