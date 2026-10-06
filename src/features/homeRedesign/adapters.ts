import type { AddressDto } from '@features/address';
import type { InstantAvailabilityDto } from '@features/availability';
import { durationIdFor, strikePaiseFor } from '@features/booking';
import type { BookingSummaryDto } from '@features/booking';
import type { Catalogue } from '@features/catalogue';

import type { DurationOption, HomeModel, LiveHub } from './types';

/**
 * Real responses → `HomeModel`. Pure, so every rule below is testable without a network.
 *
 * What is wired today, and from where:
 *   serviceability     the current address's `serviceability.status` (GET /v1/me/addresses)
 *   address            label + building, pincode (same row)
 *   hasCompletedBooking  any `completed` row in GET /v1/me/bookings
 *   instant / ETA      GET /v1/availability/instant, one read per catalogue duration
 *   durations          GET /v1/catalogue — price, GST-inclusive total; MRP is the shared ₹5/min
 *                      anchor (`strikePaiseFor`), as the old Home drew it
 *   tax                catalogue `taxRateBps`
 *
 * TODO(backend-contract) — not available yet, so deliberately empty:
 *   mostBooked (no flag), serves (no field), cookPool and activeRecurringPlan (V0
 *   `feat/cook-pool-recurring-plans`, unmerged), waitlist count/threshold (no endpoint).
 */

/** The dev note: map pins are static — HSR Layout and Haralur are the live hubs. */
export const STATIC_LIVE_HUBS: readonly LiveHub[] = [
  { id: 'hsr', name: 'HSR Layout' },
  { id: 'haralur', name: 'Haralur' },
];

/** The tile the carousel opens centred on, when the catalogue offers it. */
const FOCUS_MINUTES = 60;

/** "30 mins", "1 hr", "1.5 hrs", "2 hrs" — the redesign's own tile copy (`1555:10724`). */
export function homeDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${hours === 1 ? 'hr' : 'hrs'}`;
}

/** "Home · Prestige Lakeside" — the label, then the most specific building part present. */
export function addressLabelOf(address: AddressDto): string {
  const building = [address.society, address.tower, address.street]
    .map((part) => part?.trim() ?? '')
    .find((part) => part.length > 0);
  return building === undefined ? address.label : `${address.label} · ${building}`;
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
}

export function homeModelFrom(sources: HomeSources): HomeModel {
  const { address, catalogue } = sources;
  const durations = (catalogue?.durations ?? [])
    .slice()
    .sort((a, b) => a.durationMinutes - b.durationMinutes)
    .map((d): DurationOption => ({
      id: durationIdFor(d.durationMinutes),
      minutes: d.durationMinutes,
      label: homeDurationLabel(d.durationMinutes),
      pricePaise: d.serviceAmountPaise,
      mrpPaise: strikePaiseFor(d),
      payablePaise: d.totalAmountPaise,
      available: {
        // Unknown (still loading, or the read failed) is treated as bookable: the booking
        // itself is the authoritative refusal, and greying every tile on a slow read is worse.
        now: sources.instant.get(d.durationMinutes)?.available ?? true,
        // Slot capacity is per date; the slot picker answers it. No per-duration roll-up exists.
        later: true,
      },
    }));

  const focus =
    durations.find((d) => d.minutes === FOCUS_MINUTES) ??
    durations[Math.floor(durations.length / 2)];

  // Instant is "available" when any duration can go now; the ETA is the shortest such one's.
  const instantNow = durations
    .map((d) => sources.instant.get(d.minutes))
    .filter((read): read is InstantAvailabilityDto => read?.available === true);
  const first = instantNow[0];
  const instantKnown = durations.some((d) => sources.instant.get(d.minutes) !== undefined);

  const live = address.serviceability.status !== 'outside_service_area';

  return {
    serviceability: live ? 'live' : 'not_live',
    address: { label: addressLabelOf(address), pincode: address.pincode },
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
    focusedDurationId: focus?.id ?? '',
    cookPool: [],
    activeRecurringPlan: null,
    liveHubs: live ? [] : STATIC_LIVE_HUBS,
    waitlist: live
      ? null
      : { countForPincode: null, launchThreshold: null, joined: sources.waitlistJoined },
  };
}
