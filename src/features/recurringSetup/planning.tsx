import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { formatPaise } from '@core/format';
import { useAddresses } from '@features/address';
import { durationMerchandisingFor } from '@features/booking';
import { useCatalogue } from '@features/catalogue';
import type { Catalogue } from '@features/catalogue';

import { useRecurringCalendar, useRecurringEligibility } from './api';
import type { RecurringCalendarDto, RecurringEligibilityDto } from './api';
import { DURATION_OPTIONS, durationIdFor, durationLabelForMinutes } from './data';
import type { RecurringDurationOption } from './types';

/**
 * What the flow plans against: the window, the day limits, the days nobody can take, and the
 * durations on offer — DEC-084's planning reads, gathered once for every step.
 *
 * Each field falls back to the flow's local rules on its own until the backend has answered for
 * it. The routes are not deployed everywhere yet (SpoonCooks/V0#101), and the dev preview runs
 * without a session at all, so a missing answer must leave the flow working exactly as it did
 * before rather than blank. The save, when it is wired, is the authority either way.
 */
export interface RecurringPlanning {
  /** The household's default address: what the calendar and start times are asked about. */
  readonly addressId: string | null;
  /** First window day, Asia/Kolkata `YYYY-MM-DD`; `null` counts it locally from today. */
  readonly windowStartId: string | null;
  readonly minDays: number;
  readonly maxDays: number;
  /** Window days no pool Cook can take — greyed out, like a day held by another plan. */
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

/** The catalogue's durations as the Schedule tiles draw them, priced the way Instant prices them. */
export function durationOptionsFrom(catalogue: Catalogue): readonly RecurringDurationOption[] {
  return catalogue.durations.map((duration) => ({
    id: durationIdFor(duration.durationMinutes),
    label: durationLabelForMinutes(duration.durationMinutes),
    minutes: duration.durationMinutes,
    price: formatPaise(duration.serviceAmountPaise),
    ...durationMerchandisingFor(duration),
  }));
}

export function planningFrom(input: {
  readonly addressId: string | null;
  readonly eligibility: RecurringEligibilityDto | null;
  readonly calendar: RecurringCalendarDto | null;
  readonly catalogue: Catalogue | null;
}): RecurringPlanning {
  const { eligibility, calendar, catalogue } = input;
  const durations = catalogue === null ? [] : durationOptionsFrom(catalogue);
  return {
    addressId: input.addressId,
    windowStartId: eligibility?.window.startDate ?? calendar?.window.startDate ?? null,
    minDays: eligibility?.limits.minDays ?? LOCAL_PLANNING.minDays,
    maxDays: eligibility?.limits.maxDays ?? LOCAL_PLANNING.maxDays,
    unavailableDayIds:
      calendar === null
        ? NO_DAYS
        : new Set(calendar.days.filter((day) => !day.available).map((day) => day.date)),
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
 * household is unlocked: a locked household gets a bare 403 from it, which says nothing the
 * eligibility read has not already said.
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
  const calendar = useRecurringCalendar({ addressId, enabled: eligible?.unlocked === true });
  const catalogue = useCatalogue();

  const calendarData = calendar.state.status === 'ready' ? calendar.state.data : null;
  const catalogueData = catalogue.state.status === 'ready' ? catalogue.state.data : null;

  return useMemo(
    () =>
      planningFrom({
        addressId,
        eligibility: eligible,
        calendar: calendarData,
        catalogue: catalogueData,
      }),
    [addressId, eligible, calendarData, catalogueData],
  );
}
