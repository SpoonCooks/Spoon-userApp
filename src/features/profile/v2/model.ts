import { displayPhone } from '@features/auth';
import type { MeResponse } from '@features/auth';

import { canonicalCuisine, dietLabel, regionLabel } from '../fields';

/**
 * The Account hub (Figma `2202:4311`, completed food profile `2209:10920`) — what dev note
 * `2084:2770` asks each block to say, from the data behind it.
 */

/** "Aarav" from "Aarav Mehta"; null while the customer has given no name. */
export function firstNameOf(name: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0] ?? '';
  return first.length === 0 ? null : first;
}

/** "+91 98765 00000" — the login number, read-only. */
export function phoneLabelOf(phone: string): string {
  return displayPhone(phone, '+91');
}

/**
 * The completed card's "summary of the saved preferences" (`2209:10920` draws two lines, e.g.
 * "Veg · Medium spice" / "North Indian · No mushrooms"). From the answers the profile stores: the
 * diet and region preference, then up to two of the foods they grew up eating.
 */
export function foodSummaryOf(me: MeResponse): readonly string[] {
  const first = [dietLabel(me.dietaryPreference), regionLabel(me.regionPreference)].filter(
    (part): part is string => part !== null,
  );
  // An open-entry field: a listed cuisine (by id or old " food" label) reads as today's chip,
  // anything else reads as stored.
  const grewUp = (me.grownUpEating ?? [])
    .map(canonicalCuisine)
    .filter((label) => label.length > 0)
    .slice(0, 2);
  return [first.join(' · '), grewUp.join(' · ')].filter((line) => line.length > 0);
}

export type PoolCardState = 'pool' | 'empty' | 'new' | 'pending';

/**
 * Which Cook Pool card to draw: the pool itself while it has cooks; the "Make your Cook Pool"
 * invite (`2146:6962`) once the customer has booked; "Build your Cook Pool" (`2146:6983`) before
 * their first booking.
 */
export function poolCardStateOf(input: {
  readonly poolCount: number | null;
  readonly hasBooked: boolean | null;
  /** Still loading: draw the card's shell rather than guess a variant and swap it later. */
  readonly pending?: boolean;
}): PoolCardState {
  if (input.pending === true) return 'pending';
  if (input.poolCount === null || input.poolCount > 0) return 'pool';
  return input.hasBooked === false ? 'new' : 'empty';
}
