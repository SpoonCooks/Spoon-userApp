import { z } from 'zod';

/**
 * The refund tracker (DEC-090, `GET /v1/me/refunds/{id}` and every customer refund record).
 *
 * Every refund — a one-time booking's or a Recurring visit's — carries one `tracker`: whether it is
 * in progress, completed (the bank confirmed it, with a reference) or failed; who cancelled; the
 * breakdown; three dated steps; and, for a Recurring refund, its plan and visit.
 *
 * Enums stay strings where a new server value must not throw the screen (`cause`, `method`), and
 * are read through `adapters.ts`, which treats anything unknown conservatively.
 */
export const refundTrackerSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'failed']),
  cause: z.string(),
  method: z.string().nullable(),
  breakdown: z.object({
    paidPaise: z.number().int().nonnegative(),
    feePercent: z.number().int().min(0).max(100),
    feePaise: z.number().int().nonnegative(),
    refundPaise: z.number().int().nonnegative(),
  }),
  steps: z.array(
    z.object({
      key: z.enum(['initiated', 'processed', 'completed']),
      at: z.string().nullable(),
    }),
  ),
  failedAt: z.string().nullable(),
  reference: z.object({ type: z.string(), number: z.string() }).nullable(),
  recurring: z
    .object({
      recurringBookingId: z.string(),
      visitId: z.string(),
      planNumber: z.number().int(),
      visitNumber: z.number().int(),
      planVisitCount: z.number().int(),
    })
    .nullable(),
});

export type RefundTrackerDto = z.infer<typeof refundTrackerSchema>;

/** The service a refund belongs to, for the tracker's header ("Cook visit · 1 hr"). */
export const refundServiceSchema = z.object({
  serviceStart: z.string().nullish(),
  durationMinutes: z.number().int().positive().nullish(),
});

/** One customer refund, as `GET /v1/me/refunds/{id}` returns it. */
export const customerRefundSchema = refundServiceSchema.extend({
  refundId: z.string(),
  /** Null for a Recurring debit's refund (a visit that never became a booking). */
  bookingId: z.string().nullable(),
  amountPaise: z.number().int().nonnegative(),
  state: z.string(),
  requestedAt: z.string(),
  tracker: refundTrackerSchema,
});

export type CustomerRefundDto = z.infer<typeof customerRefundSchema>;

export const customerRefundResponseSchema = z.object({ refund: customerRefundSchema });
