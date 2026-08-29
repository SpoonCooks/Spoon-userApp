import type { ScheduledAvailabilityDto } from '@features/availability';
import { durationLabelFor, durationMerchandisingFor } from '@features/booking';
import type { Catalogue } from '@features/catalogue';
import { formatPaise } from '@core/format';

import {
  addServiceDays,
  formatServiceDate,
  formatServiceTime,
  isWithinPeriod,
  localMinuteIn,
  serviceDateIn,
} from './serviceTime';

import type {
  ScheduleDayOption,
  SchedulePeriodOption,
  ScheduleSlotOption,
  ScheduleViewModel,
} from './types';

/**
 * Schedule adapters.
 *
 * ## The horizon is published, not assumed
 *
 * Blocker B-8 said "no booking horizon is encoded — whatever days the payload carries are the
 * days shown". The catalogue now publishes `scheduled.horizonDays`, so the day strip is generated
 * FROM that number rather than from a constant. The client still encodes no horizon of its own:
 * change the policy and the strip changes without a release.
 *
 * ## Slots are never generated
 *
 * Every slot in the grid is a `start` the SERVER returned, with the SERVER's `available` flag.
 * The 15-minute interval is published too (`slotIntervalMinutes`) but is used for nothing here —
 * the client does not step through a range producing times, because a slot that exists in the UI
 * and not on the server is a booking that fails at the last step.
 */

/**
 * Service `YYYY-MM-DD` for the availability query. Not an instant — a calendar date.
 *
 * Resolved in the SERVICE timezone, because that is the day the backend will read the string as.
 * Taken off the device instead, a handset an hour behind India asks for the wrong day at midnight
 * and is answered, correctly, about a day the customer did not pick.
 */
export function toServiceDate(date: Date, timeZone?: string): string {
  return serviceDateIn(timeZone, date);
}

/** The day strip, sized by the published horizon. */
export function daysFrom(
  catalogue: Catalogue,
  now: Date = new Date(),
): readonly ScheduleDayOption[] {
  const timeZone = catalogue.operatingWindow.timeZone;
  const today = serviceDateIn(timeZone, now);

  return Array.from({ length: catalogue.scheduled.horizonDays }, (_unused, offset) => {
    // Stepped on the DATE, not on an instant: adding days to a local `Date` can be dragged across
    // a boundary by the device's offset, and the strip would then offer a day the server does not
    // recognise as today+n.
    const id = addServiceDays(today, offset);

    return {
      id,
      /**
       * The FULL weekday, not the three-letter abbreviation.
       *
       * `weekday: 'short'` drew "THU" beside "TODAY" and "TOMORROW" — two words spelled out and
       * the third clipped to an abbreviation, in the same row, at the same size. The strip is
       * generated from the published horizon so the caption has to read correctly for whatever
       * day lands in it; "THURSDAY" is what the other two captions imply.
       *
       * The caption is `numberOfLines={1}` inside a third-of-the-row chip, which at 10pt holds
       * the longest weekday ("WEDNESDAY") comfortably.
       */
      caption:
        offset === 0
          ? 'TODAY'
          : offset === 1
            ? 'TOMORROW'
            : formatServiceDate(id, { weekday: 'long' }).toUpperCase(),
      label: formatServiceDate(id, { day: 'numeric', month: 'short' }),
    };
  });
}

/**
 * The meal-period chips.
 *
 * The ids and boundaries are the catalogue's. The ICON is design: the frame draws a sunrise, a
 * sun and a moon, and no endpoint serves an icon name. It is selected by position rather than by
 * matching on the period id, so a renamed period still gets a sensible mark.
 */
const PERIOD_ICONS: readonly SchedulePeriodOption['icon'][] = ['sunrise', 'sun', 'moon'];

/**
 * The meal-period chips, with the ones that have already ELAPSED drawn disabled.
 *
 * ## Why the clock is allowed to decide this, when it decides nothing else here
 *
 * Everything else in this file refuses to evaluate availability: the server judges each start
 * time and the client renders the verdict. A period boundary is a different kind of fact. It is
 * a PUBLISHED constant (`catalogue.scheduled.periods`) compared against the current service
 * minute — no cook, no route and no capacity enters into it — and the comparison can only ever
 * agree with the server, because every start inside an elapsed window is a start in the past and
 * the scheduler already returns those as `available: false, reason: 'SLOT_IN_PAST'`.
 *
 * So this narrows nothing. It moves a verdict the server has already given from the bottom of the
 * screen up to the control that leads there: at 8 PM, tapping "Morning" used to open a duration
 * section and then a grid of uniformly grey cards, three taps to learn what the chip could have
 * said outright.
 *
 * ## Only TODAY is gated
 *
 * A date the customer has not selected yet defaults to today, which is what the availability read
 * defaults to as well. Every other day in the horizon is wholly in the future, so all three of
 * its periods stay live — a 6 AM Morning tomorrow is bookable at 8 PM tonight.
 *
 * The comparison is `endMinute <= now`: a period is dead only once it is entirely behind us.
 * A window still open keeps its chip live even when the remaining minutes hold no bookable start
 * for the chosen duration — that is a routing verdict, it belongs to the server, and the grid
 * shows it as the greyed cards the frames draw.
 */
export function periodsFrom(
  catalogue: Catalogue,
  options: { readonly serviceDate?: string | null; readonly now?: Date } = {},
): readonly SchedulePeriodOption[] {
  const timeZone = catalogue.operatingWindow.timeZone;
  const now = options.now ?? new Date();
  const today = serviceDateIn(timeZone, now);
  // The screen opens with no day chosen and the read defaults to today, so an absent date is today.
  const onToday = (options.serviceDate ?? today) === today;
  const nowMinute = localMinuteIn(timeZone, now);

  return catalogue.scheduled.periods.map((period, index) => {
    const elapsed = onToday && period.endMinute <= nowMinute;

    return {
      id: period.id,
      label: period.id.charAt(0) + period.id.slice(1).toLowerCase(),
      icon: PERIOD_ICONS[index] ?? 'sun',
      ...(elapsed ? { disabled: true } : {}),
    };
  });
}

/**
 * Which published period a slot instant belongs to, by SERVICE minute-of-day.
 *
 * The boundaries are published in the service timezone, so the instant has to be read in it too.
 * Reading the device clock instead filed a 12:00 IST slot under MORNING on a UTC handset — the
 * grouping bug behind a Noon section that showed the wrong cards, or none.
 */
function periodIdFor(catalogue: Catalogue, start: Date): string | null {
  const minute = localMinuteIn(catalogue.operatingWindow.timeZone, start);
  const period = catalogue.scheduled.periods.find((candidate) => isWithinPeriod(minute, candidate));
  return period?.id ?? null;
}

/**
 * Buckets the server's slots into the published periods.
 *
 * The slot's `id` is its ISO `start`, verbatim, so the booking request sends back exactly the
 * instant the server offered — no re-parsing, no local re-derivation, no timezone round trip.
 */
export function slotsByPeriodFrom(input: {
  readonly catalogue: Catalogue;
  readonly availability: ScheduledAvailabilityDto | null;
}): Readonly<Record<string, readonly ScheduleSlotOption[]>> {
  const buckets: Record<string, ScheduleSlotOption[]> = {};
  for (const period of input.catalogue.scheduled.periods) buckets[period.id] = [];

  if (input.availability === null) return buckets;

  for (const slot of input.availability.slots) {
    const start = new Date(slot.start);
    if (Number.isNaN(start.getTime())) continue;

    const periodId = periodIdFor(input.catalogue, start);
    if (periodId === null) continue;

    buckets[periodId]?.push({
      id: slot.start,
      // Written on the SERVICE clock: the instant is the server's, so the hand on the card has to
      // be the server's too, or a UTC handset offers "6:30 AM" for a slot the server called noon.
      label: formatServiceTime(input.catalogue.operatingWindow.timeZone, start),
      // The SERVER's availability flag, never a comparison against the clock. An unavailable slot
      // is DISABLED, never dropped: the frames draw it grey, and a card that vanishes tells the
      // customer nothing about a time that simply cannot be booked yet.
      ...(slot.available ? {} : { disabled: true, unavailableReason: slot.reason }),
    });
  }

  return buckets;
}

/**
 * The duration tiles, priced by the catalogue.
 *
 * `durationLabelFor` and `formatPaise` are SHARED with the Instant sheet, deliberately. This
 * function used to carry its own copy of both rules and both had drifted: the label converted
 * only exact multiples of 60, so `275:4938`'s "1.5 hr" and "2.5 hrs" were drawn "90 mins" and
 * "150 mins" here while the identical grid on `1:728` read them correctly; and the price was
 * assembled with a bare template rather than the shared formatter. One grid, one rule.
 */
export function durationsFrom(catalogue: Catalogue) {
  return catalogue.durations.map((duration) => ({
    id: `dur-${duration.durationMinutes}`,
    label: durationLabelFor(duration.durationMinutes),
    price: formatPaise(duration.serviceAmountPaise),
    // The strike / "% off" treatment, shared with Instant so the two grids can never disagree.
    ...durationMerchandisingFor(duration),
  }));
}

/**
 * Customer copy for a DAY-LEVEL refusal — the server declining the whole question rather than
 * judging individual times.
 *
 * FIGMA_PENDING: no frame draws this state. It has to say something regardless, because the
 * alternative is what shipped — the "Start time" heading over an empty space, with the reason sat
 * unread on the view model. A customer whose address is not covered was given no way to tell that
 * apart from a bug, which is the dead end §8 and §11 forbid.
 *
 * The vocabulary is CLOSED on the backend (`availabilityReasons`), so these are mapped rather than
 * guessed. An unrecognised code falls back to a line that claims nothing about the cause: a new
 * reason must not be able to put words in the server's mouth.
 */
const REJECTION_MESSAGE: Readonly<Record<string, string>> = {
  NOT_SERVICEABLE: 'Spoon does not reach this address yet. Try another saved address.',
  SOCIETY_NOT_SUPPORTED: 'Spoon is not live in this society yet. Try another saved address.',
  OUTSIDE_BOOKING_WINDOW: 'This day is outside the booking window. Pick a nearer day.',
  DURATION_NOT_ALLOWED: 'This duration is not offered here. Pick another duration.',
};

/** What the customer is told when the server refused the day. Never invents a cause. */
export function rejectionMessageFor(reason: string): string {
  return (
    REJECTION_MESSAGE[reason] ??
    'Start times cannot be shown for this selection right now. Try another day or duration.'
  );
}

export function scheduleFrom(input: {
  readonly base: ScheduleViewModel;
  readonly catalogue: Catalogue;
  readonly availability: ScheduledAvailabilityDto | null;
  /**
   * The availability read has not answered for the CURRENT day/duration yet.
   *
   * Distinct from "answered with nothing". An empty grid is a real answer — a period the server
   * offers no candidate times for — and the frames draw it as an empty section. A grid that is
   * merely not back yet is not that answer, and drawing the two the same way is what let a failed
   * or in-flight read read as "no slots available" (task §8).
   */
  readonly slotsPending?: boolean;
  /**
   * The service date the grid currently describes — the customer's chosen day, or today.
   *
   * Carried only so `periodsFrom` knows whether the clock applies. It selects no slots and asks
   * for nothing; the availability read already took the same date as its argument.
   */
  readonly serviceDate?: string | null;
  readonly now?: Date;
}): ScheduleViewModel {
  const { base, catalogue } = input;
  const pending = input.slotsPending ?? false;
  const now = input.now ?? new Date();
  // A day-level refusal (`SOCIETY_NOT_SUPPORTED`, `OUTSIDE_BOOKING_WINDOW`) is the server refusing
  // the whole question, not a verdict on individual times. Carried so the state is distinguishable
  // rather than silently identical to an empty grid.
  const rejection = input.availability?.rejection ?? undefined;

  return {
    ...base,
    days: daysFrom(catalogue, now),
    periods: periodsFrom(catalogue, {
      ...(input.serviceDate === undefined ? {} : { serviceDate: input.serviceDate }),
      now,
    }),
    // Reschedule moves WHEN, never HOW LONG — so it publishes no duration tiles.
    ...(base.mode === 'reschedule' ? {} : { durations: durationsFrom(catalogue) }),
    slotsByPeriod: slotsByPeriodFrom({
      catalogue,
      availability: pending ? null : input.availability,
    }),
    slotsPending: pending,
    ...(rejection === null || rejection === undefined
      ? {}
      : { slotsRejection: rejection, slotsMessage: rejectionMessageFor(rejection) }),
  };
}
