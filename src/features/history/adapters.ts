import { formatPaise } from '@core/format';
import type { BookingSummaryCookDto, BookingSummaryDto } from '@features/booking';
import { formatServiceDate, formatServiceTime, serviceDateIn } from '@features/scheduled';
import type { BookingCardViewModel, StatusTone } from '@ui';
import { cookCardContentFor } from '@ui/components/cookCardContent';

import type { BookingListViewModel } from './types';

/**
 * History adapters.
 *
 * Money is formatted by `@core/format`, which owns the single paise-to-rupees conversion in the
 * app. Nothing here sums, taxes or discounts.
 *
 * ## The five My-bookings states
 *
 * `myBookingPresentationFor` collapses the backend's seven statuses (plus `policyBand` and
 * `rescheduleCount`) into exactly the five states the My-bookings screen draws: Completed,
 * Cancelled, Unfulfilled, Confirmed, Rescheduled. This is a SINGLE function used by BOTH tabs —
 * it does not branch on which tab is rendering it. That's confirmed, not assumed: the same
 * system-cancelled, fully-refunded booking legitimately renders "Unfulfilled" on the Upcoming tab
 * too (it's the live "apology" row there, and history on the Past tab, at the same time), so a
 * tab-aware label would have shown two different words for the identical fact.
 */

/**
 * Status/policy/reschedule -> one of the five drawn states.
 *
 * Order matters: `status` is checked before `rescheduleCount` so a booking that was rescheduled
 * and later completed reads "Completed," not "Rescheduled" — rescheduling is history once the
 * meal happened. `cancelledBy` alone cannot choose between Cancelled and Unfulfilled: `'system'`
 * covers both a genuine platform failure AND an abandoned, never-paid checkout, and `'operations'`
 * covers both an ops-mediated cancellation the customer themselves requested and a genuine
 * post-dispatch failure ops declared. `policyBand` is the one unambiguous field — only
 * `'SERVICE_FAILURE_FULL_REFUND'` means Spoon actually failed to deliver a paid booking.
 */
export function myBookingPresentationFor(
  // `cancelledBy` is accepted but deliberately unread below — see the doc comment above for why
  // it alone can never choose the label. Kept in the parameter type so a caller can pass a real
  // row (or a real example fixture) verbatim rather than stripping a field first.
  dto: Pick<BookingSummaryDto, 'status' | 'cancelledBy' | 'policyBand' | 'rescheduleCount'>,
): { readonly label: string; readonly tone: StatusTone } {
  if (dto.status === 'completed') return { label: 'Completed', tone: 'positive' };

  if (dto.status === 'cancelled') {
    // 'warning' matches the existing DEMO_BOOKING_UNFULFILLED fixture's tone — Spoon's own
    // failure is drawn with more weight than a plain customer-initiated cancellation.
    return dto.policyBand === 'SERVICE_FAILURE_FULL_REFUND'
      ? { label: 'Unfulfilled', tone: 'warning' }
      : { label: 'Cancelled', tone: 'neutral' }; // includes CHECKOUT_EXPIRED_NO_PAYMENT
  }

  // created / assigned / cook_en_route / cook_arrived / cooking — one pill on this screen.
  // Deliberate: this screen is a flat historical index; Home already owns live-tracking detail
  // (arriving/arrived/in-service), so drawing that granularity again here would duplicate it.
  return dto.rescheduleCount === 1
    ? { label: 'Rescheduled', tone: 'info' }
    : { label: 'Confirmed', tone: 'info' };
}

/**
 * `6:245` — "12th April • 1 hr".
 *
 * The day is read on the SERVICE clock, not the device's. `scheduledStart` is an instant, and
 * asking a handset what calendar day it falls on is a different question: a booking at
 * 2026-08-26T00:30+05:30 is the 26th in India and the 25th on a UTC phone. The date on a booking
 * card is calendar-day semantics, so it takes the timezone the backend publishes — the same rule
 * the Schedule grid follows, through the same helpers.
 *
 * `timeZone` is threaded in rather than hardcoded because it is the catalogue's
 * `operatingWindow.timeZone`; `undefined` falls back to the device reading, which is what this
 * did everywhere before, so a catalogue that has not loaded degrades instead of blanking a label.
 */
export function headlineFor(
  dto: Pick<BookingSummaryDto, 'scheduledStart' | 'durationMinutes'>,
  timeZone?: string | undefined,
): string {
  const duration =
    dto.durationMinutes % 60 === 0
      ? `${dto.durationMinutes / 60} hr`
      : `${dto.durationMinutes} mins`;

  if (dto.scheduledStart === null) return duration;
  const instant = new Date(dto.scheduledStart);
  if (Number.isNaN(instant.getTime())) return duration;

  const day = formatServiceDate(serviceDateIn(timeZone, instant), {
    day: 'numeric',
    month: 'long',
  });
  return `${day} • ${duration}`;
}

/**
 * The card's cook fields from the summary's remembered cook.
 *
 * The photograph resolves exactly as the live cook card resolves it: a hosted `profileImageUrl`
 * wins, else the bundled per-`profileCode` photograph, else no photo and the card draws its
 * initials disc. Carries no rating: the cook's own published average (`cook.ratingAverage`) is a
 * different fact from what a booking card should show here, and is never surfaced by this
 * function — see `bookingCardFrom`, which sources a booking's own rating from `ratingStars`.
 */
export function cookFieldsFrom(
  cook: BookingSummaryCookDto | null | undefined,
): Pick<BookingCardViewModel, 'cookName' | 'cookPhotoUrl'> {
  if (cook === null || cook === undefined) return {};
  const photoUrl = cook.profileImageUrl ?? cookCardContentFor(cook.profileCode)?.photoUrl;
  return {
    cookName: cook.displayName,
    ...(photoUrl === undefined ? {} : { cookPhotoUrl: photoUrl }),
  };
}

/**
 * The card's second line — "Scheduled • 4:00 PM" or "Instant". `slotType` decides which; for a
 * scheduled booking the clock half is read on the SERVICE timezone (`formatServiceTime`), the
 * same rule `headlineFor`'s calendar day already follows, so a booking near midnight reads the
 * same time on every handset regardless of the reader's own timezone.
 */
function slotSubtitleFor(
  dto: Pick<BookingSummaryDto, 'slotType' | 'scheduledStart'>,
  timeZone?: string | undefined,
): string {
  if (dto.slotType === 'instant') return 'Instant';
  if (dto.scheduledStart === null) return 'Scheduled';
  const instant = new Date(dto.scheduledStart);
  if (Number.isNaN(instant.getTime())) return 'Scheduled';
  return `Scheduled • ${formatServiceTime(timeZone, instant)}`;
}

export function bookingCardFrom(
  dto: BookingSummaryDto,
  timeZone?: string | undefined,
): BookingCardViewModel {
  const presentation = myBookingPresentationFor(dto);

  return {
    id: dto.id,
    headline: headlineFor(dto, timeZone),
    statusLabel: presentation.label,
    statusTone: presentation.tone,
    amount: formatPaise(dto.price.totalAmountPaise),
    ...cookFieldsFrom(dto.cook),
    // The customer's OWN rating for THIS booking — never the cook's aggregate average.
    ...(dto.ratingStars === null || dto.ratingStars === undefined
      ? {}
      : { rating: dto.ratingStars }),
    subtitle: slotSubtitleFor(dto, timeZone),
  };
}

export function bookingListFrom(input: {
  readonly base: BookingListViewModel;
  readonly bookings: readonly BookingSummaryDto[];
  /** The catalogue's service timezone, so every card's date is read on the same clock. */
  readonly timeZone?: string | undefined;
}): BookingListViewModel {
  return {
    ...input.base,
    bookings: input.bookings.map((dto) => bookingCardFrom(dto, input.timeZone)),
  };
}
