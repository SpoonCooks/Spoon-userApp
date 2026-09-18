import { z } from 'zod';

/**
 * Availability DTOs — `GET /v1/availability/instant` and `GET /v1/availability/scheduled`.
 *
 * Verified against a live instance on 2026-08-18.
 *
 * ## `reason` is an open vocabulary
 *
 * The backend returns machine reasons such as `AVAILABLE`, `NO_PRESENT_COOK`,
 * `NO_SHIFT_COVERAGE`, `SOCIETY_NOT_SUPPORTED` and `OUTSIDE_OPERATING_WINDOW`. They are typed as
 * `string` rather than enumerated, because a client that crashes on an unseen reason is worse
 * than one that shows a generic unavailable state. The reasons the UI treats SPECIALLY are named
 * in the adapter; the rest degrade to "unavailable", which is always true.
 *
 * ## `validUntil`
 *
 * Both responses carry it. It is the server saying "this answer expires" — the client refetches
 * rather than extrapolating, and never treats an expired grid as still bookable.
 */

/**
 * The real, per-address arrival estimate — and the only number on this response that moves.
 *
 * Backend computes it on every instant-availability call: route time to THIS address's gate from
 * the chosen candidate cook (Google Routes in production), plus when that cook comes free, plus
 * the preparation allowance. Two addresses asked at the same moment get different answers.
 *
 * Present ONLY when a candidate exists, so it is nullish throughout and the caller falls back to
 * the promise rather than inventing a figure.
 *
 * Declared loosely on purpose. Everything but `etaMinutes` is passed through untouched, and
 * `etaMinutes` itself is nullish, so a payload that grows a sibling field or omits the block
 * entirely still parses.
 */
export const projectedArrivalSchema = z.object({
  etaMinutes: z.number().nullish(),
});

export const instantAvailabilitySchema = z.object({
  available: z.boolean(),
  /**
   * The operating PROMISE in minutes, echoed from policy — "a cook within 30 minutes".
   *
   * It is NOT an estimate. The backend locks it to exactly 30 (`INSTANT_ARRIVAL_TARGET_MINUTES`,
   * validated in `validateBookingPolicy` and re-clamped to `min: 30, max: 30` when published), so
   * it is the same number for every customer, address and hour, by design and by DEC-019.
   *
   * This comment used to claim a live ETA existed only after a booking, from tracking. That was
   * WRONG, and it is why `projectedArrival` went unread for so long: the estimate is computed
   * before any booking exists and is on this very response.
   */
  arrivalTargetMinutes: z.number().int().nonnegative(),
  /** The real estimate. See `projectedArrivalSchema`. */
  projectedArrival: projectedArrivalSchema.nullish(),
  /** Absent when available. */
  reason: z.string().optional(),
  validUntil: z.string().datetime(),
});

export type InstantAvailabilityDto = z.infer<typeof instantAvailabilitySchema>;

export const scheduledSlotSchema = z.object({
  /** ISO instant, UTC. The device renders it in local time; the server chose the instant. */
  start: z.string().datetime(),
  available: z.boolean(),
  reason: z.string(),
});

export type ScheduledSlotDto = z.infer<typeof scheduledSlotSchema>;

export const scheduledAvailabilitySchema = z.object({
  date: z.string(),
  durationMinutes: z.number().int().positive(),
  slots: z.array(scheduledSlotSchema),
  /** Set when the WHOLE day is refused (e.g. `SOCIETY_NOT_SUPPORTED`), not a per-slot reason. */
  rejection: z.string().nullish(),
  validUntil: z.string().datetime(),
});

export type ScheduledAvailabilityDto = z.infer<typeof scheduledAvailabilitySchema>;
