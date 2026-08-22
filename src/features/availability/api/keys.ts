import { createKeyFactory } from '@core/query';

/**
 * Availability cache keys.
 *
 * Every key carries its full parameter set, because an availability answer is only valid for the
 * exact address/date/duration triple it was asked for. A key that omitted `durationMinutes` would
 * serve a 60-minute grid to a 120-minute request.
 */
const factory = createKeyFactory('availability');

export const availabilityKeys = {
  all: factory.all,
  instant: (params: { addressId: string; durationMinutes: number }) =>
    factory.collection('instant', params),
  scheduled: (params: { addressId: string; date: string; durationMinutes: number }) =>
    factory.collection('scheduled', params),
} as const;
