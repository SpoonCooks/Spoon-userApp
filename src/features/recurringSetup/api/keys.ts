import { createKeyFactory } from '@core/query';

import type { PlanDraftInput } from './recurringApi';

/**
 * Recurring cache keys.
 *
 * Planning keys carry their full parameter set: a start-time grid is only true for the exact
 * address, dates and duration it was asked about, and a quote for the exact draft.
 */
const factory = createKeyFactory('recurring');

export const recurringKeys = {
  all: factory.all,
  eligibility: () => factory.collection('eligibility'),
  calendar: (params: { addressId: string }) => factory.collection('calendar', params),
  startTimes: (params: { addressId: string; dates: readonly string[]; durationMinutes: number }) =>
    factory.collection('startTimes', { ...params, dates: [...params.dates] }),
  quote: (draft: PlanDraftInput) => factory.collection('quote', { draft }),
  plans: () => factory.collection('plans'),
  plan: (planId: string) => factory.detail(planId),
} as const;
