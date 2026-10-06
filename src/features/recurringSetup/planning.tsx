import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { formatPaise } from '@core/format';
import { useAddresses } from '@features/address';

import { useRecurringCalendar, useRecurringEligibility } from './api';
import type { DurationPriceDto, RecurringCalendarDto, RecurringEligibilityDto } from './api';
import { DURATION_OPTIONS, durationIdFor, durationLabelForMinutes } from './data';
import type { RecurringDurationOption } from './types';

/**
 * What the flow plans against: the window, the day limits, the days a live Recurring booking
 * already has, and the durations on offer with their prices — DEC-086's planning reads, gathered
 * once for every step.
 *
 * Each field falls back to the flow's local rules on its own until the backend has answered for
 * it. The dev preview runs without a session at all, so a missing answer must leave the flow
 * working exactly as it did before rather than blank. The save is the authority either way.
 */
export interface RecurringPlanning {
  /** The household's default address: what the calendar and start times are asked about. */
  readonly addressId: string | null;
  /** First window day, Asia/Kolkata `YYYY-MM-DD`; `null` counts it locally from today. */
  readonly windowStartId: string | null;
  readonly minDays: number;
  readonly maxDays: number;
  /** Window days a live Recurring booking already has — greyed out, like another plan's day. */
  readonly unavailableDayIds: ReadonlySet<string>;
  readonly durations: readonly RecurringDurationOption[];
}

const NO_DAYS: ReadonlySet<string> = new Set();

export const LOCAL_PLANNING: RecurringPlanning = {
  addressId: null,
  windowStartId: null,
  minDays: 5,
  maxDays: 14,
  unavailableDayIds: NO_DAYS,
  durations: DURATION_OPTIONS,
};

/**
 * Recurring's durations as the Schedule tiles draw them: the effective price (pre-GST, as the
 * design shows it) and the struck-through base price, both from the backend's published policies.
 */
export function durationOptionsFrom(
  durations: readonly DurationPriceDto[],
): readonly RecurringDurationOption[] {
  return durations.map((duration) => ({
    id: durationIdFor(duration.durationMinutes),
    label: durationLabelForMinutes(duration.durationMinutes),
    minutes: duration.durationMinutes,
    price: formatPaise(duration.pricePaise),
    ...(duration.basePricePaise > duration.pricePaise
      ? { strikePrice: formatPaise(duration.basePricePaise) }
      : {}),
  }));
}

export function planningFrom(input: {
  readonly addressId: string | null;
  readonly eligibility: RecurringEligibilityDto | null;
  readonly calendar: RecurringCalendarDto | null;
}): RecurringPlanning {
  const { eligibility, calendar } = input;
  const durations = eligibility === null ? [] : durationOptionsFrom(eligibility.durations);
  return {
    addressId: input.addressId,
    windowStartId: eligibility?.window.startDate ?? calendar?.window.startDate ?? null,
    minDays: eligibility?.limits.minDays ?? LOCAL_PLANNING.minDays,
    maxDays: eligibility?.limits.maxDays ?? LOCAL_PLANNING.maxDays,
    unavailableDayIds:
      calendar === null
        ? NO_DAYS
        : new Set(calendar.days.filter((day) => !day.selectable).map((day) => day.date)),
    durations: durations.length === 0 ? LOCAL_PLANNING.durations : durations,
  };
}

const RecurringPlanningContext = createContext<RecurringPlanning>(LOCAL_PLANNING);

export function RecurringPlanningProvider({
  value,
  children,
}: {
  readonly value: RecurringPlanning;
  readonly children: ReactNode;
}) {
  return (
    <RecurringPlanningContext.Provider value={value}>{children}</RecurringPlanningContext.Provider>
  );
}

/** The flow's planning inputs. Outside a provider (the dev preview, tests) it is the local rules. */
export function useRecurringPlanning(): RecurringPlanning {
  return useContext(RecurringPlanningContext);
}

/**
 * Reads everything `RecurringPlanning` needs. The calendar is only asked once eligibility says the
 * household is unlocked: a locked household gets 403 `RECURRING_LOCKED` from it, which says
 * nothing the eligibility read has not already said.
 */
export function useRecurringPlanningSource(): RecurringPlanning {
  const addresses = useAddresses();
  const addressId = useMemo(() => {
    if (addresses.state.status !== 'ready') return null;
    const list = addresses.state.data;
    return (list.find((address) => address.isDefault) ?? list[0])?.id ?? null;
  }, [addresses.state]);

  const eligibility = useRecurringEligibility();
  const eligible = eligibility.state.status === 'ready' ? eligibility.state.data : null;
  const calendar = useRecurringCalendar({ enabled: eligible?.unlocked === true });
  const calendarData = calendar.state.status === 'ready' ? calendar.state.data : null;

  return useMemo(
    () => planningFrom({ addressId, eligibility: eligible, calendar: calendarData }),
    [addressId, eligible, calendarData],
  );
}
