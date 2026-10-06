import { z } from 'zod';

/**
 * Recurring Plan DTOs — DEC-084, V0 `feat/cook-pool-recurring-plans` (SpoonCooks/V0#101).
 *
 * Transcribed from the backend's own types (`src/recurring/plan-capacity.ts`, `plan-service.ts`,
 * `mandate-service.ts`) and its OpenAPI `Recurring` tag, not yet from a live instance: the routes
 * are not deployed anywhere at the time of writing.
 *
 * ## Dates and times are wall-clock, instants are ISO
 *
 * `date` is an Asia/Kolkata calendar date (`YYYY-MM-DD`) and `startTime` an Asia/Kolkata `HH:MM`.
 * `start`, `chargeDueAt` and `reminderDueAt` are instants. The client sends dates and times, and
 * reads instants only to display them.
 *
 * ## Statuses are the backend's, exactly
 *
 * Same rule as the booking DTOs: the app adds no plan or visit status of its own, and does not
 * re-derive what a status allows.
 */

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const instant = z.string().datetime({ offset: true });
const paise = z.number().int().nonnegative();
const visitNumber = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const planWindowSchema = z.object({ startDate: localDate, endDate: localDate });

export type PlanWindowDto = z.infer<typeof planWindowSchema>;

/**
 * `GET /v1/recurring/eligibility`.
 *
 * `unlocked` is the only way the app learns that recurring is locked: the planning routes refuse a
 * locked household with a bare 403 `FORBIDDEN`, whose reason the backend does not expose.
 */
export const recurringEligibilitySchema = z.object({
  policyVersion: z.string(),
  unlocked: z.boolean(),
  poolCount: z.number().int().nonnegative(),
  unlockThreshold: z.number().int().nonnegative(),
  window: planWindowSchema,
  limits: z.object({
    minDays: z.number().int().positive(),
    maxDays: z.number().int().positive(),
    maxVisitsPerDay: z.number().int().positive(),
  }),
  charging: z.object({
    chargeLeadHours: z.number().int().nonnegative(),
    reminderLeadHours: z.number().int().nonnegative(),
    mandateMaxChargePaise: paise,
  }),
  rescheduleGraceDays: z.number().int().nonnegative(),
});

export type RecurringEligibilityDto = z.infer<typeof recurringEligibilitySchema>;

/** `GET /v1/recurring/calendar?addressId` — every window day, and whether a pool Cook has room. */
export const recurringCalendarSchema = z.object({
  window: planWindowSchema,
  days: z.array(z.object({ date: localDate, available: z.boolean() })),
});

export type RecurringCalendarDto = z.infer<typeof recurringCalendarSchema>;

/** `POST /v1/recurring/start-times` — one visit duration, measured across the picked days. */
export const recurringStartTimesSchema = z.object({
  durationMinutes: z.number().int().positive(),
  startTimes: z.array(
    z.object({
      startTime: localTime,
      availableDates: z.array(localDate),
      /** `all` every picked day, `partial` some, `full` none. */
      coverage: z.enum(['all', 'partial', 'full']),
    }),
  ),
});

export type RecurringStartTimesDto = z.infer<typeof recurringStartTimesSchema>;

const quotedPriceSchema = z.object({
  serviceAmountPaise: paise,
  taxRateBps: z.number().int().nonnegative(),
  taxAmountPaise: paise,
  totalAmountPaise: paise,
  pricingVersion: z.string(),
});

/** `POST /v1/recurring/plans/quote` — read-only; nothing is held. */
export const recurringPlanQuoteSchema = z.object({
  policyVersion: z.string(),
  /** True when every visit can be reserved and none of the plan's own visits overlap. */
  bookable: z.boolean(),
  window: planWindowSchema,
  firstDate: localDate,
  lastDate: localDate,
  daysCount: z.number().int().nonnegative(),
  visitsCount: z.number().int().nonnegative(),
  overlaps: z.array(z.object({ date: localDate, visitNumbers: z.array(visitNumber) })),
  visits: z.array(
    z.object({
      date: localDate,
      visitNumber,
      startTime: localTime,
      durationMinutes: z.number().int().positive(),
      start: instant,
      overridden: z.boolean(),
      available: z.boolean(),
      /**
       * `AVAILABLE`, an availability-engine reason, or one of `CUSTOMER_BOOKING_OVERLAP`,
       * `VISIT_OVERLAP`, `POOL_CAPACITY_EXHAUSTED`. Left open: the engine's reasons move with it.
       */
      reason: z.string(),
    }),
  ),
  visitSummaries: z.array(
    z.object({
      visitNumber,
      durationMinutes: z.number().int().positive(),
      startTime: localTime,
      daysCount: z.number().int().nonnegative(),
      price: quotedPriceSchema,
    }),
  ),
  /** The smallest and largest single charge autopay will be asked for. */
  chargeRange: z.object({ minPaise: paise, maxPaise: paise }),
  /** Every visit's charge added up, tax included, if every visit runs. */
  totalPaise: paise,
  mandateMaxChargePaise: paise,
});

export type RecurringPlanQuoteDto = z.infer<typeof recurringPlanQuoteSchema>;

export const planStatusSchema = z.enum(['pending_mandate', 'active', 'completed', 'cancelled']);
export const planVisitStatusSchema = z.enum([
  'reserved',
  'charging',
  'confirmed',
  'charge_failed',
  'cancelled',
]);
export const mandateMethodSchema = z.enum(['upi', 'card']);
export const mandateStatusSchema = z.enum([
  'pending',
  'initiated',
  'confirmed',
  'rejected',
  'cancelled',
]);

export type PlanStatus = z.infer<typeof planStatusSchema>;
export type PlanVisitStatus = z.infer<typeof planVisitStatusSchema>;
export type MandateMethod = z.infer<typeof mandateMethodSchema>;
export type MandateStatus = z.infer<typeof mandateStatusSchema>;

/** The plan view every plan route returns: create, list, detail, cancel, reschedule, keep-going. */
export const recurringPlanSchema = z.object({
  planId: z.string(),
  status: planStatusSchema,
  addressId: z.string(),
  window: planWindowSchema,
  keepGoing: z.boolean(),
  mealNotes: z.string().nullable(),
  policyVersion: z.string(),
  templates: z.array(
    z.object({
      visitNumber,
      durationMinutes: z.number().int().positive(),
      startTime: localTime,
      daysScope: z.enum(['all', 'some']),
      price: z.object({
        totalAmountPaise: paise,
        serviceAmountPaise: paise,
        taxAmountPaise: paise,
        pricingVersion: z.string(),
      }),
    }),
  ),
  visits: z.array(
    z.object({
      visitId: z.string(),
      date: localDate,
      visitNumber,
      start: instant,
      durationMinutes: z.number().int().positive(),
      pricePaise: paise,
      status: planVisitStatusSchema,
      /** Set once the visit has become an ordinary booking, at T-24h. */
      bookingId: z.string().nullable(),
      chargeDueAt: instant,
      reminderDueAt: instant,
    }),
  ),
  autopay: z
    .object({
      mandateId: z.string(),
      method: mandateMethodSchema,
      status: mandateStatusSchema,
    })
    .nullable(),
  createdAt: instant,
  cancelledAt: instant.nullable(),
});

export type RecurringPlanDto = z.infer<typeof recurringPlanSchema>;

export const recurringPlanListSchema = z.array(recurringPlanSchema);

/** `POST /v1/me/recurring-plans/:planId/mandate` — what Razorpay's recurring checkout needs. */
export const mandateCheckoutSchema = z.object({
  mandateId: z.string(),
  planId: z.string(),
  method: mandateMethodSchema,
  status: z.literal('pending'),
  provider: z.literal('razorpay'),
  providerOrderId: z.string(),
  providerCustomerId: z.string(),
  /** The authorisation charge (₹1), refunded once the mandate is confirmed. */
  amountPaise: paise,
  currency: z.literal('INR'),
  /** The most any single visit charge may take. */
  maxAmountPaise: paise,
  authoriseBy: instant,
  /** Null when the backend has no Razorpay key configured — checkout cannot open. */
  keyId: z.string().nullable(),
});

export type MandateCheckoutDto = z.infer<typeof mandateCheckoutSchema>;

/** `POST /v1/me/recurring-plans/:planId/mandate/verify`. */
export const mandateVerifySchema = z.object({
  mandateId: z.string(),
  planId: z.string(),
  method: mandateMethodSchema,
  status: mandateStatusSchema,
  planStatus: planStatusSchema,
  confirmedAt: instant.nullable(),
});

export type MandateVerifyDto = z.infer<typeof mandateVerifySchema>;
