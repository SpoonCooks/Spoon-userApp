import type { ApiClient } from '@core/api';

import {
  instantAvailabilitySchema,
  scheduledAvailabilitySchema,
  scheduledOverviewSchema,
} from './schemas';
import type {
  InstantAvailabilityDto,
  ScheduledAvailabilityDto,
  ScheduledOverviewDto,
} from './schemas';

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
  scheduledOverview: '/v1/availability/scheduled/overview',
  scheduledSearches: '/v1/availability/scheduled/searches',
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

    /**
     * `GET /v1/availability/scheduled/overview?addressId[&fresh=true]` (DEC-094). `fresh` skips the
     * server's 30-second cache, for the read after the customer's own booking changed.
     */
    async scheduledOverview(
      input: { addressId: string; fresh?: boolean },
      signal?: AbortSignal,
    ): Promise<ScheduledOverviewDto> {
      const search = query({
        addressId: input.addressId,
        ...(input.fresh === true ? { fresh: 'true' } : {}),
      });
      return api.request(`${AVAILABILITY_PATHS.scheduledOverview}?${search}`, {
        parse: (data) => scheduledOverviewSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `POST /v1/availability/scheduled/searches` — the day and length the customer looked at, for
     * the demand telemetry (DEC-094). The overview itself is not counted as a search.
     */
    async recordScheduledSearch(input: {
      addressId: string;
      date: string;
      durationMinutes: number;
    }): Promise<void> {
      await api.request(AVAILABILITY_PATHS.scheduledSearches, {
        method: 'POST',
        body: input,
        parse: () => undefined,
      });
    },
  };
}

export type AvailabilityApi = ReturnType<typeof createAvailabilityApi>;
