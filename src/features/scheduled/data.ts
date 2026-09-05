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
 * address. A screen reached before any address exists asks for nothing, and renders the designed
 * day/period/duration structure with the Start time section withheld — there is no answer about
 * start times yet, and an empty grid would claim there is one.
 *
 * ## Three different "no slots"
 *
 * A read that FAILED, a read still IN FLIGHT and a day the server offers nothing on are three
 * different facts, and this seam used to publish all three as the same empty grid inside a
 * successful screen. That is the defect behind a blank Start time section: nothing distinguished
 * a 5xx from a fully-booked afternoon, and neither offered a retry. They are now separated —
 * error surfaces as `DataState.error`, in-flight as `slotsPending`, and an answered day carries
 * its candidates whether or not any of them can be booked.
 */
export function useScheduleData(
  mode: ScheduleMode,
  selection: { date?: string | null; durationMinutes?: number | null } = {},
): ScreenQuery<ScheduleViewModel> {
  const addresses = useAddresses();

  const addressId = useMemo(() => {
    if (addresses.state.status !== 'ready') return null;
    const list = addresses.state.data;
    return (list.find((address) => address.isDefault) ?? list[0])?.id ?? null;
  }, [addresses.state]);

  // The staging Delhi business-time override is published only from an address-scoped
  // catalogue response. All other app surfaces continue to use the global catalogue.
  const catalogue = useCatalogue({ addressId });

  // Default to today and the first published duration, so the grid is populated on arrival
  // rather than empty until the customer taps something.
  const timeZone =
    catalogue.state.status === 'ready' ? catalogue.state.data.operatingWindow.timeZone : undefined;
  const date =
    selection.date ??
    (catalogue.state.status === 'ready' ? toServiceDate(new Date(), timeZone) : null);
  const durationMinutes =
    selection.durationMinutes ??
    (catalogue.state.status === 'ready'
      ? (catalogue.state.data.durations[0]?.durationMinutes ?? 60)
      : 60);

  const availability = useScheduledAvailability({ addressId, date, durationMinutes });

  const state = useMemo(() => {
    if (catalogue.state.status !== 'ready') return catalogue.state;

    /**
     * A FAILED availability read is an error, not an empty grid.
     *
     * This seam used to hand `null` to the adapter for anything that was not `ready`, which turned
     * a 5xx, a dropped connection and a schema mismatch into a successful screen whose Start time
     * section was simply blank — indistinguishable from "the server offers nothing here", and with
     * no retry offered. Surfacing the error gives the screen the designed `ErrorState` and the
     * retry the boundary already wires (task §8).
     */
    if (availability.state.status === 'error') return availability.state;

    const schedule = scheduleFrom({
      base: mode === 'reschedule' ? DEMO_SCHEDULE_RESCHEDULE : DEMO_SCHEDULE_BOOK,
      catalogue: catalogue.state.data,
      availability: availability.state.status === 'ready' ? availability.state.data : null,
      // The day the grid describes, so the meal-period chips can tell an elapsed window from a
      // future one. The SAME date the availability read was asked about — never a second reading
      // of the clock, which could disagree with it across midnight.
      serviceDate: date,
      // Loading is its own state. The chips stay exactly where they are — a read must never blank
      // a screen full of local choices — but the grid is withheld rather than drawn empty.
      slotsPending: availability.state.status !== 'ready',
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
  }, [catalogue.state, availability.state, date, mode]);

  return {
    state,
    refetch: () => {
      catalogue.refetch();
      availability.refetch();
    },
  };
}
