import { createKeyFactory } from '@core/query';

/**
 * Feature: history (past bookings + refunds).
 *
 * Screens: `6:227` Past bookings, `71:615` Refunds (a separate top-level destination reached
 * from Profile → My refunds, not a filter of history).
 *
 * Ruling R-5 — this screen is PAST bookings only; active bookings live on Home.
 *
 * Boundary: refund status and amounts are server-provided and displayed as-is.
 *
 * TODO(product B-15): cancelled bookings currently have nowhere to appear — the drawn status set
 * is Completed | Unfulfilled, and a cancelled booking is neither active nor either of those.
 * TODO(backend-contract): no history or refund endpoints, and no status values, exist.
 */
export const historyKeys = createKeyFactory('history');

export { useBookingHistoryData, useRefundHistoryData } from './data';
export { BookingListView } from './screens/BookingListScreen';
export type { BookingListViewProps } from './screens/BookingListScreen';
export type * from './types';
