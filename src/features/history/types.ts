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
  /**
   * The single line drawn under the illustration on `679:1050` / `679:1147`.
   *
   * There is deliberately no second line. Both designed empty states are artwork plus one
   * sentence; the explanatory `emptyDescription` this used to carry was invented back when
   * neither screen had an empty state drawn for it.
   */
  readonly emptyTitle: string;
}
