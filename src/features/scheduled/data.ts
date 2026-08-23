import { useMemo } from 'react';

import { useScheduledAvailability } from '@features/availability';
import { useAddresses } from '@features/address';
import { useCatalogue } from '@features/catalogue';
import { ready } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { scheduleFrom, toServiceDate } from './adapters';
import { DEMO_SCHEDULE_BOOK, DEMO_SCHEDULE_RESCHEDULE } from '@/demo/fixtures/booking';
import {
  DEMO_DURATION_GUIDE,
  DEMO_DURATION_GUIDE_COLUMNS,
  DEMO_DURATION_GUIDE_TITLE,
  DEMO_HELP_ME_PICK_LABEL,
} from '@/demo/fixtures/durationGuide';
import type { ScheduleMode, ScheduleViewModel } from './types';

/**
 * Schedule data.
 *
 *  - `GET /v1/catalogue` -> the day horizon, the meal periods, the durations and their prices
 *  - `GET /v1/availability/scheduled` -> the actual slots, each with the server's availability
 *
 * Blocker B-8 is closed: the horizon is `scheduled.horizonDays`, published policy, not a client
 * constant. No slot is generated locally — every start in the grid is one the server returned.
 *
 * `selection` is the caller's current choice (client-owned transient state, §9). It decides which
 * DAY and DURATION to ask availability about; it decides nothing about what is offered.
 *
 * The address is the customer's default, because availability is a property of a specific
 * address. A screen reached before any address exists asks for nothing and renders the designed
 * day/period structure with an empty grid.
 */
export function useScheduleData(
  mode: ScheduleMode,
  selection: { date?: string | null; durationMinutes?: number | null } = {},
): ScreenQuery<ScheduleViewModel> {
  const catalogue = useCatalogue();
  const addresses = useAddresses();

  const addressId = useMemo(() => {
    if (addresses.state.status !== 'ready') return null;
    const list = addresses.state.data;
    return (list.find((address) => address.isDefault) ?? list[0])?.id ?? null;
  }, [addresses.state]);

  // Default to today and the first published duration, so the grid is populated on arrival
  // rather than empty until the customer taps something.
  const date =
    selection.date ?? (catalogue.state.status === 'ready' ? toServiceDate(new Date()) : null);
  const durationMinutes =
    selection.durationMinutes ??
    (catalogue.state.status === 'ready'
      ? (catalogue.state.data.durations[0]?.durationMinutes ?? 60)
      : 60);

  const availability = useScheduledAvailability({ addressId, date, durationMinutes });

  const state = useMemo(() => {
    if (catalogue.state.status !== 'ready') return catalogue.state;

    const schedule = scheduleFrom({
      base: mode === 'reschedule' ? DEMO_SCHEDULE_RESCHEDULE : DEMO_SCHEDULE_BOOK,
      catalogue: catalogue.state.data,
      availability: availability.state.status === 'ready' ? availability.state.data : null,
    });

    /**
     * `333:3624` - "Help me pick" sits on the DURATION label row, so it is offered only where a
     * duration is chosen. Reschedule moves *when*, never *how long*, and draws no duration
     * section at all, so it gets no link.
     *
     * The guide is static design copy (the same table Home draws). It is composed here, in the
     * data seam, for the same reason every other fixture-sourced string is: a screen never
     * reaches for content itself.
     */
    if (mode === 'reschedule') return ready(schedule);

    return ready<ScheduleViewModel>({
      ...schedule,
      durationHelp: {
        label: DEMO_HELP_ME_PICK_LABEL,
        heading: DEMO_DURATION_GUIDE_TITLE,
        columns: DEMO_DURATION_GUIDE_COLUMNS,
        rows: DEMO_DURATION_GUIDE,
      },
    });
  }, [catalogue.state, availability.state, mode]);

  return {
    state,
    refetch: () => {
      catalogue.refetch();
      availability.refetch();
    },
  };
}
