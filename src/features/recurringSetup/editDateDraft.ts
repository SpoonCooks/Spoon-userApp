import { clashes, durationMinutes, startTimesFor } from './data';
import type { RecurringBusyWindow } from './data';
import type { RecurringTimeOfDay, RecurringVisitChoice } from './types';

/**
 * Edit date's working copy of a date's booking: what the three editors (`494:676`) have picked so
 * far. Unlike a finished `RecurringVisitChoice`, a part may be missing — changing the time of day
 * clears the start time, whose options depend on it, and a duration with no free start left in a
 * new band is let go.
 */
export interface EditDateDraft {
  readonly timeOfDay: RecurringTimeOfDay;
  readonly durationId: string | null;
  readonly startMinutes: number | null;
}

/** The three things a date's header offers to change, in the order its chips draw them. */
export type EditDateField = 'timeOfDay' | 'duration' | 'startTime';

/** The header title above each editor: "Edit duration" is Figma's (`494:676`). */
export const EDIT_DATE_TITLES: Readonly<Record<EditDateField, string>> = {
  timeOfDay: 'Edit time of the day',
  duration: 'Edit duration',
  startTime: 'Edit start time',
};

export function draftOf(visit: RecurringVisitChoice): EditDateDraft {
  return {
    timeOfDay: visit.timeOfDay,
    durationId: visit.durationId,
    startMinutes: visit.startMinutes,
  };
}

/** A duration is open while some start in the band still fits around the other visits. */
export function durationOpen(
  band: RecurringTimeOfDay,
  durationId: string,
  busy: readonly RecurringBusyWindow[],
): boolean {
  return startTimesFor(band).some((start) => !clashes(start, durationMinutes(durationId), busy));
}

/** A new time of the day keeps the duration only while it still fits, and drops the start. */
export function withTimeOfDay(
  draft: EditDateDraft,
  next: RecurringTimeOfDay,
  busy: readonly RecurringBusyWindow[],
): EditDateDraft {
  return {
    timeOfDay: next,
    durationId:
      draft.durationId !== null && durationOpen(next, draft.durationId, busy)
        ? draft.durationId
        : null,
    startMinutes: next === draft.timeOfDay ? draft.startMinutes : null,
  };
}

/** A new duration keeps the start only while it still clears the other visits. */
export function withDuration(
  draft: EditDateDraft,
  next: string,
  busy: readonly RecurringBusyWindow[],
): EditDateDraft {
  return {
    ...draft,
    durationId: next,
    startMinutes:
      draft.startMinutes !== null && !clashes(draft.startMinutes, durationMinutes(next), busy)
        ? draft.startMinutes
        : null,
  };
}

export function withStartTime(draft: EditDateDraft, next: number): EditDateDraft {
  return { ...draft, startMinutes: next };
}

/** The complete booking, or null while a part is missing. */
export function completeDraft(draft: EditDateDraft): RecurringVisitChoice | null {
  return draft.durationId === null || draft.startMinutes === null
    ? null
    : {
        timeOfDay: draft.timeOfDay,
        durationId: draft.durationId,
        startMinutes: draft.startMinutes,
      };
}

/** Whether the draft is a booking and not the one the date already has — "Save changes" unlocks. */
export function canSave(draft: EditDateDraft, original: RecurringVisitChoice): boolean {
  const choice = completeDraft(draft);
  return (
    choice !== null &&
    (choice.timeOfDay !== original.timeOfDay ||
      choice.durationId !== original.durationId ||
      choice.startMinutes !== original.startMinutes)
  );
}
