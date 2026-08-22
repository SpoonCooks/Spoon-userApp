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

export const instantAvailabilitySchema = z.object({
  available: z.boolean(),
  /**
   * The operating PROMISE in minutes, echoed from policy. It is NOT an ETA for a specific cook:
   * no cook has been assigned at this point, and nothing has been routed. The live ETA appears
   * only once a booking exists, from tracking.
   */
  arrivalTargetMinutes: z.number().int().nonnegative(),
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
