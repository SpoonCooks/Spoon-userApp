import { z } from 'zod';

/**
 * Recurring booking DTOs — DEC-086 (V2), V0 `feat/cook-pool-recurring-plans`.
 *
 * Transcribed from the backend's own response builders (`src/recurring/booking-capacity.ts`,
 * `recurring-booking-service.ts`, `recurring-cancellation.ts`, `mandate-service.ts`) and its
 * OpenAPI `Recurring` tag, not yet from a live instance.
 *
 * ## Dates and times are wall-clock, instants are ISO
 *
 * `date` is an Asia/Kolkata calendar date (`YYYY-MM-DD`) and `startTime` an Asia/Kolkata `HH:MM`.
 * `start` and `cookConfirmBy` are instants. The client sends dates and times, and reads instants
 * only to display them.
 *
 * ## Statuses are the backend's, exactly
 *
 * Same rule as the booking DTOs: the app adds no booking or visit status of its own, and does not
 * re-derive what a status allows — `displayState` and `cancellable` are the server's rulings.
 */

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const instant = z.string().datetime({ offset: true });
const paise = z.number().int().nonnegative();
const count = z.number().int().nonnegative();

export const timeOfDaySchema = z.enum(['morning', 'afternoon', 'evening']);
export type TimeOfDayDto = z.infer<typeof timeOfDaySchema>;

export const recurringWindowSchema = z.object({ startDate: localDate, endDate: localDate });
export type RecurringWindowDto = z.infer<typeof recurringWindowSchema>;

/** A duration's prices: the struck-through base, the effective price, its GST and the debit. */
export const durationPriceSchema = z.object({
  durationMinutes: z.number().int().positive(),
  basePricePaise: paise,
  pricePaise: paise,
  gstPaise: paise,
  totalPaise: paise,
  pricingVersion: z.string(),
});
export type DurationPriceDto = z.infer<typeof durationPriceSchema>;

const priceSchema = durationPriceSchema.omit({ durationMinutes: true });

/**
 * `GET /v1/recurring/eligibility` — the landing, Home's chip and Step 1's limits in one read.
 *
 * `unlocked` is how the app learns Recurring is locked; the planning routes refuse a locked
 * household with 403 `RECURRING_LOCKED`.
 */
export const recurringEligibilitySchema = z.object({
  policyVersion: z.string(),
  unlocked: z.boolean(),
  poolCount: count,
  unlockThreshold: z.number().int().positive(),
  /** Home's Recurring chip. */
  chip: z.enum(['locked', 'book', 'live']),
  liveBookings: z.array(
    z.object({
      recurringBookingId: z.string(),
      status: z.enum(['pending_mandate', 'active']),
      windowStart: localDate,
      windowEnd: localDate,
    }),
  ),
  window: recurringWindowSchema,
  limits: z.object({ minDays: z.number().int().positive(), maxDays: z.number().int().positive() }),
  timesOfDay: z.array(
    z.object({ timeOfDay: timeOfDaySchema, firstStart: localTime, lastStart: localTime }),
  ),
  durations: z.array(durationPriceSchema),
  charging: z.object({
    notifyLeadHours: z.number().int().positive(),
    debitLeadHours: z.number().int().positive(),
    mandateMaxChargePaise: paise,
  }),
});
export type RecurringEligibilityDto = z.infer<typeof recurringEligibilitySchema>;

/** `GET /v1/recurring/calendar` — the window's 21 days; a live booking's dates are not selectable. */
export const recurringCalendarSchema = z.object({
  window: recurringWindowSchema,
  days: z.array(z.object({ date: localDate, selectable: z.boolean() })),
});
export type RecurringCalendarDto = z.infer<typeof recurringCalendarSchema>;

/**
 * `POST /v1/recurring/start-times` — the starts one visit can have on every one of its dates,
 * grouped by time of day. A time of day with none left is `available: false`.
 */
export const recurringStartTimesSchema = z.object({
  durationMinutes: z.number().int().positive(),
  timesOfDay: z.array(
    z.object({
      timeOfDay: timeOfDaySchema,
      available: z.boolean(),
      startTimes: z.array(localTime),
    }),
  ),
});
export type RecurringStartTimesDto = z.infer<typeof recurringStartTimesSchema>;

/** `POST /v1/recurring/bookings/quote` — read-only; nothing is held, no Cook is named. */
export const recurringQuoteSchema = z.object({
  policyVersion: z.string(),
  /** True when every visit can be held and none of the booking's own visits overlap. */
  bookable: z.boolean(),
  window: recurringWindowSchema,
  firstDate: localDate,
  lastDate: localDate,
  daysCount: count,
  visitsCount: count,
  overlaps: z.array(
    z.object({ planNumber: z.number().int(), date: localDate, visitNumbers: z.array(z.number()) }),
  ),
  visits: z.array(
    z.object({
      planNumber: z.number().int().positive(),
      visitNumber: z.number().int().positive(),
      date: localDate,
      timeOfDay: timeOfDaySchema,
      startTime: localTime,
      durationMinutes: z.number().int().positive(),
      start: instant,
      available: z.boolean(),
      /**
       * `AVAILABLE`, an availability-engine reason, or one of `CUSTOMER_BOOKING_OVERLAP`,
       * `VISIT_OVERLAP`, `POOL_CAPACITY_EXHAUSTED`, `DATE_IN_LIVE_RECURRING`. Left open: the
       * engine's reasons move with it.
       */
      reason: z.string(),
    }),
  ),
  visitSummaries: z.array(
    z.object({
      planNumber: z.number().int().positive(),
      visitNumber: z.number().int().positive(),
      timeOfDay: timeOfDaySchema,
      durationMinutes: z.number().int().positive(),
      startTime: localTime,
      daysCount: count,
      price: durationPriceSchema,
    }),
  ),
  /** The smallest and largest single debit Autopay will be asked for. */
  chargeRange: z.object({ minPaise: paise, maxPaise: paise }),
  /** Every visit's debit added up, GST included, if every visit runs. */
  totalPaise: paise,
  mandateMaxChargePaise: paise,
});
export type RecurringQuoteDto = z.infer<typeof recurringQuoteSchema>;

export const bookingStatusSchema = z.enum(['pending_mandate', 'active', 'completed', 'cancelled']);
export const visitStatusSchema = z.enum([
  'scheduled',
  'notified',
  'charged',
  'completed',
  'cancelled',
]);
/** The four visit-details states (DEC-086). */
export const visitDisplayStateSchema = z.enum([
  'cook_pending',
  'cook_assigned',
  'completed',
  'cancelled',
]);
export const mandateDisplayStatusSchema = z.enum([
  'pending',
  'active',
  'paused',
  'revoked',
  'expired',
  'rejected',
]);
export const mandateStatusSchema = z.enum([
  'pending',
  'initiated',
  'confirmed',
  'paused',
  'rejected',
  'cancelled',
  'expired',
]);

export type RecurringBookingStatus = z.infer<typeof bookingStatusSchema>;
export type RecurringVisitStatus = z.infer<typeof visitStatusSchema>;
export type VisitDisplayState = z.infer<typeof visitDisplayStateSchema>;
export type MandateDisplayStatus = z.infer<typeof mandateDisplayStatusSchema>;
export type MandateStatus = z.infer<typeof mandateStatusSchema>;

/**
 * One visit on one date. `cook` and `bookingId` appear only once its T−3h debit succeeded: before
 * that the backend never names, shows or hints at the Cook held for it.
 */
export const visitSummarySchema = z.object({
  visitId: z.string(),
  planNumber: z.number().int().positive(),
  visitNumber: z.number().int().positive(),
  date: localDate,
  timeOfDay: timeOfDaySchema,
  startTime: localTime,
  start: instant,
  durationMinutes: z.number().int().positive(),
  status: visitStatusSchema,
  displayState: visitDisplayStateSchema,
  /** "Cook confirmed by" — the visit's T−3h. */
  cookConfirmBy: instant,
  cook: z
    .object({
      cookId: z.string(),
      displayName: z.string(),
      profileImageUrl: z.string().nullable(),
      rating: z.object({ average: z.number(), count: z.number().int() }),
    })
    .nullable(),
  bookingId: z.string().nullable(),
  totalPaise: paise,
  cancelledBy: z.enum(['customer', 'payment_failed', 'spoon']).nullable(),
});
export type VisitSummaryDto = z.infer<typeof visitSummarySchema>;

export const mandateSummarySchema = z.object({
  mandateId: z.string(),
  method: z.literal('upi'),
  status: mandateDisplayStatusSchema,
  /** e.g. `ra••••@okhdfc`. Null until the bank confirms. */
  handleMasked: z.string().nullable(),
  maxAmountPaise: paise,
});
export type MandateSummaryDto = z.infer<typeof mandateSummarySchema>;

const supportSchema = z.object({ whatsappUrl: z.string().nullable() });

/** The Recurring tab: Live booking and Manage plans in one read. */
export const recurringBookingSchema = z.object({
  recurringBookingId: z.string(),
  status: bookingStatusSchema,
  addressId: z.string(),
  window: recurringWindowSchema,
  policyVersion: z.string(),
  mandate: mandateSummarySchema.nullable(),
  /** The re-approve banner while later visits cannot be debited. */
  banner: z
    .object({
      kind: z.enum(['MANDATE_PAUSED', 'MANDATE_REVOKED', 'MANDATE_EXPIRED']),
      action: z.literal('REAPPROVE_MANDATE'),
    })
    .nullable(),
  counts: z.object({ done: count, cancelled: count, toGo: count }),
  plans: z.array(
    z.object({
      planNumber: z.number().int().positive(),
      days: z.array(localDate),
      visits: z.array(
        z.object({
          visitNumber: z.number().int().positive(),
          timeOfDay: timeOfDaySchema,
          durationMinutes: z.number().int().positive(),
          startTime: localTime,
          days: z.array(localDate),
          price: priceSchema,
        }),
      ),
      history: z.array(visitSummarySchema),
    }),
  ),
  days: z.array(
    z.object({
      date: localDate,
      group: z.enum(['past', 'today', 'upcoming']),
      visits: z.array(visitSummarySchema),
    }),
  ),
  upNext: visitSummarySchema.nullable(),
  chargeRange: z.object({ minPaise: paise, maxPaise: paise }),
  support: supportSchema,
  createdAt: instant,
  cancelledAt: instant.nullable(),
  cancelledBy: z.enum(['customer', 'spoon', 'system']).nullable(),
});
export type RecurringBookingDto = z.infer<typeof recurringBookingSchema>;

export const recurringBookingListSchema = z.array(recurringBookingSchema);

/** One visit's details: price, payment once debited, the cancellation outcome, prep checks. */
export const visitDetailSchema = visitSummarySchema.extend({
  recurringBookingId: z.string(),
  price: priceSchema,
  payment: z
    .object({
      bookingId: z.string(),
      pricePaise: paise,
      gstPaise: paise,
      totalPaise: paise,
      chargedAt: instant.nullable(),
      mode: z.literal('upi_autopay'),
    })
    .nullable(),
  cancellation: z
    .object({
      cancelledBy: z.enum(['customer', 'payment_failed', 'spoon']),
      cancelledAt: instant,
      window: z.number().int().min(1).max(3).nullable(),
      reasonCode: z.string().nullable(),
      feePercent: z.number().int(),
      feePaise: paise,
      refundPaise: paise,
      refundStatus: z.enum(['processing', 'refunded', 'failed']).nullable(),
      /**
       * The visit's refund, for the refund tracker (`GET /v1/me/refunds/{id}`, DEC-090). Null when
       * nothing is refunded or the refund pass has not picked it up yet; `.nullish()` for
       * deployments that predate it.
       */
      refundId: z.string().nullish(),
      /** True when nothing was charged at all. */
      nothingCharged: z.boolean(),
    })
    .nullable(),
  mandate: mandateSummarySchema.nullable(),
  prep: z
    .object({
      entryApproved: z.boolean(),
      groceriesReady: z.boolean(),
      utensilsReady: z.boolean(),
    })
    .nullable(),
  support: supportSchema,
});
export type VisitDetailDto = z.infer<typeof visitDetailSchema>;

/** `POST .../mandate` — what Razorpay's UPI Autopay checkout needs. */
export const mandateCheckoutSchema = z.object({
  mandateId: z.string(),
  recurringBookingId: z.string(),
  method: z.literal('upi'),
  status: mandateStatusSchema,
  provider: z.literal('razorpay'),
  providerOrderId: z.string(),
  providerCustomerId: z.string(),
  /** The authorisation amount (₹1), refunded once the mandate is confirmed. */
  amountPaise: paise,
  currency: z.literal('INR'),
  /** The per-debit ceiling. */
  maxAmountPaise: paise,
  /** When an unapproved booking is released. Null for a re-approval of a live booking. */
  approveBy: instant.nullable(),
  /** Null when the backend has no Razorpay key configured — checkout cannot open. */
  keyId: z.string().nullable(),
});
export type MandateCheckoutDto = z.infer<typeof mandateCheckoutSchema>;

/** `POST .../mandate/verify`. `initiated` is normal for UPI: the bank confirms by webhook. */
export const mandateVerifySchema = z.object({
  mandateId: z.string(),
  recurringBookingId: z.string(),
  method: z.literal('upi'),
  status: mandateStatusSchema,
  bookingStatus: bookingStatusSchema,
  handleMasked: z.string().nullable(),
  confirmedAt: instant.nullable(),
});
export type MandateVerifyDto = z.infer<typeof mandateVerifySchema>;

/** What cancelling one visit now would cost. */
export const visitCancellationQuoteSchema = z.object({
  visitId: z.string(),
  cancellable: z.boolean(),
  refusalReason: z
    .enum(['VISIT_STARTED', 'VISIT_COMPLETED', 'VISIT_CANCELLED', 'COOK_DISPATCHED'])
    .optional(),
  /** 1 before T−27h, 2 until T−3h (both free), 3 after the debit (the V0 fee bands). */
  window: z.number().int().min(1).max(3).nullable(),
  feePercent: z.number().int(),
  feePaise: paise,
  refundPaise: paise,
  chargedPaise: paise,
  nothingCharged: z.boolean(),
});
export type VisitCancellationQuoteDto = z.infer<typeof visitCancellationQuoteSchema>;

export const bookingCancellationQuoteSchema = z.object({
  recurringBookingId: z.string(),
  cancellable: z.boolean(),
  freeCount: count,
  debited: z.array(
    z.object({
      visitId: z.string(),
      date: localDate,
      feePercent: z.number().int(),
      feePaise: paise,
      refundPaise: paise,
    }),
  ),
  startedCount: count,
  totals: z.object({ feePaise: paise, refundPaise: paise }),
});
export type BookingCancellationQuoteDto = z.infer<typeof bookingCancellationQuoteSchema>;

export const bookingCancellationSchema = z.object({
  booking: recurringBookingSchema,
  visitsCancelled: count,
  totals: z.object({ feePaise: paise, refundPaise: paise }),
  /** The optional WhatsApp message to the team, prefilled with the booking and reason. */
  whatsappUrl: z.string().nullable(),
});
export type BookingCancellationDto = z.infer<typeof bookingCancellationSchema>;

/** `GET/PUT /v1/bookings/:bookingId/prep`. */
export const bookingPrepSchema = z.object({
  bookingId: z.string(),
  entryApproved: z.boolean(),
  groceriesReady: z.boolean(),
  utensilsReady: z.boolean(),
  updatedAt: instant,
});
export type BookingPrepDto = z.infer<typeof bookingPrepSchema>;
