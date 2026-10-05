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
  /**
   * What "Book now" charges for this duration — the price plus GST, as the SERVER totals it.
   * The client never adds tax (see `@core/format/money`).
   */
  readonly payablePaise: number;
  /** Server flag; one tile only. */
  readonly mostBooked?: boolean;
  /**
   * Bookable per mode: Now fails when no cook can arrive and stay that long, Later on slot
   * capacity. An unavailable tile stays in the track but cannot be selected or snapped to.
   */
  readonly available: { readonly now: boolean; readonly later: boolean };
  /** "Serves" — what fits in this duration. Announced to screen readers; not drawn yet. */
  readonly serves?: { readonly dishes: number; readonly people: number };
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
  /** Per-duration pricing: six skeleton tiles while loading; retry (and no CTA) when it fails. */
  readonly pricingStatus?: 'ready' | 'loading' | 'error';
  /** The GST rate the tax dialog states, from config — never a literal in copy. */
  readonly tax: { readonly gstPercent: number };
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
