import type { DishComplexity } from './recommendDuration';

export type BookingMode = 'now' | 'later' | 'recurring';

/**
 * Everything the customer has chosen on Home but not yet booked.
 *
 * `focusedDurationId` is the tile the carousel is centred on; `selectedDurationId` is the tile the
 * customer actually chose. They start apart: "1 hr" opens focused but NOT selected, so the CTA
 * stays disabled until a tap. Once something is selected, snapping the carousel moves the
 * selection with it, so the big tile is always the chosen one.
 *
 * Switching mode never touches the duration, so leaving Recurring restores what was chosen.
 */
export interface BookingDraft {
  readonly mode: BookingMode;
  readonly focusedDurationId: string;
  readonly selectedDurationId: string | null;
  readonly complexity: DishComplexity;
  readonly dishes: number;
  readonly people: number;
}

export const DISH_LIMITS = { min: 1, max: 10 } as const;
export const PEOPLE_LIMITS = { min: 1, max: 20 } as const;

export type DraftAction =
  | { type: 'setMode'; mode: BookingMode }
  | { type: 'focusDuration'; id: string }
  | { type: 'selectDuration'; id: string }
  | { type: 'setComplexity'; complexity: DishComplexity }
  | { type: 'setDishes'; value: number }
  | { type: 'setPeople'; value: number };

export function initialDraft(input: {
  focusedDurationId: string;
  instantAvailable: boolean;
  mode?: BookingMode;
}): BookingDraft {
  const wanted = input.mode ?? 'now';
  return {
    // "Now" is disabled when instant is unavailable, so a draft never starts on it.
    mode: wanted === 'now' && !input.instantAvailable ? 'later' : wanted,
    focusedDurationId: input.focusedDurationId,
    selectedDurationId: null,
    complexity: 'simple',
    dishes: 2,
    people: 4,
  };
}

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, Math.round(value)));

export function draftReducer(draft: BookingDraft, action: DraftAction): BookingDraft {
  switch (action.type) {
    case 'setMode':
      return draft.mode === action.mode ? draft : { ...draft, mode: action.mode };
    case 'focusDuration':
      if (draft.focusedDurationId === action.id) return draft;
      return {
        ...draft,
        focusedDurationId: action.id,
        selectedDurationId: draft.selectedDurationId === null ? null : action.id,
      };
    case 'selectDuration':
      return { ...draft, focusedDurationId: action.id, selectedDurationId: action.id };
    case 'setComplexity':
      return { ...draft, complexity: action.complexity };
    case 'setDishes':
      return { ...draft, dishes: clamp(action.value, DISH_LIMITS) };
    case 'setPeople':
      return { ...draft, people: clamp(action.value, PEOPLE_LIMITS) };
  }
}

/** The booking CTA: live only with a tapped duration, and — for Now — an available instant. */
export function canBook(draft: BookingDraft, instantAvailable: boolean): boolean {
  if (draft.mode === 'recurring' || draft.selectedDurationId === null) return false;
  return draft.mode === 'later' || instantAvailable;
}
