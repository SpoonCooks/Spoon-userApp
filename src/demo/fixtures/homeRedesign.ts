import type { ImageSourcePropType } from 'react-native';

import type { DurationOption, HomeModel, PoolCook } from '@features/homeRedesign';

/**
 * DEMO / TEST FIXTURES — NOT PRODUCTION DATA.
 *
 * The redesigned Home's four Figma frames (`941:4884`, `1255:2973`, `1290:1280`, `1302:3539`) as
 * payloads, plus the edge cases their dev notes call out. Every value is sample data: prices,
 * the ETA, the pool and the waitlist numbers all belong to the server.
 */

const BEAD_A = require('../../../assets/figma/home2/bead-cook-3.png') as ImageSourcePropType;
const BEAD_B = require('../../../assets/figma/home2/bead-cook-1.png') as ImageSourcePropType;

const DURATIONS: readonly DurationOption[] = [
  { id: 'd30', minutes: 30, label: '30 mins', pricePaise: 6900, mrpPaise: 15000 },
  { id: 'd45', minutes: 45, label: '45 mins', pricePaise: 6900, mrpPaise: 15000 },
  { id: 'd60', minutes: 60, label: '1 hr', pricePaise: 6900, mrpPaise: 15000, mostBooked: true },
  { id: 'd90', minutes: 90, label: '1.5 hrs', pricePaise: 6900, mrpPaise: 15000 },
  { id: 'd120', minutes: 120, label: '2 hrs', pricePaise: 6900, mrpPaise: 15000 },
  { id: 'd150', minutes: 150, label: '2.5 hrs', pricePaise: 6900, mrpPaise: 15000 },
];

/** `1260:27817` draws the beads in this order: Cook 3, Cook 1, Cook 2, Cook 4, Cook 5, Cook 6. */
const POOL: readonly PoolCook[] = [
  { id: 'cook-3', name: 'Cook 3', photo: BEAD_A },
  { id: 'cook-1', name: 'Cook 1', photo: BEAD_B },
  { id: 'cook-2', name: 'Cook 2', photo: BEAD_A },
  { id: 'cook-4', name: 'Cook 4', photo: BEAD_A },
  { id: 'cook-5', name: 'Cook 5', photo: BEAD_A },
  { id: 'cook-6', name: 'Cook 6', photo: BEAD_A },
];

/** `941:4884` — live pincode, no booking history, no pool. */
export const DEMO_HOME_FIRST_TIME: HomeModel = {
  serviceability: 'live',
  address: { label: 'Home · Building_name', pincode: '560102' },
  user: { hasCompletedBooking: false },
  instant: { available: true, etaMins: 4 },
  durations: DURATIONS,
  focusedDurationId: 'd60',
  cookPool: [],
  activeRecurringPlan: null,
  liveHubs: [],
  waitlist: null,
};

/** `1255:2973` / `1290:1280` — a repeat customer with a full pool and no plan. */
export const DEMO_HOME_RETURNING: HomeModel = {
  ...DEMO_HOME_FIRST_TIME,
  user: { hasCompletedBooking: true },
  cookPool: POOL,
};

/** Returning, with a recurring plan running — the chip reads "Recurring · Live". */
export const DEMO_HOME_RETURNING_PLAN: HomeModel = {
  ...DEMO_HOME_RETURNING,
  activeRecurringPlan: { id: 'plan-1' },
};

/** Returning with one pooled cook — Recurring stays locked; the chip reads "Check Recurring". */
export const DEMO_HOME_RETURNING_SMALL_POOL: HomeModel = {
  ...DEMO_HOME_RETURNING,
  cookPool: POOL.slice(0, 1),
};

/** Live pincode, instant unavailable — "Now" is disabled and the draft opens on "Later". */
export const DEMO_HOME_NO_INSTANT: HomeModel = {
  ...DEMO_HOME_FIRST_TIME,
  instant: { available: false, etaMins: null },
};

/** `1302:3539` — pincode not live; the 133 / 296pt meter fill is 128 of a 285 threshold. */
export const DEMO_HOME_NOT_LIVE: HomeModel = {
  ...DEMO_HOME_FIRST_TIME,
  serviceability: 'not_live',
  address: { label: 'Home · Building_name', pincode: '5600XX' },
  instant: { available: false, etaMins: null },
  liveHubs: [
    { id: 'hsr', name: 'HSR Layout' },
    { id: 'haralur', name: 'Haralur' },
  ],
  waitlist: { countForPincode: 128, launchThreshold: 285, joined: false },
};

/** Not live, already on the waitlist — "Notify me" loads as "You're on the list". */
export const DEMO_HOME_NOT_LIVE_JOINED: HomeModel = {
  ...DEMO_HOME_NOT_LIVE,
  waitlist: { countForPincode: 129, launchThreshold: 285, joined: true },
};
