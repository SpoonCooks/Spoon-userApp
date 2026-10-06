import { createKeyFactory } from '@core/query';

import type { RecurringDraftInput, StartTimesInput } from './recurringApi';

/**
 * Recurring cache keys.
 *
 * Planning keys carry their full parameter set: a start-time list is only true for the exact
 * address, dates, duration and same-day visits it was asked about, and a quote for the exact draft.
 */
const factory = createKeyFactory('recurring');

export const recurringKeys = {
  all: factory.all,
  eligibility: () => factory.collection('eligibility'),
  calendar: () => factory.collection('calendar'),
  startTimes: (params: StartTimesInput) =>
    factory.collection('startTimes', {
      addressId: params.addressId,
      dates: [...params.dates],
      durationMinutes: params.durationMinutes,
      sameDayVisits: (params.sameDayVisits ?? []).map((visit) => ({ ...visit })),
    }),
  quote: (draft: RecurringDraftInput) => factory.collection('quote', { draft }),
  bookings: () => factory.collection('bookings'),
  booking: (id: string) => factory.detail(id),
  visit: (id: string, visitId: string) => factory.collection('visit', { id, visitId }),
  visitCancellationQuote: (id: string, visitId: string) =>
    factory.collection('visitCancellationQuote', { id, visitId }),
  cancellationQuote: (id: string) => factory.collection('cancellationQuote', { id }),
  prep: (bookingId: string) => factory.collection('prep', { bookingId }),
} as const;
