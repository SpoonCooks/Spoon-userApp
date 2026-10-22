import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { createAvailabilityApi } from './availabilityApi';
import { availabilityKeys } from './keys';
import type {
  InstantAvailabilityDto,
  ScheduledAvailabilityDto,
  ScheduledOverviewDto,
} from './schemas';

/**
 * Availability reads.
 *
 * `staleTime` is short (15s) because this is genuinely live: a slot that was free when the sheet
 * opened can be gone by the time the customer picks it. The authoritative refusal still comes
 * from `POST /v1/bookings` with `SLOT_UNAVAILABLE` — the grid is a hint, the booking is the
 * answer, and the designed error state exists for exactly that race.
 *
 * `enabled` is false until an address id exists, so a screen without a selected address makes no
 * request rather than one that would 400.
 */

export function useInstantAvailability(input: {
  addressId: string | null;
  /**
   * `null` until the customer picks a duration. Availability is a question about a SPECIFIC
   * duration, so there is nothing to ask until one exists, and the query stays disabled rather
   * than guessing a duration on the customer's behalf.
   */
  durationMinutes: number | null;
}): ScreenQuery<InstantAvailabilityDto> {
  const { api } = useRuntime();
  const availability = createAvailabilityApi(api);
  const { addressId, durationMinutes } = input;

  return useApiQuery<InstantAvailabilityDto>({
    queryKey: availabilityKeys.instant({
      addressId: addressId ?? 'none',
      durationMinutes: durationMinutes ?? 0,
    }),
    queryFn: ({ signal }) =>
      availability.instant(
        { addressId: addressId ?? '', durationMinutes: durationMinutes ?? 0 },
        signal,
      ),
    enabled: addressId !== null && durationMinutes !== null,
    staleTime: 15_000,
  });
}

export function useScheduledAvailability(input: {
  addressId: string | null;
  date: string | null;
  durationMinutes: number;
}): ScreenQuery<ScheduledAvailabilityDto> {
  const { api } = useRuntime();
  const availability = createAvailabilityApi(api);
  const { addressId, date } = input;

  return useApiQuery<ScheduledAvailabilityDto>({
    queryKey: availabilityKeys.scheduled({
      addressId: addressId ?? 'none',
      date: date ?? 'none',
      durationMinutes: input.durationMinutes,
    }),
    queryFn: ({ signal }) =>
      availability.scheduled(
        { addressId: addressId ?? '', date: date ?? '', durationMinutes: input.durationMinutes },
        signal,
      ),
    enabled: addressId !== null && date !== null,
    staleTime: 15_000,
  });
}

/**
 * How long one overview stands: the server's `validUntil` window (`BOOKING_INSTANT_CACHE_TTL_SECONDS`,
 * 30 seconds). Also the refresh interval while a screen that shows it is open.
 */
export const SCHEDULED_OVERVIEW_REFRESH_MS = 30_000;

export interface ScheduledOverviewQuery extends ScreenQuery<ScheduledOverviewDto> {
  /**
   * Re-reads past the server's 30-second cache. For the moment the customer's OWN bookings changed
   * (a booking made, refused or cancelled): a cached answer would still offer what they just took.
   */
  readonly refreshFresh: () => Promise<void>;
}

/**
 * Every duration over the three-day horizon for the address (DEC-094): Home's Later tab and the
 * Schedule for Later screen share this one read and its cache, so the picker opens on what Home
 * already holds.
 *
 * `poll` re-reads every 30 seconds while it holds; the caller sets it only while the screen that
 * shows it is focused (Home on its Later tab, the picker). TanStack pauses it in the background on
 * its own (`useAppStateFocus`). A refresh keeps the previous answer on screen until the new one
 * lands, so nothing flickers grey.
 */
export function useScheduledOverview(input: {
  addressId: string | null;
  poll?: boolean;
}): ScheduledOverviewQuery {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const availability = createAvailabilityApi(api);
  const { addressId } = input;
  const key = availabilityKeys.scheduledOverview({ addressId: addressId ?? 'none' });

  const query = useApiQuery<ScheduledOverviewDto>({
    queryKey: key,
    queryFn: ({ signal }) => availability.scheduledOverview({ addressId: addressId ?? '' }, signal),
    enabled: addressId !== null,
    staleTime: SCHEDULED_OVERVIEW_REFRESH_MS,
    refetchInterval: input.poll === true ? SCHEDULED_OVERVIEW_REFRESH_MS : false,
  });

  const refreshFresh = useCallback(async () => {
    if (addressId === null) return;
    const fresh = await createAvailabilityApi(api).scheduledOverview({ addressId, fresh: true });
    queryClient.setQueryData(availabilityKeys.scheduledOverview({ addressId }), fresh);
  }, [api, addressId, queryClient]);

  return useMemo(() => ({ ...query, refreshFresh }), [query, refreshFresh]);
}

/**
 * Logs the day and length the customer looked at in the picker as one demand search (DEC-094).
 * Fire and forget: a failed log never touches the screen.
 */
export function useRecordScheduledSearch(): (input: {
  addressId: string;
  date: string;
  durationMinutes: number;
}) => void {
  const { api } = useRuntime();
  return useCallback(
    (input) => {
      createAvailabilityApi(api)
        .recordScheduledSearch(input)
        .catch(() => undefined);
    },
    [api],
  );
}
