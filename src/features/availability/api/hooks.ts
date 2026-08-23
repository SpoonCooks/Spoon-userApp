import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { createAvailabilityApi } from './availabilityApi';
import { availabilityKeys } from './keys';
import type { InstantAvailabilityDto, ScheduledAvailabilityDto } from './schemas';

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
