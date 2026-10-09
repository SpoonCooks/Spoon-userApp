import type { AddressDto } from '@features/address';
import type { InstantAvailabilityDto } from '@features/availability';
import { durationIdFor, strikePaiseFor } from '@features/booking';
import type { BookingSummaryDto } from '@features/booking';
import { priceForSlot, type Catalogue } from '@features/catalogue';
import type { CookPoolListDto } from '@features/cookPool';
import type { RecurringEligibilityDto } from '@features/recurringSetup';

import type { DurationOption, HomeModel, LiveHub, PoolCook, DurationTilePrice } from './types';

/**
 * Real responses → `HomeModel`. Pure, so every rule below is testable without a network.
 *
 * What is wired today, and from where:
 *   serviceability     the current address's `serviceability.status` (GET /v1/me/addresses)
 *   address            label; building · flat; pincode (same row)
 *   hasCompletedBooking  any `completed` row in GET /v1/me/bookings
 *   instant / ETA      GET /v1/availability/instant, one read per catalogue duration
 *   durations          GET /v1/catalogue — price, GST-inclusive total; MRP is the shared ₹5/min
 *                      anchor (`strikePaiseFor`), as the old Home drew it
 *   tax                catalogue `taxRateBps`
 *   cookPool           GET /v1/me/cooks, newest first — every pooled cook, paused ones included
 *                      (the pool's count is what unlocks Recurring, available or not)
 *   activeRecurringPlan / recurringChip
 *                      GET /v1/recurring/eligibility `liveBookings` and `chip`
 *
 * TODO(backend-contract) — not available yet, so deliberately empty:
 *   mostBooked (no flag), serves (no field), waitlist count/threshold (no endpoint).
 */

function poolCookOf(row: CookPoolListDto['cooks'][number]): PoolCook {
  return {
    id: row.cook.cookId,
    name: row.cook.displayName,
    photo: row.cook.profileImageUrl === null ? null : { uri: row.cook.profileImageUrl },
  };
}

/** The dev note: map pins are static — HSR Layout and Haralur are the live hubs. */
export const STATIC_LIVE_HUBS: readonly LiveHub[] = [
  { id: 'hsr', name: 'HSR Layout' },
  { id: 'haralur', name: 'Haralur' },
];

/** The tile the carousel opens centred on, when the catalogue offers it. */
const FOCUS_MINUTES = 45;

/** "30 mins", "1 hr", "1.5 hrs", "2 hrs" — the redesign's own tile copy (`1555:10724`). */
export function homeDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${hours === 1 ? 'hr' : 'hrs'}`;
}

/**
 * `1625:11069` — the header's second line, "Building_name · Flat/House #": the most specific
 * building part present, then the flat. `null` when the address carries neither.
 */
export function addressDetailOf(address: AddressDto): string | null {
  const building = [address.society, address.tower, address.street]
    .map((part) => part?.trim() ?? '')
    .find((part) => part.length > 0);
  const flat = address.flat?.trim() ?? '';
  const parts = [building ?? '', flat].filter((part) => part.length > 0);
  return parts.length === 0 ? null : parts.join(' · ');
}

/** One instant read per duration; `undefined` while it is still loading or it failed. */
export type InstantReads = ReadonlyMap<number, InstantAvailabilityDto | undefined>;

export interface HomeSources {
  readonly address: AddressDto;
  readonly catalogue: Catalogue | undefined;
  readonly catalogueStatus: 'ready' | 'loading' | 'error';
  readonly instant: InstantReads;
  readonly history: readonly BookingSummaryDto[] | undefined;
  /** Joined in this session (there is no read of waitlist membership yet). */
  readonly waitlistJoined: boolean;
  /** `undefined` while loading or failed — Home then shows no beads. */
  readonly pool?: CookPoolListDto | undefined;
  /** `undefined` while loading or failed — the chip then counts the pool itself. */
  readonly recurring?: RecurringEligibilityDto | undefined;
}

/** The carousel's tiles, from the catalogue and whatever instant reads have landed. */
function durationsFrom(catalogue: Catalogue | undefined, instant: InstantReads): DurationOption[] {
  return (catalogue?.durations ?? [])
    .slice()
    .sort((a, b) => a.durationMinutes - b.durationMinutes)
    .map((d): DurationOption => {
      const tile = (slotType: 'instant' | 'scheduled'): DurationTilePrice => {
        const price = priceForSlot(d, slotType);
        return {
          pricePaise: price.serviceAmountPaise,
          mrpPaise: strikePaiseFor({
            durationMinutes: d.durationMinutes,
            serviceAmountPaise: price.serviceAmountPaise,
          }),
          payablePaise: price.totalAmountPaise,
        };
      };
      const scheduled = tile('scheduled');
      return {
        id: durationIdFor(d.durationMinutes),
        minutes: d.durationMinutes,
        label: homeDurationLabel(d.durationMinutes),
        // The Scheduled price by default; the screen swaps in `bySlotType.instant` for "Book Now".
        ...scheduled,
        bySlotType: { instant: tile('instant'), scheduled },
        available: {
          // Unknown (still loading, or the read failed) is treated as bookable: the booking
          // itself is the authoritative refusal, and greying every tile on a slow read is worse.
          now: instant.get(d.durationMinutes)?.available ?? true,
          // Slot capacity is per date; the slot picker answers it. No per-duration roll-up exists.
          later: true,
        },
      };
    });
}

function focusIdOf(durations: readonly DurationOption[]): string {
  const focus =
    durations.find((d) => d.minutes === FOCUS_MINUTES) ??
    durations[Math.floor(durations.length / 2)];
  return focus?.id ?? '';
}

export function homeModelFrom(sources: HomeSources): HomeModel {
  const { address, catalogue } = sources;
  const durations = durationsFrom(catalogue, sources.instant);

  // Instant is "available" when any duration can go now; the ETA is the shortest such one's.
  const instantNow = durations
    .map((d) => sources.instant.get(d.minutes))
    .filter((read): read is InstantAvailabilityDto => read?.available === true);
  const first = instantNow[0];
  const instantKnown = durations.some((d) => sources.instant.get(d.minutes) !== undefined);

  const live = address.serviceability.status !== 'outside_service_area';
  // An active booking first; one still waiting on Autopay is live too (it holds its cooks).
  const liveBookings = sources.recurring?.liveBookings ?? [];
  const liveBooking = liveBookings.find((b) => b.status === 'active') ?? liveBookings[0];

  return {
    serviceability: live ? 'live' : 'not_live',
    address: {
      label: address.label,
      detail: addressDetailOf(address),
      pincode: address.pincode,
    },
    user: {
      hasCompletedBooking: (sources.history ?? []).some((b) => b.status === 'completed'),
    },
    instant: {
      available: first !== undefined || !instantKnown,
      etaMins:
        first === undefined
          ? null
          : (first.projectedArrival?.etaMinutes ?? first.arrivalTargetMinutes),
    },
    durations,
    pricingStatus: sources.catalogueStatus,
    tax: { gstPercent: (catalogue?.taxRateBps ?? 0) / 100 },
    focusedDurationId: focusIdOf(durations),
    cookPool: (sources.pool?.cooks ?? []).map(poolCookOf),
    activeRecurringPlan: liveBooking === undefined ? null : { id: liveBooking.recurringBookingId },
    ...(sources.recurring === undefined ? {} : { recurringChip: sources.recurring.chip }),
    liveHubs: live ? [] : STATIC_LIVE_HUBS,
    waitlist: live
      ? null
      : { countForPincode: null, launchThreshold: null, joined: sources.waitlistJoined },
  };
}

/**
 * The header a guest sees: there is no account, so no saved address. Tapping it asks them to
 * sign in, like every other action on guest Home.
 */
export const GUEST_ADDRESS: HomeModel['address'] = {
  label: 'Add address',
  detail: 'Set your delivery location',
  pincode: '',
};

/**
 * Home for a GUEST — a customer who skipped Login (iOS only, required by App Store review).
 *
 * Built from the catalogue alone, which `GET /v1/catalogue` serves without a token: the real
 * durations and prices. Everything else is per-account and absent — no address, so no
 * serviceability (treated as live: the guest has not said where they are yet) and no instant
 * reads (unknown, which the carousel treats as bookable; the booking is the real refusal). No
 * history, pool or plan, so the variant is always `default`.
 */
export function guestHomeModelFrom(sources: {
  readonly catalogue: Catalogue | undefined;
  readonly catalogueStatus: 'ready' | 'loading' | 'error';
}): HomeModel {
  const durations = durationsFrom(sources.catalogue, new Map());
  return {
    serviceability: 'live',
    address: GUEST_ADDRESS,
    user: { hasCompletedBooking: false },
    instant: { available: true, etaMins: null },
    durations,
    pricingStatus: sources.catalogueStatus,
    tax: { gstPercent: (sources.catalogue?.taxRateBps ?? 0) / 100 },
    focusedDurationId: focusIdOf(durations),
    cookPool: [],
    activeRecurringPlan: null,
    liveHubs: [],
    waitlist: null,
  };
}
