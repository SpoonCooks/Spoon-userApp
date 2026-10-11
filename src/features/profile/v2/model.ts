import { displayPhone } from '@features/auth';
import type { MeResponse } from '@features/auth';

import { profileChoiceField, profileField } from '../fields';
import type { ProfileChoiceFieldId } from '../fields';

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

function optionLabel(field: ProfileChoiceFieldId, id: string | null): string | null {
  if (id === null) return null;
  return profileChoiceField(field).options.find((option) => option.id === id)?.label ?? null;
}

/**
 * The completed card's "summary of the saved preferences" (`2209:10920` draws two lines, e.g.
 * "Veg · Medium spice" / "North Indian · No mushrooms"). From the answers the profile stores: the
 * diet and region preference, then up to two of the foods they grew up eating.
 */
export function foodSummaryOf(me: MeResponse): readonly string[] {
  const first = [
    optionLabel('dietaryPreference', me.dietaryPreference),
    optionLabel('regionPreference', me.regionPreference),
  ].filter((part): part is string => part !== null);
  const entry = profileField('grownUpEating');
  const known = entry.kind === 'entry' ? entry.options : [];
  // An open-entry field: a known id reads as its label, anything typed reads as typed.
  const grewUp = (me.grownUpEating ?? [])
    .map((id) => known.find((option) => option.id === id)?.label ?? id)
    .map((label) => label.replace(/ food$/, ''))
    .filter((label) => label.trim().length > 0)
    .slice(0, 2);
  return [first.join(' · '), grewUp.join(' · ')].filter((line) => line.length > 0);
}

export type PoolCardState = 'pool' | 'empty' | 'new';

/**
 * Which Cook Pool card to draw: the pool itself while it has cooks; the "Make your Cook Pool"
 * invite (`2146:6962`) once the customer has booked; "Build your Cook Pool" (`2146:6983`) before
 * their first booking.
 */
export function poolCardStateOf(input: {
  readonly poolCount: number | null;
  readonly hasBooked: boolean | null;
}): PoolCardState {
  if (input.poolCount === null || input.poolCount > 0) return 'pool';
  return input.hasBooked === false ? 'new' : 'empty';
}
