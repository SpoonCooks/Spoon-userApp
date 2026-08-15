import type { BookingCardViewModel } from '@ui';

/**
 * History / refunds list view model.
 *
 * TODO(backend-contract): no history or refund endpoint exists, and no status enum exists to map
 * onto `statusLabel` / `statusTone`. The screen renders whatever presentation values it is given.
 */
export interface BookingListViewModel {
  readonly title: string;
  readonly bookings: readonly BookingCardViewModel[];
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}
