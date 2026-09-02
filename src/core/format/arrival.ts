/**
 * When Spoon says a cook arrives — one rule, for every screen that says it.
 *
 * ## Why this is not two functions
 *
 * Home and the booking detail each did their own arithmetic over the same server ETA, and on
 * 2026-09-02 they disagreed on screen: the banner read "Arriving in 2 mins" while the booking
 * page read "6 mins", for one cook on one booking, seconds apart. The cook's own app said 2.
 *
 * They disagreed because only one of them clamped. A projected arrival BEFORE the booking starts
 * is normal — instant projects `now + preparation + travel` and a cook can beat it, and a
 * scheduled cook can set off early — but "arriving in 2 mins" for a booking that starts in 6 is a
 * promise Spoon has not made. The detail page learned that rule; Home never did.
 *
 * So the rule lives here and both call it. Two screens cannot disagree about one arrival if
 * neither owns the answer.
 */

/**
 * The instant Spoon will say the cook arrives: her projected arrival, never earlier than the
 * booking itself.
 *
 * `scheduledStart` absent or unparseable leaves the projection untouched — an unknown booking
 * time is not a reason to move an arrival Spoon does know.
 */
export function promisedArrivalAt(projected: Date, scheduledStartIso?: string | null): Date {
  if (scheduledStartIso === null || scheduledStartIso === undefined) return projected;
  const start = new Date(scheduledStartIso);
  if (Number.isNaN(start.getTime())) return projected;
  return start.getTime() > projected.getTime() ? start : projected;
}

/**
 * Whole minutes from `nowMs` until the promised arrival, floored at zero.
 *
 * ROUNDED, and rounded in one place: the booking page briefly used `Math.ceil` and said "3 mins"
 * while Home and the Cook App both said 2 for the same arrival.
 */
export function minutesToPromisedArrival(
  projected: Date,
  nowMs: number,
  scheduledStartIso?: string | null,
): number {
  const at = promisedArrivalAt(projected, scheduledStartIso);
  return Math.max(0, Math.round((at.getTime() - nowMs) / 60_000));
}
