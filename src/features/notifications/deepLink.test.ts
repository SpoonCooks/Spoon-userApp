import { KNOWN_EVENT_TYPES, isKnownEventType, routeForNotification } from './deepLink';

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
    expect(routeForNotification({ bookingId: 'b-123', eventType: 'booking.cook_en_route' })).toBe(
      '/booking/b-123',
    );
  });

  it('routes every event type the backend emits today to that booking', () => {
    for (const eventType of KNOWN_EVENT_TYPES) {
      expect(routeForNotification({ bookingId: 'b-1', eventType })).toBe('/booking/b-1');
    }
  });

  it('still opens the booking for an event type this build has never heard of', () => {
    // A newer backend emitting `booking.delayed` must not produce a dead tap. The customer
    // tapped a notification about a booking; the booking screen reads its real state.
    expect(routeForNotification({ bookingId: 'b-9', eventType: 'booking.some_future_event' })).toBe(
      '/booking/b-9',
    );
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
    expect(routeForNotification({ bookingId: { id: 'b-1' } })).toBe('/home');
    expect(routeForNotification({ bookingId: 123 })).toBe('/home');
  });
});

describe('isKnownEventType', () => {
  it('recognises the backend’s catalogue and nothing else', () => {
    expect(isKnownEventType('booking.cook_arrived')).toBe(true);
    expect(isKnownEventType('booking.invented_by_a_test')).toBe(false);
    expect(isKnownEventType(undefined)).toBe(false);
  });
});
