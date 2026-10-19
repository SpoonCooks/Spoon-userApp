import type { ScheduledAvailabilityDto, ScheduledOverviewDto } from '@features/availability';
import { durationIdFor, strikePaiseFor } from '@features/booking';
import { priceForSlot, type Catalogue } from '@features/catalogue';
import type { TimeOfDayId } from '@ui/v2/TimePicker';

import {
  addServiceDays,
  formatServiceDate,
  periodsFrom,
  serviceDateIn,
  slotsByPeriodFrom,
} from '@features/scheduled';

/**
 * Schedule for Later (Figma `2466:18844` / `2466:18864` / `2466:19025`, DEC-094) — the model.
 *
 * Built from the catalogue (durations, prices, the three periods) and the three-day overview
 * (`GET /v1/availability/scheduled/overview`), so every choice already knows what is free:
 *
 *   duration      greyed when nothing is free for it on any of the three days
 *   day           greyed when nothing is free that whole day for the chosen duration
 *   time of day   greyed when nothing is free in it (or it has already passed today)
 *   start time    greyed when the server says it is not free
 *
 * Unknown is bookable, as on Home: before the overview lands, or on a server without it, nothing
 * is greyed and the chosen day falls back to the single-day read (`fallbackDay`). The booking
 * request stays the authority on a start time either way.
 */

export interface LaterDuration {
  /** `dur-90`: the booking flow's handle for a duration. */
  readonly id: string;
  readonly minutes: number;
  /** Home's tile wording: "45 mins", "1 hr", "1.5 hrs". */
  readonly label: string;
  readonly pricePaise: number;
  readonly mrpPaise: number | null;
  readonly payablePaise: number;
  readonly available: boolean;
}

export interface LaterDay {
  readonly id: string;
  /** `2466:19034` — "Today", "Tomorrow", then the weekday. */
  readonly caption: string;
  /** `2466:19035` — the day of the month. */
  readonly dayNumber: string;
  readonly available: boolean;
}

export interface LaterSlot {
  /** The server's ISO start, sent back verbatim when booking. */
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
}

export interface LaterPeriod {
  /** The catalogue's period id. */
  readonly id: string;
  readonly timeOfDay: TimeOfDayId;
  readonly label: string;
  /** Something is free in it; false once it has passed today too. */
  readonly available: boolean;
  readonly slots: readonly LaterSlot[];
}

export interface LaterModel {
  readonly durations: readonly LaterDuration[];
  readonly days: readonly LaterDay[];
  /** The chosen day's periods for the chosen duration, or empty until both are chosen. */
  readonly periods: readonly LaterPeriod[];
  /** The chosen day's answer has not arrived yet (only on the single-day fallback). */
  readonly slotsPending: boolean;
  /** The server refused the address (or the day) as a whole: why, in its own code. */
  readonly rejection: string | null;
}

const TIMES_OF_DAY: readonly TimeOfDayId[] = ['morning', 'afternoon', 'evening'];

/** "45 mins", "1 hr", "1.5 hrs" — the carousel's wording (Home and `2466:19028`). */
export function laterDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return hours > 1 ? `${text} hrs` : `${text} hr`;
}

/** `dur-90` → 90; anything else → null. */
export function minutesOfDurationId(id: string | null): number | null {
  if (id === null || !id.startsWith('dur-')) return null;
  const minutes = Number.parseInt(id.slice('dur-'.length), 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

export function laterModelFrom(input: {
  readonly catalogue: Catalogue;
  /** `undefined` while it loads, failed, or the server has no overview. */
  readonly overview: ScheduledOverviewDto | undefined;
  /** The single-day read for the chosen day, used only without an overview. */
  readonly fallbackDay?: ScheduledAvailabilityDto | null | undefined;
  readonly durationMinutes: number | null;
  readonly dayId: string | null;
  readonly now?: Date;
}): LaterModel {
  const { catalogue, overview } = input;
  const now = input.now ?? new Date();
  const timeZone = catalogue.operatingWindow.timeZone;
  const lengthOf = (minutes: number | null) =>
    minutes === null
      ? undefined
      : overview?.durations.find((length) => length.durationMinutes === minutes);

  const durations = [...catalogue.durations]
    .sort((a, b) => a.durationMinutes - b.durationMinutes)
    .map((duration): LaterDuration => {
      const price = priceForSlot(duration, 'scheduled');
      return {
        id: durationIdFor(duration.durationMinutes),
        minutes: duration.durationMinutes,
        label: laterDurationLabel(duration.durationMinutes),
        pricePaise: price.serviceAmountPaise,
        mrpPaise: strikePaiseFor({
          durationMinutes: duration.durationMinutes,
          serviceAmountPaise: price.serviceAmountPaise,
          strikePricePaise: price.strikePricePaise,
        }),
        payablePaise: price.totalAmountPaise,
        available: lengthOf(duration.durationMinutes)?.available ?? true,
      };
    });

  const today = serviceDateIn(timeZone, now);
  const dates =
    overview?.dates ??
    Array.from({ length: catalogue.scheduled.horizonDays }, (_unused, offset) =>
      addServiceDays(today, offset),
    );
  const chosenLength = lengthOf(input.durationMinutes);
  const days = dates.map((date, offset): LaterDay => {
    const answer = chosenLength?.days.find((day) => day.date === date);
    return {
      id: date,
      caption:
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Tomorrow'
            : formatServiceDate(date, { weekday: 'long' }),
      dayNumber: formatServiceDate(date, { day: 'numeric' }),
      available: answer?.available ?? true,
    };
  });

  const rejection = overview?.rejection ?? null;
  if (input.dayId === null || input.durationMinutes === null) {
    return { durations, days, periods: [], slotsPending: false, rejection };
  }

  // The chosen day's candidates: the overview's, else the single-day read's.
  const overviewDay = chosenLength?.days.find((day) => day.date === input.dayId);
  const answer: ScheduledAvailabilityDto | null =
    overviewDay !== undefined
      ? {
          date: overviewDay.date,
          durationMinutes: input.durationMinutes,
          slots: overviewDay.slots,
          rejection: overviewDay.rejection ?? null,
          validUntil: overview?.validUntil ?? now.toISOString(),
        }
      : (input.fallbackDay ?? null);
  const slotsPending = answer === null;
  const buckets = slotsByPeriodFrom({ catalogue, availability: answer });
  const clock = periodsFrom(catalogue, { serviceDate: input.dayId, now });

  const periods = clock.map((period, index): LaterPeriod => {
    const slots = (buckets[period.id] ?? []).map((slot) => ({
      id: slot.id,
      label: slot.label,
      available: slot.disabled !== true,
    }));
    return {
      id: period.id,
      timeOfDay: TIMES_OF_DAY[index] ?? 'afternoon',
      label: period.label,
      // Unknown (still loading) stays open; an answered window with nothing free is greyed.
      available: period.disabled !== true && (slotsPending || slots.some((slot) => slot.available)),
      slots,
    };
  });

  return {
    durations,
    days,
    periods,
    slotsPending,
    rejection: rejection ?? answer?.rejection ?? null,
  };
}

/** `2466:19110` — the first time of day that still has something free, or null. */
export function firstOpenPeriodId(periods: readonly LaterPeriod[]): string | null {
  return periods.find((period) => period.available)?.id ?? null;
}

/** `2466:19096` — "Thu, 15 Oct · 1:30 PM". */
export function laterSummaryWhen(dayId: string, slotLabel: string): string {
  // Built from its parts: the device locale would write "Oct 15" where the frame says "15 Oct".
  const weekday = formatServiceDate(dayId, { weekday: 'short' });
  const day = formatServiceDate(dayId, { day: 'numeric' });
  const month = formatServiceDate(dayId, { month: 'short' });
  return `${weekday}, ${day} ${month} · ${slotLabel}`;
}
