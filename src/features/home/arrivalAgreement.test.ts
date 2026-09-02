import { etaMinutesFor } from './adapters';
import { trackingDetailFrom } from '../booking/adapters';
import { DEMO_BOOKING_EN_ROUTE } from '@/demo/fixtures/booking';
import type { TrackingDto } from '../booking/api';

/**
 * Home and the booking detail must name the same arrival.
 *
 * On 2026-09-02 they did not: the Home banner read "Arriving in 2 mins" while the booking page
 * read "6 mins", for one cook on one booking, seconds apart — and the cook's own app said 2. Each
 * screen did its own arithmetic over the same server ETA, and only the booking page clamped the
 * result to the booking start.
 *
 * The numbers are now derived from one rule in `core/format/arrival`. This suite is what stops a
 * second copy of that arithmetic appearing: it compares the two screens directly rather than
 * checking either against a constant, so any future divergence fails here whatever the values.
 */

const START_ISO = '2026-09-02T07:57:00.000Z';

function detailMinutes(etaIso: string, scheduledStartIso: string | null): number | null {
  const view = trackingDetailFrom({
    base: DEMO_BOOKING_EN_ROUTE,
    dto: {
      bookingId: 'booking-1',
      status: 'cook_en_route',
      eta: { estimatedArrivalAt: etaIso, updatedAt: null },
    } as TrackingDto,
    ...(scheduledStartIso === null ? {} : { scheduledStartIso }),
  }).tracking?.etaLabel;
  if (view === undefined || view === null) return null;
  const match = /^(\d+)\s/.exec(view);
  return match?.[1] === undefined ? 0 : Number(match[1]);
}

describe('Home and the booking page name the same arrival', () => {
  const cases: readonly { readonly name: string; readonly etaIso: string }[] = [
    // The live case: an instant booking whose cook beats the projected start.
    { name: 'cook arriving before the booking starts', etaIso: '2026-09-02T07:53:00.000Z' },
    { name: 'cook arriving exactly at the booking start', etaIso: START_ISO },
    { name: 'cook arriving after the booking start', etaIso: '2026-09-02T08:05:00.000Z' },
  ];

  for (const { name, etaIso } of cases) {
    it(`agrees when the ${name}`, () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-02T07:51:00.000Z'));
      try {
        const home = etaMinutesFor(etaIso, START_ISO, new Date());
        const detail = detailMinutes(etaIso, START_ISO);
        expect(home).toBe(detail);
      } finally {
        jest.useRealTimers();
      }
    });
  }

  it('never promises an arrival before the booking it belongs to', () => {
    // The complaint that started this: "for booking of time 11:30 we are saying at 11:06 that
    // cook will arrive in 2 mins".
    jest.useFakeTimers().setSystemTime(new Date('2026-09-02T07:51:00.000Z'));
    try {
      // Six minutes to the booking, but the cook's own ETA is two.
      expect(etaMinutesFor('2026-09-02T07:53:00.000Z', START_ISO, new Date())).toBe(6);
    } finally {
      jest.useRealTimers();
    }
  });
});
