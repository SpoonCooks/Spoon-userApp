import type { ImageSourcePropType } from 'react-native';

/**
 * The redesigned Home's payload — the shape the Figma dev notes describe. Every field is
 * server-owned; the client only renders it and derives presentation from it (`state/`).
 *
 * TODO(backend-contract): no endpoint exists yet. `data.ts` serves fixtures from
 * `@/demo/fixtures/homeRedesign` until one does.
 */

export type Serviceability = 'live' | 'not_live';

/** One carousel tile. Prices come from the API in paise and are never computed here. */
export interface DurationOption {
  readonly id: string;
  readonly minutes: number;
  readonly label: string;
  readonly pricePaise: number;
  readonly mrpPaise: number | null;
  readonly mostBooked?: boolean;
}

export interface PoolCook {
  readonly id: string;
  readonly name: string;
  /** A real cook's photo. Cooks without one are not rendered as beads (no placeholder faces). */
  readonly photo: ImageSourcePropType | null;
}

export interface RecurringPlan {
  readonly id: string;
}

export interface LiveHub {
  readonly id: string;
  readonly name: string;
}

export interface Waitlist {
  readonly countForPincode: number;
  readonly launchThreshold: number;
  readonly joined: boolean;
}

export interface HomeModel {
  readonly serviceability: Serviceability;
  readonly address: { readonly label: string; readonly pincode: string };
  readonly user: { readonly hasCompletedBooking: boolean };
  readonly instant: { readonly available: boolean; readonly etaMins: number | null };
  readonly durations: readonly DurationOption[];
  /** The tile the carousel opens centred on ("1 hr"). Focused, never pre-selected. */
  readonly focusedDurationId: string;
  /** Returning users only; up to 6 beads. */
  readonly cookPool: readonly PoolCook[];
  readonly activeRecurringPlan: RecurringPlan | null;
  /** Not-live only. */
  readonly liveHubs: readonly LiveHub[];
  readonly waitlist: Waitlist | null;
}

export type HomeVariant = 'default' | 'returning' | 'inactive';
