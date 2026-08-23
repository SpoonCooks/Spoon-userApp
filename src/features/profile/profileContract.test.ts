import { meResponseSchema, updateProfileResponseSchema } from '@features/auth';
import { isAddressUsable } from '@features/address';

import { profileDetailsFromMe, profileUpdateFrom } from './detailsData';
import { EMPTY_PROFILE_DETAILS } from './validation';

/**
 * The profile contract, both directions, and the serviceability verdict beside it.
 *
 * These are the two places where a Zod schema could silently STRIP a field the screens need, and
 * where a mapping could silently drop an answer. Both failures are invisible at runtime — the
 * form simply opens blank, or a save quietly stores less than the customer typed — so they are
 * asserted structurally rather than left to a screen test to notice.
 */

const WIRE_PROFILE = {
  id: 'user-1',
  role: 'user' as const,
  status: 'active',
  phone: '+919876543210',
  name: 'Aarav Mehta',
  householdStructure: 'bachelors',
  mealStructure: 'daily-cook-1x',
  pressingIssue: 'My cook never varies the menu.',
  dietaryPreference: 'vegetarian',
  grownUpEating: ['Rajasthani food', 'Bihari food'],
  regionPreference: 'my-state',
  genderPreference: 'male',
  profileComplete: true,
};

describe('GET /v1/me projection', () => {
  it('retains all eight answers and the identity beside them', () => {
    const parsed = meResponseSchema.parse(WIRE_PROFILE);

    // Named individually on purpose: a spread comparison would pass even if the schema dropped a
    // key the object never had, which is the exact regression this guards.
    expect(parsed.name).toBe('Aarav Mehta');
    expect(parsed.householdStructure).toBe('bachelors');
    expect(parsed.mealStructure).toBe('daily-cook-1x');
    expect(parsed.pressingIssue).toBe('My cook never varies the menu.');
    expect(parsed.dietaryPreference).toBe('vegetarian');
    expect(parsed.grownUpEating).toEqual(['Rajasthani food', 'Bihari food']);
    expect(parsed.regionPreference).toBe('my-state');
    expect(parsed.genderPreference).toBe('male');
    expect(parsed.profileComplete).toBe(true);
    expect(parsed.phone).toBe('+919876543210');
  });

  it('parses the same shape from the PUT reply, so one form prefills from either call', () => {
    const { id: _id, role: _role, status: _status, phone: _phone, ...profile } = WIRE_PROFILE;
    expect(updateProfileResponseSchema.parse(profile).mealStructure).toBe('daily-cook-1x');
  });

  /**
   * An option id nobody drew must not take the app down.
   *
   * `GET /v1/me` is read by the boot gate before anything renders, so a `z.enum` here would turn
   * a new backend chip into a launch failure. An unknown id simply matches no chip.
   */
  it('survives an option id this build does not know', () => {
    const parsed = meResponseSchema.parse({ ...WIRE_PROFILE, householdStructure: 'flatmates' });
    expect(parsed.householdStructure).toBe('flatmates');
  });
});

describe('prefill', () => {
  it('restores every answer onto the form', () => {
    const values = profileDetailsFromMe(meResponseSchema.parse(WIRE_PROFILE));

    expect(values).toEqual({
      name: 'Aarav Mehta',
      householdStructure: 'bachelors',
      mealStructure: 'daily-cook-1x',
      pressingIssue: 'My cook never varies the menu.',
      dietaryPreference: 'vegetarian',
      grownUpEating: ['Rajasthani food', 'Bihari food'],
      regionPreference: 'my-state',
      genderPreference: 'male',
    });
  });

  it('opens blank for an account that has answered nothing', () => {
    const values = profileDetailsFromMe(
      meResponseSchema.parse({
        ...WIRE_PROFILE,
        name: null,
        householdStructure: null,
        mealStructure: null,
        pressingIssue: null,
        dietaryPreference: null,
        grownUpEating: null,
        regionPreference: null,
        genderPreference: null,
        profileComplete: false,
      }),
    );

    expect(values).toEqual(EMPTY_PROFILE_DETAILS);
  });
});

describe('submit', () => {
  it('sends all eight keys, so an untouched answer round-trips instead of being omitted', () => {
    const values = profileDetailsFromMe(meResponseSchema.parse(WIRE_PROFILE));
    const body = profileUpdateFrom({ ...values, name: 'Rekha S' });

    expect(Object.keys(body).sort()).toEqual([
      'dietaryPreference',
      'genderPreference',
      'grownUpEating',
      'householdStructure',
      'mealStructure',
      'name',
      'pressingIssue',
      'regionPreference',
    ]);
    // The five the customer did not touch keep their stored values.
    expect(body.householdStructure).toBe('bachelors');
    expect(body.grownUpEating).toEqual(['Rajasthani food', 'Bihari food']);
  });

  it('trims text, and sends an emptied box as an explicit clear', () => {
    const body = profileUpdateFrom({
      ...EMPTY_PROFILE_DETAILS,
      name: '  Rekha S  ',
      pressingIssue: '   ',
    });

    expect(body.name).toBe('Rekha S');
    // `null` is the contract's clear. A blank string would mean the same thing to the server, but
    // saying it explicitly keeps "unanswered" and "cleared" one fact on both sides.
    expect(body.pressingIssue).toBeNull();
  });

  it('sends a deselected single-choice as null, which is what clears it', () => {
    const body = profileUpdateFrom({ ...EMPTY_PROFILE_DETAILS, name: 'Rekha S' });
    expect(body.regionPreference).toBeNull();
    expect(body.genderPreference).toBeNull();
  });

  /**
   * The collapse is DISPLAY-only and must never run backwards.
   *
   * `null` (never answered) and `[]` (answered, then emptied) are different facts the contract
   * keeps apart. The form cannot draw the difference, so a prefilled `null` shows as no chips —
   * but sending `null` back would claim the customer never answered.
   */
  it('sends an empty chip row as [] rather than null', () => {
    const body = profileUpdateFrom({ ...EMPTY_PROFILE_DETAILS, name: 'Rekha S' });
    expect(body.grownUpEating).toEqual([]);
  });

  it('does not copy the caller’s array into the request body', () => {
    const chips = ['Rajasthani food'];
    const body = profileUpdateFrom({ ...EMPTY_PROFILE_DETAILS, name: 'A', grownUpEating: chips });
    expect(body.grownUpEating).not.toBe(chips);
    expect(body.grownUpEating).toEqual(chips);
  });
});

describe('per-address serviceability', () => {
  const address = (status: string) => ({ serviceability: { status } }) as never;

  it('treats a serviceable address as usable', () => {
    expect(isAddressUsable(address('serviceable'))).toBe(true);
  });

  /**
   * A paused hub is not a reason to demand another address.
   *
   * The contract's own words: `temporarily_unavailable` means a hub polygon covers the address
   * but the hub is paused, and it is "expected to work again". Sending the customer to the map
   * would ask them to pin a new point in the same paused area, which refuses for the same reason.
   */
  it('keeps a temporarily unavailable address usable', () => {
    expect(isAddressUsable(address('temporarily_unavailable'))).toBe(true);
  });

  it('treats an out-of-area address as unusable', () => {
    expect(isAddressUsable(address('outside_service_area'))).toBe(false);
  });
});
