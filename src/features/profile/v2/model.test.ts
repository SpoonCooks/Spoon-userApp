import type { MeResponse } from '@features/auth';

import { firstNameOf, foodSummaryOf, phoneLabelOf, poolCardStateOf } from './model';

const ME: MeResponse = {
  id: 'u1',
  role: 'user',
  status: 'active',
  phone: '+919876500000',
  name: 'aarav Mehta',
  householdStructure: null,
  mealStructure: 'daily-cook-1x',
  pressingIssue: null,
  dietaryPreference: 'vegetarian',
  grownUpEating: ['punjabi', 'bengali', 'goan', 'Grandma’s dal'],
  regionPreference: 'north-indian',
  genderPreference: null,
  householdAdults: null,
  householdKids: null,
  householdElders: null,
  nonVegPreferences: null,
  oilLevel: null,
  gheeOnly: null,
  mealHassles: null,
  profileComplete: true,
};

describe('Account hub (dev note 2084:2770)', () => {
  it('greets by first name and shows the login number', () => {
    expect(firstNameOf(ME.name)).toBe('aarav');
    expect(firstNameOf(null)).toBeNull();
    expect(firstNameOf('  ')).toBeNull();
    expect(phoneLabelOf(ME.phone)).toBe('+91 98765 00000');
  });

  it('summarises the saved food preferences in two lines', () => {
    expect(foodSummaryOf(ME)).toEqual(['Vegetarian · North Indian', 'Punjabi · Bengali']);
    expect(
      foodSummaryOf({
        ...ME,
        dietaryPreference: null,
        regionPreference: null,
        grownUpEating: null,
      }),
    ).toEqual([]);
  });

  it('reads a typed food as typed', () => {
    expect(foodSummaryOf({ ...ME, grownUpEating: ['Grandma’s dal'] })[1]).toBe('Grandma’s dal');
  });

  it('picks the pool card: pool, invite after a booking, build before the first', () => {
    expect(poolCardStateOf({ poolCount: 2, hasBooked: true })).toBe('pool');
    expect(poolCardStateOf({ poolCount: null, hasBooked: null })).toBe('pool');
    expect(poolCardStateOf({ poolCount: 0, hasBooked: true })).toBe('empty');
    expect(poolCardStateOf({ poolCount: 0, hasBooked: null })).toBe('empty');
    expect(poolCardStateOf({ poolCount: 0, hasBooked: false })).toBe('new');
    expect(poolCardStateOf({ poolCount: null, hasBooked: null, pending: true })).toBe('pending');
  });
});
