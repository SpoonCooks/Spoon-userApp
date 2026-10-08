import type { AddressDto } from '@features/address';
import type { InstantAvailabilityDto } from '@features/availability';
import type { BookingSummaryDto } from '@features/booking';
import type { Catalogue } from '@features/catalogue';
import type { CookPoolListDto } from '@features/cookPool';
import type { RecurringEligibilityDto } from '@features/recurringSetup';

import {
  addressDetailOf,
  GUEST_ADDRESS,
  guestHomeModelFrom,
  homeDurationLabel,
  homeModelFrom,
} from './adapters';
import type { HomeSources } from './adapters';

const address = (status: AddressDto['serviceability']['status']) =>
  ({
    id: 'addr-1',
    label: 'Home',
    society: 'Prestige Lakeside',
    tower: null,
    street: '27th Main',
    pincode: '560102',
    isDefault: true,
    serviceability: { status },
  }) as unknown as AddressDto;

const catalogue = {
  taxRateBps: 500,
  durations: [90, 30, 60].map((m) => ({
    durationMinutes: m,
    serviceAmountPaise: 6900,
    taxAmountPaise: 345,
    totalAmountPaise: 7245,
    latestStartLocalMinute: 1200,
  })),
} as unknown as Catalogue;

const instant = (available: boolean, eta?: number) =>
  ({
    available,
    arrivalTargetMinutes: 30,
    ...(eta === undefined ? {} : { projectedArrival: { etaMinutes: eta } }),
  }) as unknown as InstantAvailabilityDto;

function sources(overrides: Partial<HomeSources> = {}): HomeSources {
  return {
    address: address('serviceable'),
    catalogue,
    catalogueStatus: 'ready',
    instant: new Map([
      [30, instant(true, 4)],
      [60, instant(true, 6)],
      [90, instant(false)],
    ]),
    history: [],
    waitlistJoined: false,
    ...overrides,
  };
}

describe('homeModelFrom', () => {
  it('maps the catalogue into sorted tiles with server prices and the shared strike anchor', () => {
    const model = homeModelFrom(sources());
    expect(model.durations.map((d) => [d.id, d.label, d.pricePaise, d.payablePaise])).toEqual([
      ['dur-30', '30 mins', 6900, 7245],
      ['dur-60', '1 hr', 6900, 7245],
      ['dur-90', '1.5 hrs', 6900, 7245],
    ]);
    // ₹5/min anchor: 60 min → ₹300 struck over ₹69.
    expect(model.durations[1]?.mrpPaise).toBe(30000);
    expect(model.focusedDurationId).toBe('dur-60');
    expect(model.tax.gstPercent).toBe(5);
  });

  it('marks per-duration instant availability and takes the ETA from the shortest bookable one', () => {
    const model = homeModelFrom(sources());
    expect(model.durations.map((d) => d.available.now)).toEqual([true, true, false]);
    expect(model.instant).toEqual({ available: true, etaMins: 4 });
  });

  it('reports instant unavailable when no duration can go now', () => {
    const model = homeModelFrom(
      sources({
        instant: new Map([
          [30, instant(false)],
          [60, instant(false)],
          [90, instant(false)],
        ]),
      }),
    );
    expect(model.instant).toEqual({ available: false, etaMins: null });
  });

  it('treats unknown instant reads as bookable rather than greying everything', () => {
    const model = homeModelFrom(sources({ instant: new Map() }));
    expect(model.durations.every((d) => d.available.now)).toBe(true);
    expect(model.instant.available).toBe(true);
  });

  it('is not live for an address outside the service area, with static hubs and no meter', () => {
    const model = homeModelFrom(sources({ address: address('outside_service_area') }));
    expect(model.serviceability).toBe('not_live');
    expect(model.liveHubs.map((h) => h.name)).toEqual(['HSR Layout', 'Haralur']);
    expect(model.waitlist).toEqual({ countForPincode: null, launchThreshold: null, joined: false });
  });

  it('keeps a temporarily paused hub live (instant availability then says what is possible)', () => {
    expect(
      homeModelFrom(sources({ address: address('temporarily_unavailable') })).serviceability,
    ).toBe('live');
  });

  it('is returning once any booking completed', () => {
    const history = [
      { status: 'cancelled' },
      { status: 'completed' },
    ] as unknown as BookingSummaryDto[];
    expect(homeModelFrom(sources({ history })).user.hasCompletedBooking).toBe(true);
    expect(homeModelFrom(sources({ history: undefined })).user.hasCompletedBooking).toBe(false);
  });

  it('passes pricing failures through for the carousel to show', () => {
    expect(
      homeModelFrom(sources({ catalogue: undefined, catalogueStatus: 'error' })),
    ).toMatchObject({
      pricingStatus: 'error',
      durations: [],
    });
  });

  it('builds the pool block from the Cook Pool and Recurring eligibility', () => {
    const card = (cookId: string, profileImageUrl: string | null) => ({
      cook: { cookId, displayName: `Cook ${cookId}`, profileImageUrl },
      available: true,
      addedAt: '2026-10-01T00:00:00.000Z',
    });
    const pool = {
      cooks: [card('a', 'https://img/a.jpg'), card('b', null)],
      count: 2,
    } as unknown as CookPoolListDto;
    const recurring = {
      chip: 'live',
      liveBookings: [
        { recurringBookingId: 'rb-pending', status: 'pending_mandate' },
        { recurringBookingId: 'rb-active', status: 'active' },
      ],
    } as unknown as RecurringEligibilityDto;

    const model = homeModelFrom(sources({ pool, recurring }));

    expect(model.cookPool).toEqual([
      { id: 'a', name: 'Cook a', photo: { uri: 'https://img/a.jpg' } },
      { id: 'b', name: 'Cook b', photo: null },
    ]);
    expect(model.activeRecurringPlan).toEqual({ id: 'rb-active' });
    expect(model.recurringChip).toBe('live');
  });

  it('shows no pool and leaves the chip to the pool count while those reads are pending', () => {
    const model = homeModelFrom(sources());
    expect(model.cookPool).toEqual([]);
    expect(model.activeRecurringPlan).toBeNull();
    expect(model.recurringChip).toBeUndefined();
  });
});

describe('labels', () => {
  it('writes durations the way the redesign frames do', () => {
    expect([30, 45, 60, 90, 120, 150].map(homeDurationLabel)).toEqual([
      '30 mins',
      '45 mins',
      '1 hr',
      '1.5 hrs',
      '2 hrs',
      '2.5 hrs',
    ]);
  });

  it('writes the second header line as building · flat, and nothing when neither is known', () => {
    const base = address('serviceable');
    expect(addressDetailOf(base)).toBe('Prestige Lakeside');
    expect(addressDetailOf({ ...base, flat: 'A-1203' } as AddressDto)).toBe(
      'Prestige Lakeside · A-1203',
    );
    expect(
      addressDetailOf({ ...base, society: null, street: '  ', flat: null } as AddressDto),
    ).toBeNull();
  });
});

describe('guestHomeModelFrom', () => {
  it('shows the real catalogue prices with nothing per-account', () => {
    const model = guestHomeModelFrom({ catalogue, catalogueStatus: 'ready' });

    expect(model.durations.length).toBe(catalogue.durations.length);
    expect(model.durations.every((d) => d.available.now && d.available.later)).toBe(true);
    expect(model.serviceability).toBe('live');
    expect(model.address).toEqual(GUEST_ADDRESS);
    expect(model.user.hasCompletedBooking).toBe(false);
    expect(model.cookPool).toEqual([]);
    expect(model.activeRecurringPlan).toBeNull();
    expect(model.waitlist).toBeNull();
    expect(model.focusedDurationId).not.toBe('');
  });

  it('carries the catalogue read state to the carousel', () => {
    expect(
      guestHomeModelFrom({ catalogue: undefined, catalogueStatus: 'loading' }).pricingStatus,
    ).toBe('loading');
    expect(
      guestHomeModelFrom({ catalogue: undefined, catalogueStatus: 'error' }).durations,
    ).toEqual([]);
  });
});
