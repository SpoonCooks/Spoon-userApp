import type { ApiClient, JsonValue } from '@core/api';
import { idempotencyHeader } from '@core/api';

import {
  mandateCheckoutSchema,
  mandateVerifySchema,
  recurringCalendarSchema,
  recurringEligibilitySchema,
  recurringPlanListSchema,
  recurringPlanQuoteSchema,
  recurringPlanSchema,
  recurringStartTimesSchema,
} from './schemas';
import type {
  MandateCheckoutDto,
  MandateMethod,
  MandateVerifyDto,
  RecurringCalendarDto,
  RecurringEligibilityDto,
  RecurringPlanDto,
  RecurringPlanQuoteDto,
  RecurringStartTimesDto,
} from './schemas';

/**
 * Recurring Plan endpoints — DEC-084.
 *
 * The planning reads (`eligibility`, `calendar`, `startTimes`, `quote`) hold nothing. Every route
 * that changes a plan carries an Idempotency-Key scoped to its intent, except `keepGoing` and
 * `verifyMandate`, which the backend makes idempotent on their own.
 *
 * Every planning route answers a locked household (fewer "My Cooks" than the unlock threshold)
 * with 403 `FORBIDDEN`, so `eligibility` is read first and decides whether the flow opens at all.
 */

export const RECURRING_PATHS = {
  eligibility: '/v1/recurring/eligibility',
  calendar: '/v1/recurring/calendar',
  startTimes: '/v1/recurring/start-times',
  quote: '/v1/recurring/plans/quote',
  create: '/v1/recurring/plans',
  list: '/v1/me/recurring-plans',
  detail: (planId: string) => `/v1/me/recurring-plans/${planId}`,
  cancel: (planId: string) => `/v1/me/recurring-plans/${planId}/cancel`,
  keepGoing: (planId: string) => `/v1/me/recurring-plans/${planId}/keep-going`,
  cancelVisit: (planId: string, visitId: string) =>
    `/v1/me/recurring-plans/${planId}/visits/${visitId}/cancel`,
  rescheduleVisit: (planId: string, visitId: string) =>
    `/v1/me/recurring-plans/${planId}/visits/${visitId}/reschedule`,
  mandate: (planId: string) => `/v1/me/recurring-plans/${planId}/mandate`,
  mandateVerify: (planId: string) => `/v1/me/recurring-plans/${planId}/mandate/verify`,
} as const;

/**
 * One visit of the plan, sent as the backend's draft expects.
 *
 * Visit 1 always runs on every plan date (`daysScope: 'all'`, no `dates`); visits 2 and 3 run on
 * every date or on a subset (`'some'` plus the subset). The backend refuses anything else with a
 * bare 400, so the adapter that builds this from the flow's state is what keeps it valid.
 */
export interface PlanVisitInput {
  readonly visitNumber: 1 | 2 | 3;
  readonly durationMinutes: number;
  /** Asia/Kolkata `HH:MM`. */
  readonly startTime: string;
  readonly daysScope: 'all' | 'some';
  readonly dates?: readonly string[];
}

/** A one-day change to a visit's start time, e.g. a date moved to a later slot. */
export interface PlanOverrideInput {
  readonly date: string;
  readonly visitNumber: 1 | 2 | 3;
  readonly startTime: string;
}

export interface PlanDraftInput {
  readonly addressId: string;
  /** The plan's service dates, Asia/Kolkata `YYYY-MM-DD`. */
  readonly dates: readonly string[];
  readonly visits: readonly PlanVisitInput[];
  readonly overrides?: readonly PlanOverrideInput[];
}

export interface PlanCreateInput extends PlanDraftInput {
  readonly keepGoing?: boolean;
  readonly mealNotes?: string;
}

/** What Razorpay's checkout handed back after the customer approved autopay. */
export interface MandateVerifyInput {
  readonly providerOrderId: string;
  readonly providerPaymentId: string;
  readonly signature: string;
}

function draftBody(input: PlanDraftInput): Record<string, JsonValue> {
  return {
    addressId: input.addressId,
    dates: [...input.dates],
    visits: input.visits.map((visit) => ({
      visitNumber: visit.visitNumber,
      durationMinutes: visit.durationMinutes,
      startTime: visit.startTime,
      daysScope: visit.daysScope,
      // `dates` is forbidden on an `all` visit, not merely ignored.
      ...(visit.daysScope === 'some' && visit.dates !== undefined
        ? { dates: [...visit.dates] }
        : {}),
    })),
    ...(input.overrides === undefined || input.overrides.length === 0
      ? {}
      : { overrides: input.overrides.map((override) => ({ ...override })) }),
  };
}

function withSignal(signal: AbortSignal | undefined): { signal?: AbortSignal } {
  return signal === undefined ? {} : { signal };
}

export function createRecurringApi(api: ApiClient) {
  return {
    /** `GET /v1/recurring/eligibility` — unlocked or not, the window, and the plan limits. */
    async eligibility(signal?: AbortSignal): Promise<RecurringEligibilityDto> {
      return api.request(RECURRING_PATHS.eligibility, {
        parse: (data) => recurringEligibilitySchema.parse(data),
        ...withSignal(signal),
      });
    },

    /** `GET /v1/recurring/calendar?addressId` — Step 1, which window days have room. */
    async calendar(addressId: string, signal?: AbortSignal): Promise<RecurringCalendarDto> {
      const search = new URLSearchParams({ addressId }).toString();
      return api.request(`${RECURRING_PATHS.calendar}?${search}`, {
        parse: (data) => recurringCalendarSchema.parse(data),
        ...withSignal(signal),
      });
    },

    /** `POST /v1/recurring/start-times` — Step 2, one visit duration across the picked days. */
    async startTimes(
      input: { addressId: string; dates: readonly string[]; durationMinutes: number },
      signal?: AbortSignal,
    ): Promise<RecurringStartTimesDto> {
      return api.request(RECURRING_PATHS.startTimes, {
        method: 'POST',
        body: {
          addressId: input.addressId,
          dates: [...input.dates],
          durationMinutes: input.durationMinutes,
        },
        parse: (data) => recurringStartTimesSchema.parse(data),
        ...withSignal(signal),
      });
    },

    /** `POST /v1/recurring/plans/quote`. No idempotency key — a quote holds nothing. */
    async quote(input: PlanDraftInput, signal?: AbortSignal): Promise<RecurringPlanQuoteDto> {
      return api.request(RECURRING_PATHS.quote, {
        method: 'POST',
        body: draftBody(input),
        parse: (data) => recurringPlanQuoteSchema.parse(data),
        ...withSignal(signal),
      });
    },

    /**
     * `POST /v1/recurring/plans` — 201, `pending_mandate`.
     *
     * Saving reserves every visit, and the plan is cancelled if autopay is not approved within the
     * policy's pending window (30 minutes), so a save is only worth making on the way into the
     * autopay step.
     */
    async create(input: PlanCreateInput, scope: string): Promise<RecurringPlanDto> {
      return api.request(RECURRING_PATHS.create, {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: {
          ...draftBody(input),
          ...(input.keepGoing === undefined ? {} : { keepGoing: input.keepGoing }),
          ...(input.mealNotes === undefined ? {} : { mealNotes: input.mealNotes }),
        },
        parse: (data) => recurringPlanSchema.parse(data),
      });
    },

    /** `GET /v1/me/recurring-plans` — newest first, at most 20. Two may be live around a renewal. */
    async list(signal?: AbortSignal): Promise<RecurringPlanDto[]> {
      return api.request(RECURRING_PATHS.list, {
        parse: (data) => recurringPlanListSchema.parse(data),
        ...withSignal(signal),
      });
    },

    async detail(planId: string, signal?: AbortSignal): Promise<RecurringPlanDto> {
      return api.request(RECURRING_PATHS.detail(planId), {
        parse: (data) => recurringPlanSchema.parse(data),
        ...withSignal(signal),
      });
    },

    /** Cancels every still-reserved visit and revokes autopay. Charged visits stay bookings. */
    async cancel(planId: string, scope: string): Promise<RecurringPlanDto> {
      return api.request(RECURRING_PATHS.cancel(planId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        parse: (data) => recurringPlanSchema.parse(data),
      });
    },

    async setKeepGoing(planId: string, keepGoing: boolean): Promise<RecurringPlanDto> {
      return api.request(RECURRING_PATHS.keepGoing(planId), {
        method: 'POST',
        body: { keepGoing },
        parse: (data) => recurringPlanSchema.parse(data),
      });
    },

    /**
     * Free, and only while the visit is `reserved`. Once it has become a booking (`bookingId`
     * set), it is cancelled like any other booking instead.
     */
    async cancelVisit(planId: string, visitId: string, scope: string): Promise<RecurringPlanDto> {
      return api.request(RECURRING_PATHS.cancelVisit(planId, visitId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        parse: (data) => recurringPlanSchema.parse(data),
      });
    },

    /** Once per visit, only while `reserved`, and only to a start more than 24h away. */
    async rescheduleVisit(
      planId: string,
      visitId: string,
      input: { date: string; startTime: string },
      scope: string,
    ): Promise<RecurringPlanDto> {
      return api.request(RECURRING_PATHS.rescheduleVisit(planId, visitId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: { date: input.date, startTime: input.startTime },
        parse: (data) => recurringPlanSchema.parse(data),
      });
    },

    /** Starts (or restarts, with another method) the autopay approval for a pending plan. */
    async startMandate(
      planId: string,
      method: MandateMethod,
      scope: string,
    ): Promise<MandateCheckoutDto> {
      return api.request(RECURRING_PATHS.mandate(planId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: { method },
        parse: (data) => mandateCheckoutSchema.parse(data),
      });
    },

    /**
     * `initiated` is a normal answer, common for UPI: the bank has not confirmed yet, and a
     * webhook will. The plan's own `status` / `autopay.status` is then the thing to watch.
     */
    async verifyMandate(planId: string, input: MandateVerifyInput): Promise<MandateVerifyDto> {
      return api.request(RECURRING_PATHS.mandateVerify(planId), {
        method: 'POST',
        body: {
          providerOrderId: input.providerOrderId,
          providerPaymentId: input.providerPaymentId,
          signature: input.signature,
        },
        parse: (data) => mandateVerifySchema.parse(data),
      });
    },
  };
}

export type RecurringApi = ReturnType<typeof createRecurringApi>;
