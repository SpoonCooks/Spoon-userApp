import { PROFILE_FIELDS } from './fields';
import type { ProfileFieldId } from './fields';

/**
 * `338:4508` — what has to be true before Confirm may be pressed.
 *
 * ## Why this is a module and not an expression on the button
 *
 * The page is NON-SKIPPABLE for a new customer, so its CTA is the only way out of onboarding and
 * the rule behind it is asked three times: once to draw the button grey, once to refuse the
 * handler, and once by the tests. `features/address/validation.ts` exists for exactly this reason
 * and for exactly this defect — a greyed-out CTA that still fired its write because the screen
 * and the handler each carried their own copy of the condition.
 *
 * ## The rule
 *
 * A required field is satisfied when it HAS A VALUE. Optional fields never contribute: leaving
 * Household structure, the pressing-issue line, the grown-up-eating chips, Region or Gender empty
 * must not hold the CTA, because the frame does not mark them with a star.
 *
 * Text is judged on its TRIMMED value and the trimmed value is what gets submitted, so a name of
 * `'   '` can neither pass the gate nor be saved as blank.
 *
 * Nothing here knows about the network. `canSubmitProfileDetails` folds in the in-flight guard,
 * which is the only non-field condition — see `ProfileSubmitGate`.
 */

/** The form, as the screen holds it. One key per collected field; the group heading has none. */
export interface ProfileDetailsValues {
  readonly name: string;
  readonly householdStructure: string | null;
  readonly mealStructure: string | null;
  readonly pressingIssue: string;
  readonly dietaryPreference: string | null;
  /** `341:4655` — MULTI-select. Order is the order the customer added them. */
  readonly grownUpEating: readonly string[];
  readonly regionPreference: string | null;
  readonly genderPreference: string | null;
}

/** A blank form. The first-run starting point, and the base every prefill is layered onto. */
export const EMPTY_PROFILE_DETAILS: ProfileDetailsValues = {
  name: '',
  householdStructure: null,
  mealStructure: null,
  pressingIssue: '',
  dietaryPreference: null,
  grownUpEating: [],
  regionPreference: null,
  genderPreference: null,
};

/** True when the field carries an answer. Shape-driven, so a new field cannot be forgotten. */
function hasValue(values: ProfileDetailsValues, id: ProfileFieldId): boolean {
  const value = values[id];
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return value !== null;
}

/**
 * Every REQUIRED field still unanswered, in the order the page draws them.
 *
 * A list rather than a boolean so a failing test names the field that held the CTA, and so the
 * screen can say which one the day `338:4508` draws a validation state. It draws none today, so
 * nothing renders this yet.
 */
export function missingProfileFields(values: ProfileDetailsValues): readonly ProfileFieldId[] {
  return PROFILE_FIELDS.filter((field) => field.required && !hasValue(values, field.id)).map(
    (field) => field.id,
  );
}

export function isProfileDetailsComplete(values: ProfileDetailsValues): boolean {
  return missingProfileFields(values).length === 0;
}

export interface ProfileSubmitGate {
  readonly values: ProfileDetailsValues;
  /** A save is already in flight — the double-submission guard. */
  readonly submitting: boolean;
}

/**
 * The whole gate, in one place.
 *
 * `disabled` on the CTA is `!canSubmitProfileDetails(...)`, and the press handler asks the same
 * function again before it calls anything. Both readings come from here, so "grey" and "inert"
 * cannot disagree.
 */
export function canSubmitProfileDetails(gate: ProfileSubmitGate): boolean {
  if (gate.submitting) return false;
  return isProfileDetailsComplete(gate.values);
}

/* ------------------------------------------------------------------ multi-select */

/**
 * Add one value to `341:4655` without disturbing the others.
 *
 * Case- and whitespace-insensitive on the way in, because "Bihari food" and "bihari food " are the
 * same answer and a duplicate chip is not a second preference. The FIRST spelling is kept — the
 * customer's own — rather than the later one overwriting it.
 */
export function addGrownUpEating(current: readonly string[], value: string): readonly string[] {
  const trimmed = value.trim();
  if (trimmed === '') return current;
  const exists = current.some((entry) => entry.toLowerCase() === trimmed.toLowerCase());
  return exists ? current : [...current, trimmed];
}

/**
 * Remove ONE value. The founder's rule for this control is explicit — "removing one chip must not
 * clear the others" — so this filters rather than resetting, and every other selection survives.
 */
export function removeGrownUpEating(current: readonly string[], value: string): readonly string[] {
  return current.filter((entry) => entry.toLowerCase() !== value.toLowerCase());
}

/**
 * Single-select toggle.
 *
 * Pressing the SELECTED chip clears it rather than re-selecting it. That matters on the five
 * optional groups: a customer who taps "Bachelors" by accident must be able to get back to "no
 * answer", and there is no other control on the page that would let them. On the two required
 * groups the same tap simply re-greys the CTA, which is the honest state.
 */
export function toggleSingle(current: string | null, id: string): string | null {
  return current === id ? null : id;
}
