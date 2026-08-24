import type { ScheduledAvailabilityDto } from '@features/availability';
import { durationLabelFor } from '@features/booking';
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
      caption:
        offset === 0
          ? 'TODAY'
          : offset === 1
            ? 'TOMORROW'
            : formatServiceDate(id, { weekday: 'short' }).toUpperCase(),
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

export function periodsFrom(catalogue: Catalogue): readonly SchedulePeriodOption[] {
  return catalogue.scheduled.periods.map((period, index) => ({
    id: period.id,
    label: period.id.charAt(0) + period.id.slice(1).toLowerCase(),
    icon: PERIOD_ICONS[index] ?? 'sun',
  }));
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
  }));
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
  readonly now?: Date;
}): ScheduleViewModel {
  const { base, catalogue } = input;
  const pending = input.slotsPending ?? false;
  // A day-level refusal (`SOCIETY_NOT_SUPPORTED`, `OUTSIDE_BOOKING_WINDOW`) is the server refusing
  // the whole question, not a verdict on individual times. Carried so the state is distinguishable
  // rather than silently identical to an empty grid.
  const rejection = input.availability?.rejection ?? undefined;

  return {
    ...base,
    days: daysFrom(catalogue, input.now ?? new Date()),
    periods: periodsFrom(catalogue),
    // Reschedule moves WHEN, never HOW LONG — so it publishes no duration tiles.
    ...(base.mode === 'reschedule' ? {} : { durations: durationsFrom(catalogue) }),
    slotsByPeriod: slotsByPeriodFrom({
      catalogue,
      availability: pending ? null : input.availability,
    }),
    slotsPending: pending,
    ...(rejection === null || rejection === undefined ? {} : { slotsRejection: rejection }),
  };
}
