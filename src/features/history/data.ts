import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { DEMO_BOOKING_HISTORY, DEMO_REFUND_HISTORY } from '@/demo/fixtures/screens';
import type { BookingListViewModel } from './types';

/**
 * TODO(backend-contract): no history or refund endpoints exist, and the drawn status sets are
 * incomplete — no `Cancelled` (B-15) and no `Failed` refund state (D-15).
 */
export function useBookingHistoryData(): ScreenQuery<BookingListViewModel> {
  return useDevFixture(DEMO_BOOKING_HISTORY);
}

export function useRefundHistoryData(): ScreenQuery<BookingListViewModel> {
  return useDevFixture(DEMO_REFUND_HISTORY);
}
