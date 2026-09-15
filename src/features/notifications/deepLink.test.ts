import { KNOWN_EVENT_TYPES, isKnownEventType, routeForNotification } from './deepLink';

/** Booking ids are uuids everywhere Spoon issues them, and routing now requires that shape. */
const BOOKING = '3f1c2a5e-0000-4000-8000-000000000001';

/**
 * Notification routing (§46).
 *
 * The cases that matter are the hostile ones. A push payload is the least controlled input the
 * app has — it comes from a backend that will ship new event types after this build is frozen,
 * and it lands on a router. So these pin two properties: an unknown payload never crashes, and a
 * route is never built from something that is not a booking id.
 */
describe('routeForNotification', () => {
  it('opens the booking a lifecycle event is about', () => {
    expect(routeForNotification({ bookingId: BOOKING, eventType: 'booking.cook_en_route' })).toBe(
      `/booking/${BOOKING}`,
    );
  });

  it('routes every event type the backend emits today to that booking', () => {
    for (const eventType of KNOWN_EVENT_TYPES) {
      expect(routeForNotification({ bookingId: BOOKING, eventType })).toBe(`/booking/${BOOKING}`);
    }
  });

  it('still opens the booking for an event type this build has never heard of', () => {
    // A newer backend emitting `booking.delayed` must not produce a dead tap. The customer
    // tapped a notification about a booking; the booking screen reads its real state.
    expect(
      routeForNotification({ bookingId: BOOKING, eventType: 'booking.some_future_event' }),
    ).toBe(`/booking/${BOOKING}`);
  });

  it('falls back to Home rather than building a route from a missing booking id', () => {
    expect(routeForNotification({ eventType: 'booking.completed' })).toBe('/home');
    expect(routeForNotification({ bookingId: '' })).toBe('/home');
    expect(routeForNotification({ bookingId: '   ' })).toBe('/home');
  });

  it('survives a payload that is not an object at all', () => {
    expect(routeForNotification(undefined)).toBe('/home');
    expect(routeForNotification(null)).toBe('/home');
    expect(routeForNotification('a string')).toBe('/home');
    expect(routeForNotification(42)).toBe('/home');
  });

  it('refuses a booking id that is not a string, rather than coercing it', () => {
    // `/booking/[object Object]` is the shape of bug this prevents.
    expect(routeForNotification({ bookingId: { id: BOOKING } })).toBe('/home');
    expect(routeForNotification({ bookingId: 123 })).toBe('/home');
  });

  it('never assembles a route out of a booking id that is not one', () => {
    // A non-empty string used to be enough, so this resolved to `/booking/../../admin` — a path
    // built from the payload, which is precisely what this function promises never to do.
    expect(routeForNotification({ bookingId: '../../admin' })).toBe('/home');
    expect(routeForNotification({ bookingId: '../settings' })).toBe('/home');
    expect(routeForNotification({ bookingId: 'b-1' })).toBe('/home');
    expect(routeForNotification({ bookingId: `${BOOKING} ` })).toBe('/home');
  });
});

describe('isKnownEventType', () => {
  it('recognises the backend’s catalogue and nothing else', () => {
    expect(isKnownEventType('booking.cook_arrived')).toBe(true);
    // Added to the backend's map after this list was first written.
    expect(isKnownEventType('booking.cancelled')).toBe(true);
    expect(isKnownEventType('booking.invented_by_a_test')).toBe(false);
    expect(isKnownEventType(undefined)).toBe(false);
  });
});
