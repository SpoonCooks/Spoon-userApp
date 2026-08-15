import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { DEMO_CANCELLATION } from '@/demo/fixtures/screens';
import type { CancellationViewModel } from './types';

/**
 * TODO(backend-contract): fee, refund and eligibility values are all server-owned. The client
 * never evaluates the fee tier or computes the refund.
 */
export function useCancellationData(): ScreenQuery<CancellationViewModel> {
  return useDevFixture(DEMO_CANCELLATION);
}
