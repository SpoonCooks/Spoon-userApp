import type { DataState } from '@core/data';

import type { ScheduleSelection, ScheduleViewModel } from './types';

/**
 * DEV-only step seeding for the Scheduled and Rescheduled flows.
 *
 * Both finalized sections draw their states as separate frames — `275:4488` … `34:3035` for
 * Schedule, `275:5442` … `275:5218` for Reschedule — but they are progressive states of ONE
 * screen. Without a seed only the first frame is deep-linkable, and task §16 requires every
 * finalized state to be reachable directly rather than by tapping through.
 *
 * The seed is built from the SUPPLIED payload's own first ids. Nothing is invented: if the server
 * sends different days or slots, the seed follows them. Reschedule has no `durations`, so its
 * step 3 is the start-time state rather than the duration one — which is exactly why that section
 * has three frames and Schedule has four.
 *
 * This never runs in a release build; callers guard on `__DEV__`.
 */
export function devScheduleSelection(
  state: DataState<ScheduleViewModel>,
  step: string | undefined,
): Partial<ScheduleSelection> | undefined {
  if (step === undefined || state.status !== 'ready') {
    return undefined;
  }

  const n = Number(step);
  if (!Number.isFinite(n) || n <= 1) {
    return undefined;
  }

  const schedule = state.data;
  const hasDurations = schedule.durations !== undefined && schedule.durations.length > 0;

  const dayId = schedule.days[0]?.id ?? null;
  const periodId = schedule.periods[0]?.id ?? null;
  const durationId = hasDurations ? (schedule.durations?.[0]?.id ?? null) : null;
  const slots = periodId === null ? [] : (schedule.slotsByPeriod[periodId] ?? []);
  const slotId = slots.find((slot) => slot.disabled !== true)?.id ?? null;

  // Step 2 reveals Time. Step 3 differs by mode: booking reveals Duration (`275:4938`, nothing
  // chosen yet), while reschedule has no Duration and its third frame (`275:5218`) is already the
  // complete state with a slot chosen and the CTA live.
  if (n === 2) {
    return { dayId };
  }
  if (n === 3) {
    return hasDurations ? { dayId, periodId } : { dayId, periodId, slotId };
  }
  return { dayId, periodId, durationId, slotId };
}
