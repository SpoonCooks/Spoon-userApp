import { formatPaise } from '@core/format';
import type { BookingSummaryDto } from '@features/booking';
import type { BookingCardViewModel, StatusTone } from '@ui';

import type { BookingListViewModel } from './types';

/**
 * History adapters.
 *
 * Money is formatted by `@core/format`, which owns the single paise-to-rupees conversion in the
 * app. Nothing here sums, taxes or discounts.
 *
 * ## Status labels
 *
 * The backend's seven statuses collapse into the pill vocabulary the frames draw. Two of the
 * drawn labels have no backend status behind them, and two backend statuses have no drawn label:
 *
 *  - `Unfulfilled` (drawn) has no status; the closest real thing is a system cancellation, which
 *    is what it is mapped from.
 *  - the drawn set has no `Cancelled` pill at all (recorded as B-15), so a customer cancellation
 *    reuses the neutral tone rather than inventing a pill the design never drew.
 */

const STATUS_PRESENTATION: Record<string, { readonly label: string; readonly tone: StatusTone }> = {
  created: { label: 'Confirmed', tone: 'info' },
  assigned: { label: 'Confirmed', tone: 'info' },
  cook_en_route: { label: 'On the way', tone: 'info' },
  cook_arrived: { label: 'Arrived', tone: 'info' },
  cooking: { label: 'In service', tone: 'info' },
  completed: { label: 'Completed', tone: 'positive' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/** `6:245` — "12th April • 1 hr". */
export function headlineFor(dto: BookingSummaryDto): string {
  const duration =
    dto.durationMinutes % 60 === 0
      ? `${dto.durationMinutes / 60} hr`
      : `${dto.durationMinutes} mins`;

  if (dto.scheduledStart === null) return duration;
  const date = new Date(dto.scheduledStart);
  if (Number.isNaN(date.getTime())) return duration;

  const day = date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  return `${day} • ${duration}`;
}

export function bookingCardFrom(dto: BookingSummaryDto): BookingCardViewModel {
  const presentation = STATUS_PRESENTATION[dto.status];

  return {
    id: dto.id,
    headline: headlineFor(dto),
    ...(presentation === undefined
      ? {}
      : { statusLabel: presentation.label, statusTone: presentation.tone }),
    amount: formatPaise(dto.price.totalAmountPaise),
    ...(dto.addressLabel === null || dto.addressLabel === undefined
      ? {}
      : { subtitle: dto.addressLabel }),
  };
}

export function bookingListFrom(input: {
  readonly base: BookingListViewModel;
  readonly bookings: readonly BookingSummaryDto[];
}): BookingListViewModel {
  return { ...input.base, bookings: input.bookings.map(bookingCardFrom) };
}
