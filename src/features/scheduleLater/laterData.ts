import { useEffect, useMemo, useState } from 'react';

import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { currentAddressOf, useAddresses } from '@features/address';
import {
  useRecordScheduledSearch,
  useScheduledAvailability,
  useScheduledOverview,
} from '@features/availability';
import { useCatalogue } from '@features/catalogue';

import { firstOpenPeriodId, laterModelFrom, minutesOfDurationId } from './later';
import type { LaterModel } from './later';

/**
 * Schedule for Later's reads and choices (DEC-094).
 *
 * One read answers the whole screen: the three-day overview, shared with Home's Later tab, re-read
 * every 30 seconds while the screen is `focused`. Choosing a duration, a day or a time of day asks
 * the server nothing; only on a server without the overview does the chosen day fall back to the
 * single-day read.
 *
 * The choices are the customer's, the verdicts the server's: a day, time of day or start time that
 * a refresh greys is dropped from the EFFECTIVE choice (never written back), so the CTA goes grey
 * on its own and `lostPick` says why. Every day the customer opens is logged as one search.
 */
export interface LaterSelection {
  readonly durationId: string | null;
  readonly dayId: string | null;
  readonly periodId: string | null;
  readonly slotId: string | null;
}

export interface ScheduleForLater {
  readonly state: DataState<LaterModel>;
  /** What is chosen and still free. */
  readonly selection: LaterSelection;
  /** A start time the customer picked was taken by a refresh: the footer says so. */
  readonly lostPick: boolean;
  readonly selectDuration: (durationId: string) => void;
  readonly selectDay: (dayId: string) => void;
  readonly selectPeriod: (periodId: string) => void;
  readonly selectSlot: (slotId: string) => void;
  readonly refetch: () => void;
  /** Re-reads past the server's 30-second cache: after this customer's own booking changed. */
  readonly refreshFresh: () => Promise<void>;
}

export function useScheduleForLater(input: {
  readonly presetDurationId: string | null;
  readonly presetDayId: string | null;
  /** The screen is showing: refresh every 30 seconds. */
  readonly focused: boolean;
}): ScheduleForLater {
  const catalogue = useCatalogue();
  const addresses = useAddresses();
  const addressId =
    addresses.state.status === 'ready'
      ? (currentAddressOf(addresses.state.data)?.id ?? null)
      : null;

  const [chosen, setChosen] = useState<LaterSelection>({
    durationId: input.presetDurationId,
    dayId: input.presetDayId,
    periodId: null,
    slotId: null,
  });
  const durationMinutes = minutesOfDurationId(chosen.durationId);

  const overview = useScheduledOverview({ addressId, poll: input.focused });
  const overviewData = overview.state.status === 'ready' ? overview.state.data : undefined;
  // Only without an overview: the chosen day's single-day read.
  const fallback = useScheduledAvailability({
    addressId,
    date: overview.state.status === 'error' ? chosen.dayId : null,
    durationMinutes: durationMinutes ?? 60,
  });

  const state = useMemo<DataState<LaterModel>>(() => {
    if (catalogue.state.status !== 'ready') return catalogue.state;
    return ready(
      laterModelFrom({
        catalogue: catalogue.state.data,
        overview: overviewData,
        fallbackDay: fallback.state.status === 'ready' ? fallback.state.data : null,
        durationMinutes,
        dayId: chosen.dayId,
      }),
    );
  }, [catalogue.state, overviewData, fallback.state, durationMinutes, chosen.dayId]);

  const model = state.status === 'ready' ? state.data : null;
  const dayOpen = model?.days.find((day) => day.id === chosen.dayId)?.available === true;
  const dayId = dayOpen ? chosen.dayId : null;
  const periods = dayId === null ? [] : (model?.periods ?? []);
  const periodId =
    periods.find((period) => period.id === chosen.periodId && period.available)?.id ??
    firstOpenPeriodId(periods);
  const slotOpen = periods.some((period) =>
    period.slots.some((slot) => slot.id === chosen.slotId && slot.available),
  );
  const pending = model?.slotsPending ?? true;
  // Held while the answer is still on its way: a pick is not dropped before it can be confirmed.
  const slotId =
    chosen.slotId !== null && (slotOpen || (pending && dayId !== null)) ? chosen.slotId : null;
  const lostPick = chosen.slotId !== null && slotId === null;

  const selection = useMemo<LaterSelection>(
    () => ({ durationId: chosen.durationId, dayId, periodId, slotId }),
    [chosen.durationId, dayId, periodId, slotId],
  );

  // One demand search per day and duration the customer actually opens.
  const record = useRecordScheduledSearch();
  useEffect(() => {
    if (addressId === null || dayId === null || durationMinutes === null) return;
    record({ addressId, date: dayId, durationMinutes });
  }, [addressId, dayId, durationMinutes, record]);

  return {
    state,
    selection,
    lostPick,
    // `2466:19104`: a new duration keeps the day and clears the start time.
    selectDuration: (durationId) =>
      setChosen((current) => ({ ...current, durationId, periodId: null, slotId: null })),
    // `2466:19111`: a new day resets the time of day and the start time.
    selectDay: (next) => {
      if (model?.days.find((day) => day.id === next)?.available !== true) return;
      setChosen((current) => ({ ...current, dayId: next, periodId: null, slotId: null }));
    },
    // `2466:19111` / `2466:19115`: a tab only swaps the grid; the pick is kept.
    selectPeriod: (next) => {
      if (periods.find((period) => period.id === next)?.available !== true) return;
      setChosen((current) => ({ ...current, periodId: next }));
    },
    selectSlot: (next) => {
      const open = periods.some((period) =>
        period.slots.some((slot) => slot.id === next && slot.available),
      );
      if (!open) return;
      setChosen((current) => ({
        ...current,
        slotId: next,
        periodId: periodId ?? current.periodId,
      }));
    },
    refetch: () => {
      catalogue.refetch();
      overview.refetch();
    },
    refreshFresh: overview.refreshFresh,
  };
}
