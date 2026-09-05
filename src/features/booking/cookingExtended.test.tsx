import { bookingDetailFrom } from './adapters';
import { demoInServiceBooking } from '@/demo/fixtures/booking';
import type { BookingDetailDto } from './api';

/**
 * `292:1197` "Page 12b — Cooking extended".
 *
 * The screen was structurally unreachable. `InServiceBody` renders `extendedNotice`, and NOTHING
 * populated it, because `GET /v1/bookings/:id` carried no extension field at all. The client was
 * right not to invent one: the only local signal is a moved `expectedEnd`, which also moves when a
 * service merely starts late — so inferring it would have apologised for an extension nobody
 * bought. The gap was on the backend, and the detail now publishes the confirmed extension.
 *
 * Both directions are asserted, because the failure mode runs both ways: a booking that WAS
 * extended must say so, and one that was not must not inherit the designed copy's notice — the
 * same trap `omitReassignNotice` exists to close.
 */

const IN_SERVICE = {
  id: 'b1',
  status: 'cooking',
  slotType: 'scheduled',
  scheduledStart: '2026-09-01T13:00:00.000Z',
  durationMinutes: 90,
  price: { totalPaise: 7245, serviceAmountPaise: 6900, taxAmountPaise: 345, currency: 'INR' },
  holdExpiresAt: null,
  address: {
    label: 'Home',
    flat: 'E102',
    tower: null,
    society: 'Purva Skydale',
    street: 'Silver County Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560102',
  },
  mealNotes: null,
  referenceUrl: null,
  mealBrief: null,
  cook: { id: 'c1', name: 'Cook Sanchita', phone: null, rating: null, photoUrl: null },
  timing: {
    arrivedAt: '2026-09-01T12:58:00.000Z',
    actualStart: '2026-09-01T13:02:00.000Z',
    expectedEnd: '2026-09-01T14:50:00.000Z',
    actualEnd: null,
  },
  reassignment: { occurred: false, sequence: 0, reassignedAt: null },
  cancellation: null,
  allowedActions: {},
} as unknown as BookingDetailDto;

function inServiceFor(extension: BookingDetailDto['extension']) {
  const view = bookingDetailFrom({
    base: demoInServiceBooking(Date.parse('2026-09-01T13:02:00.000Z')),
    dto: { ...IN_SERVICE, extension } as BookingDetailDto,
  });
  return view.inService;
}

describe('the cooking-extended notice', () => {
  it('reports the extension the server confirmed', () => {
    const inService = inServiceFor({ minutes: 20, confirmedAt: '2026-09-01T13:40:00.000Z' });

    expect(inService?.extendedNotice).toEqual({
      title: 'Booking extended!',
      body: 'End time extended by 20 mins',
    });
  });

  it('says nothing when the booking was never extended', () => {
    // The key is DROPPED, not set to undefined — a designed screen's own copy must not survive
    // onto a booking that was never extended.
    const inService = inServiceFor(null);

    expect(inService?.extendedNotice).toBeUndefined();
    expect(Object.hasOwn(inService ?? {}, 'extendedNotice')).toBe(false);
  });

  it('says nothing when an older deployment sends no field', () => {
    expect(inServiceFor(undefined)?.extendedNotice).toBeUndefined();
  });

  it('takes the end time from the server, never from the extension minutes', () => {
    // `expectedEnd` is the authority for when the session ends; `minutes` only says what changed.
    // Deriving one from the other is how the two drift apart.
    const inService = inServiceFor({ minutes: 20, confirmedAt: null });
    expect(inService?.endsAtMs).toBe(Date.parse('2026-09-01T14:50:00.000Z'));
  });
});
