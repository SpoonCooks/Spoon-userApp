import type { ApiClient } from '@core/api';

import { instantAvailabilitySchema, scheduledAvailabilitySchema } from './schemas';
import type { InstantAvailabilityDto, ScheduledAvailabilityDto } from './schemas';

/**
 * Availability endpoints.
 *
 * Both require an `addressId` and a `durationMinutes`: availability is a property of a SPECIFIC
 * address and a SPECIFIC duration, never of the account. There is no "is Spoon available" call
 * and the client must not synthesise one.
 */

export const AVAILABILITY_PATHS = {
  instant: '/v1/availability/instant',
  scheduled: '/v1/availability/scheduled',
} as const;

function query(params: Readonly<Record<string, string>>): string {
  return new URLSearchParams(params).toString();
}

export function createAvailabilityApi(api: ApiClient) {
  return {
    /** `GET /v1/availability/instant?addressId&durationMinutes`. */
    async instant(
      input: { addressId: string; durationMinutes: number },
      signal?: AbortSignal,
    ): Promise<InstantAvailabilityDto> {
      const search = query({
        addressId: input.addressId,
        durationMinutes: String(input.durationMinutes),
      });
      return api.request(`${AVAILABILITY_PATHS.instant}?${search}`, {
        parse: (data) => instantAvailabilitySchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `GET /v1/availability/scheduled?addressId&date&durationMinutes`.
     *
     * `date` is a LOCAL calendar date (`YYYY-MM-DD`) in the operating time zone, not an instant.
     * The slot starts that come back are instants.
     */
    async scheduled(
      input: { addressId: string; date: string; durationMinutes: number },
      signal?: AbortSignal,
    ): Promise<ScheduledAvailabilityDto> {
      const search = query({
        addressId: input.addressId,
        date: input.date,
        durationMinutes: String(input.durationMinutes),
      });
      return api.request(`${AVAILABILITY_PATHS.scheduled}?${search}`, {
        parse: (data) => scheduledAvailabilitySchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },
  };
}

export type AvailabilityApi = ReturnType<typeof createAvailabilityApi>;
