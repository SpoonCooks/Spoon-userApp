import { useCallback, useMemo, useState } from 'react';

import { LOADING, ready } from './state';
import type { DataState, ScreenQuery } from './state';

/**
 * The development data seam.
 *
 * TODO(backend-contract): every `useXData()` hook in a feature's `data.ts` currently routes
 * through here. When endpoints exist, each hook becomes a React Query `useQuery` and this module
 * is deleted — screens do not change, because they already render from `DataState`.
 *
 * Two guarantees:
 *  1. Sample values are DATA, never rules. Screens read prices, slots, durations, ETAs and
 *     statuses from the payload; they never compute or assume them.
 *  2. Nothing sample-shaped reaches a production build: outside `__DEV__` this reports `loading`,
 *     so a release build with no backend shows a loading surface rather than invented content.
 */
export function useDevFixture<T>(sample: T): ScreenQuery<T> {
  const [nonce, setNonce] = useState(0);

  const state = useMemo<DataState<T>>(
    () => (__DEV__ ? ready(sample) : LOADING),
    // `nonce` participates so a refetch produces a fresh object, mirroring real query behaviour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sample, nonce],
  );

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  return { state, refetch };
}
