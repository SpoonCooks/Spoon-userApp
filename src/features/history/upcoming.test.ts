import { isStillUpcoming } from './data';
import type { BookingSummaryDto } from '@features/booking';

/**
 * What the Upcoming tab is still allowed to call upcoming.
 *
 * `GET /v1/me/bookings/active` keeps a finished booking for a server-side backstop counted in
 * days from `actual_end` — correct for an endpoint that also has to keep completed-but-unrated
 * work reachable, wrong for a tab named Upcoming. Observed on staging: two Sep 11 bookings still
 * listed under Upcoming on Sep 12.
 *
 * Nothing is hidden by dropping them: the Past tab reads `GET /v1/me/bookings`, which has carried
 * these same rows all along — the two tabs deliberately overlapped for this set.
 */

/** The reported case: a 2-hour booking at 5:30 PM on Sep 11, cancelled before it started. */
const BASE: BookingSummaryDto = {
  id: 'booking-1',
  status: 'cancelled',
  slotType: 'scheduled',
  scheduledStart: '2026-09-11T12:00:00.000Z',
  durationMinutes: 120,
  price: {
    amountPaise: 27195,
    durationMinutes: 120,
    serviceAmountPaise: 25900,
    taxRateBps: 500,
    taxAmountPaise: 1295,
    totalAmountPaise: 27195,
    currency: 'INR',
    pricingVersion: 'pricing-policy-v0',
  },
};

const booking = (over: Partial<BookingSummaryDto> = {}): BookingSummaryDto => ({
  ...BASE,
  ...over,
});
const at = (iso: string) => new Date(iso);

describe('a finished booking leaves Upcoming when its slot does', () => {
  it('keeps it while the booked slot is still running', () => {
    expect(isStillUpcoming(booking(), at('2026-09-11T11:00:00.000Z'))).toBe(true);
    expect(isStillUpcoming(booking(), at('2026-09-11T13:59:00.000Z'))).toBe(true);
  });

  it('drops it once the slot has ended', () => {
    // 12:00 + 2 hr. The end instant itself counts: the slot is over.
    expect(isStillUpcoming(booking(), at('2026-09-11T14:00:00.000Z'))).toBe(false);
    // The reported case — the next day, still listed as Upcoming.
    expect(isStillUpcoming(booking(), at('2026-09-12T06:00:00.000Z'))).toBe(false);
  });

  it('applies to a completed booking too, not only a cancelled one', () => {
    expect(isStillUpcoming(booking({ status: 'completed' }), at('2026-09-12T06:00:00.000Z'))).toBe(
      false,
    );
  });
});

/**
 * The case this rule must never break. A service can start late or be extended, so a booked
 * window that has elapsed says nothing about whether the cook is still there — only the SERVER's
 * status does, which is why the elapsed window alone is never enough to move a row.
 */
describe('a live booking stays, however old its window looks', () => {
  it.each(['created', 'assigned', 'cook_en_route', 'cook_arrived', 'cooking'] as const)(
    'keeps a %s booking whose booked window has already passed',
    (status) => {
      expect(isStillUpcoming(booking({ status }), at('2026-09-12T06:00:00.000Z'))).toBe(true);
    },
  );

  /** A status this build has never heard of is not grounds for retiring a booking. */
  it('keeps a booking whose status it does not recognise', () => {
    expect(
      isStillUpcoming(
        booking({ status: 'some_new_status' as never }),
        at('2030-01-01T00:00:00.000Z'),
      ),
    ).toBe(true);
  });
});

/** An instant booking carries no `scheduledStart`, so there is no window to have ended. */
describe('a booking with no booked window', () => {
  it('is left alone rather than retired on a timestamp that cannot be read', () => {
    expect(isStillUpcoming(booking({ scheduledStart: null }), at('2030-01-01T00:00:00.000Z'))).toBe(
      true,
    );
  });
});
