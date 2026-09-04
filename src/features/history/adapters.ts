import { formatPaise } from '@core/format';
import type { BookingSummaryCookDto, BookingSummaryDto } from '@features/booking';
import { formatServiceDate, serviceDateIn } from '@features/scheduled';
import type { BookingCardViewModel, StatusTone } from '@ui';
import { cookPhotoFor } from '@ui/components/cookPhoto';

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
  /**
   * `created` is NOT confirmed — the payment has not been finalized.
   *
   * It read "Confirmed" until a real device showed what that means: a booking whose payment never
   * completed, sitting in the list telling the customer it had.
   *
   * This label now belongs to Home, not to Past bookings. History used to admit an elapsed
   * `created` booking, and because nothing on the backend ever transitioned such a row, the
   * customer was left with a permanent "Payment pending" card on a screen with no action on it.
   * The backend's history read is terminal statuses only, and its checkout-expiry sweep turns an
   * abandoned checkout into a real `cancelled` ending. So `created` reaching a card at all means
   * the checkout is still unresolved and still cancellable — which is exactly what this says.
   */
  created: { label: 'Payment pending', tone: 'neutral' },
  assigned: { label: 'Confirmed', tone: 'info' },
  cook_en_route: { label: 'On the way', tone: 'info' },
  cook_arrived: { label: 'Arrived', tone: 'info' },
  cooking: { label: 'In service', tone: 'info' },
  completed: { label: 'Completed', tone: 'positive' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

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
 * initials disc.
 *
 * The rating here is the COOK's published average, the same figure the live card shows. That is
 * right while a booking is live — it is what the customer is being told about the person coming
 * — and wrong on a finished row, where a customer reads a star beside their own booking as the
 * score they gave it. Showing what they actually gave needs a field the summary does not carry
 * yet; until it does, a cancelled row shows none at all rather than the cook's.
 */
/** The cook's name and face without her score, for a row that has nothing to score. */
function withoutRating(
  cook: BookingSummaryCookDto | null | undefined,
): Pick<BookingCardViewModel, 'cookName' | 'cookPhotoUrl'> {
  const { rating: _rating, ...rest } = cookFieldsFrom(cook);
  return rest;
}

export function cookFieldsFrom(
  cook: BookingSummaryCookDto | null | undefined,
): Pick<BookingCardViewModel, 'cookName' | 'cookPhotoUrl' | 'rating'> {
  if (cook === null || cook === undefined) return {};
  // Was `cook.profileImageUrl ?? ...` here and `cook.photoUrl ?? ...` in the booking adapter --
  // two spellings of one server field, so whichever surface read the wrong one silently drew
  // nothing. The resolver accepts both.
  const photoUrl = cookPhotoFor(cook) ?? undefined;
  return {
    cookName: cook.displayName,
    ...(photoUrl === undefined ? {} : { cookPhotoUrl: photoUrl }),
    ...(cook.ratingAverage === null || cook.ratingAverage === undefined
      ? {}
      : { rating: cook.ratingAverage }),
  };
}

export function bookingCardFrom(
  dto: BookingSummaryDto,
  timeZone?: string | undefined,
): BookingCardViewModel {
  const presentation = STATUS_PRESENTATION[dto.status];
  const subtitle = bookingSubtitleFor(dto, timeZone);

  return {
    id: dto.id,
    headline: headlineFor(dto, timeZone),
    ...(presentation === undefined
      ? {}
      : { statusLabel: presentation.label, statusTone: presentation.tone }),
    amount: formatPaise(dto.price.totalAmountPaise),
    /*
     * A cancelled booking carries no score.
     *
     * Nobody cooked, so there was nothing to rate — and the star on those cards was the cook's
     * published average, which made four cancelled bookings all read "5" as though the customer
     * had rated each of them. It said something about the cook on a row that is about a service
     * that never happened.
     */
    ...(dto.status === 'cancelled' ? withoutRating(dto.cook) : cookFieldsFrom(dto.cook)),
    ...(subtitle === undefined ? {} : { subtitle }),
  };
}

/**
 * `6:227` — the line under the cook's name: `Scheduled · 4:00 PM`, or a bare `Instant`.
 *
 * It used to be the ADDRESS label, so every row read "Home". That is the least distinguishing
 * fact on the card — a customer's bookings are nearly all at the same address — while HOW and
 * WHEN the booking ran is what tells two rows apart. An instant booking carries no start time in
 * the frame because it had none to promise: it was whenever a cook could get there.
 */
function bookingSubtitleFor(
  dto: Pick<BookingSummaryDto, 'slotType' | 'scheduledStart'>,
  timeZone?: string | undefined,
): string | undefined {
  if (dto.slotType === 'instant') return 'Instant';
  if (dto.scheduledStart === null) return 'Scheduled';
  const instant = new Date(dto.scheduledStart);
  if (Number.isNaN(instant.getTime())) return 'Scheduled';
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timeZone === undefined ? {} : { timeZone }),
  })
    .format(instant)
    .toUpperCase();
  return `Scheduled · ${time}`;
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
