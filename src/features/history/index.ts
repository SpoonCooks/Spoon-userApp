import { createKeyFactory } from '@core/query';

/**
 * Feature: history (My bookings + refunds).
 *
 * Screens: `6:227` My bookings (Upcoming/Past tabs — the redesign of what was "Past bookings"),
 * `71:615` Refunds (a separate top-level destination reached from Profile → My refunds, not a
 * filter of history).
 *
 * Boundary: refund status and amounts are server-provided and displayed as-is.
 */
export const historyKeys = createKeyFactory('history');

export {
  useBookingHistoryData,
  useMyBookingsData,
  useRefundHistoryData,
  useUpcomingBookingsData,
} from './data';
export type { MyBookingsData } from './data';
export { myBookingPresentationFor } from './adapters';
export { BookingTabSwitcher } from './components/BookingTabSwitcher';
export type { BookingTabOption, BookingTabSwitcherProps } from './components/BookingTabSwitcher';
export { BookingListView } from './screens/BookingListScreen';
export type { BookingListViewProps } from './screens/BookingListScreen';
export type * from './types';
