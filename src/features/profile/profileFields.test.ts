import {
  PROFILE_FIELDS,
  PROFILE_REQUIRED_FIELDS,
  profileChoiceField,
  profilePromptField,
} from './fields';
import {
  EMPTY_PROFILE_DETAILS,
  addGrownUpEating,
  canSubmitProfileDetails,
  isProfileDetailsComplete,
  missingProfileFields,
  removeGrownUpEating,
  toggleSingle,
} from './validation';
import type { ProfileDetailsValues } from './validation';

/**
 * `338:4508` — the field matrix and the CTA gate, as pure functions.
 *
 * ## Why the required set is asserted as a LIST
 *
 * The founder's rule is "sections marked `*` are mandatory", and the whole flow hangs off getting
 * that set right: too few and a first-run customer is let through with nothing useful recorded,
 * too many and Confirm never enables and onboarding is a dead end. Three labels in `338:4511`
 * carry a star and five do not, so the set is spelled out rather than inferred — a future file
 * that adds or drops a star fails HERE, loudly, instead of quietly changing who can proceed.
 */

const COMPLETE: ProfileDetailsValues = {
  ...EMPTY_PROFILE_DETAILS,
  name: 'Aarav Mehta',
  mealStructure: 'daily-cook-1x',
  dietaryPreference: 'vegetarian',
};

describe('the V8 field matrix', () => {
  /** Exactly the three starred labels, and nothing else. */
  it('marks Name, Daily meal structure and Dietary preference as the only required fields', () => {
    expect(PROFILE_REQUIRED_FIELDS).toEqual(['name', 'mealStructure', 'dietaryPreference']);
  });

  /** The star is drawn, so it is part of the transcribed label. */
  it('draws a star on every required label and on no optional one', () => {
    for (const field of PROFILE_FIELDS) {
      expect(field.label.includes('*')).toBe(field.required);
    }
  });

  /** `341:4655` is the one multi-select; every other chip group takes a single answer. */
  it('makes only the grown-up-eating field multi-select', () => {
    const multi = PROFILE_FIELDS.filter((field) => field.kind === 'multi').map((f) => f.id);
    const single = PROFILE_FIELDS.filter((field) => field.kind === 'single').map((f) => f.id);

    expect(multi).toEqual([]);
    expect(PROFILE_FIELDS.find((f) => f.id === 'grownUpEating')?.kind).toBe('entry');
    expect(single).toEqual([
      'householdStructure',
      'mealStructure',
      'dietaryPreference',
      'regionPreference',
      'genderPreference',
    ]);
  });

  /** The two chip families, per group — see `PreferenceChips`. */
  it('assigns each chip group the tone the frame draws it in', () => {
    expect(profileChoiceField('householdStructure').tone).toBe('lime');
    expect(profileChoiceField('regionPreference').tone).toBe('lime');
    expect(profileChoiceField('genderPreference').tone).toBe('lime');
    expect(profileChoiceField('mealStructure').tone).toBe('gold');
    expect(profileChoiceField('dietaryPreference').tone).toBe('gold');
  });

  /** `456:3405` is 2-up; `341:4647` and `341:4630` are 3-up. */
  it('lays each group out on the frame’s own column count', () => {
    expect(profileChoiceField('householdStructure').columns).toBe(2);
    expect(profileChoiceField('mealStructure').columns).toBe(2);
    expect(profileChoiceField('dietaryPreference').columns).toBe(2);
    expect(profileChoiceField('regionPreference').columns).toBe(3);
    expect(profileChoiceField('genderPreference').columns).toBe(3);
  });

  it('carries the frame’s own placeholders', () => {
    expect(profilePromptField('name').placeholder).toBe('Name*');
    expect(profilePromptField('pressingIssue').placeholder).toBe(
      'I don’t like my cook because ...',
    );
    expect(profilePromptField('grownUpEating').placeholder).toBe('Rajasthani food');
  });
});

describe('the CTA gate', () => {
  it('names every unmet requirement, in the order the page draws them', () => {
    expect(missingProfileFields(EMPTY_PROFILE_DETAILS)).toEqual([
      'name',
      'mealStructure',
      'dietaryPreference',
    ]);
  });

  it('accepts the three starred answers alone', () => {
    expect(missingProfileFields(COMPLETE)).toEqual([]);
    expect(isProfileDetailsComplete(COMPLETE)).toBe(true);
    expect(canSubmitProfileDetails({ values: COMPLETE, submitting: false })).toBe(true);
  });

  it('is not satisfied by optional answers', () => {
    const optionalOnly: ProfileDetailsValues = {
      ...EMPTY_PROFILE_DETAILS,
      householdStructure: 'bachelors',
      pressingIssue: 'my cook is late',
      grownUpEating: ['Bihari food'],
      regionPreference: 'my-state',
      genderPreference: 'either',
    };

    expect(isProfileDetailsComplete(optionalOnly)).toBe(false);
    expect(missingProfileFields(optionalOnly)).toEqual([
      'name',
      'mealStructure',
      'dietaryPreference',
    ]);
  });

  /** `'   '` is not a name — the gate and the submitted value agree on the trimmed string. */
  it('rejects a whitespace-only name', () => {
    expect(isProfileDetailsComplete({ ...COMPLETE, name: '   ' })).toBe(false);
  });

  /** The double-submission guard: a save in flight closes the gate however complete the form. */
  it('refuses while a save is already in flight', () => {
    expect(canSubmitProfileDetails({ values: COMPLETE, submitting: true })).toBe(false);
  });
});

describe('multi-select (341:4655)', () => {
  it('accumulates values', () => {
    let list: readonly string[] = [];
    list = addGrownUpEating(list, 'Rajasthani food');
    list = addGrownUpEating(list, 'Bihari food');
    list = addGrownUpEating(list, 'Odiya food');

    expect(list).toEqual(['Rajasthani food', 'Bihari food', 'Odiya food']);
  });

  /** The founder's rule, as a unit: removing one leaves the others untouched and in order. */
  it('removes one value and keeps the rest', () => {
    const list = ['Rajasthani food', 'Bihari food', 'Odiya food'];
    expect(removeGrownUpEating(list, 'Bihari food')).toEqual(['Rajasthani food', 'Odiya food']);
  });

  /** A duplicate is not a second preference, and the customer's own spelling is the one kept. */
  it('ignores a case- or whitespace-only duplicate', () => {
    const list = addGrownUpEating(['Bihari food'], '  bihari FOOD ');
    expect(list).toEqual(['Bihari food']);
  });

  it('ignores an empty submission', () => {
    expect(addGrownUpEating(['Bihari food'], '   ')).toEqual(['Bihari food']);
  });
});

describe('single-select', () => {
  it('replaces the current answer', () => {
    expect(toggleSingle('vegan', 'vegetarian')).toBe('vegetarian');
  });

  /**
   * Pressing the selected chip CLEARS it. On the five optional groups that is the only way back to
   * "no answer" — there is no other control on the page that offers it.
   */
  it('clears the answer when the selected chip is pressed again', () => {
    expect(toggleSingle('vegan', 'vegan')).toBeNull();
  });
});
