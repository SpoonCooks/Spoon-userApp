/**
 * Notification -> route (§46).
 *
 * ## The contract this reads
 *
 * The backend attaches `data: { bookingId, eventType }` and NOTHING else — deliberately, so that
 * a push carries no state the app might trust. Every event Phase 6/7 emits is about one booking,
 * so every one of them opens that booking, and the screen then reads the authoritative state
 * from the API. The notification is a prompt to look, never a statement of what happened.
 *
 * ## Why a closed list, and why an unknown event still routes
 *
 * The event types below are the ones the backend's own template map emits. They are listed so
 * the mapping is auditable, not because the destination differs — it does not, today, and
 * writing per-event destinations that are all the same would invent a distinction the product
 * does not have.
 *
 * An UNRECOGNISED event type is not a crash and not a dead tap: a future release may emit one
 * this build has never heard of, and the customer still tapped a notification about a booking.
 * So a payload with a booking id opens that booking whatever the event was called, and a payload
 * without one opens Home. That is the safe fallback §46 asks for.
 */

/** The event types the backend emits today. Kept for auditing; see the note above. */
export const KNOWN_EVENT_TYPES = [
  'booking.cook_en_route',
  'booking.cook_arrived',
  'service.started',
  'booking.completed',
  'eta.revised',
  'booking.reassigned',
  // The apology, added to the backend's map after this list was written and missing from it
  // since. Routing never depended on the list, so nothing broke -- which is exactly why an
  // audit list that has quietly stopped matching the backend is worth correcting.
  'booking.cancelled',
] as const;

export type KnownEventType = (typeof KNOWN_EVENT_TYPES)[number];

const BOOKING_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBookingId(value: unknown): value is string {
  return typeof value === 'string' && BOOKING_ID.test(value);
}

export function isKnownEventType(value: unknown): value is KnownEventType {
  return typeof value === 'string' && (KNOWN_EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * The in-app path a notification should open.
 *
 * Returns a route string, never navigates. Keeping it pure is what lets the whole mapping be
 * tested without a router, and it is the part most likely to meet a payload nobody anticipated.
 */
export function routeForNotification(data: unknown): string {
  if (typeof data !== 'object' || data === null) return '/home';

  const bookingId = (data as Record<string, unknown>)['bookingId'];

  // A booking id is the only thing that can target a screen. Anything else — a malformed
  // payload, a campaign message, an event from a newer backend — lands on Home rather than on a
  // route built from an unvalidated string.
  //
  // Checked against the SHAPE of a booking id, not merely for a non-empty string. Every booking
  // Spoon issues is a uuid, and the looser test let `'../../admin'` through as
  // `/booking/../../admin` — a route assembled out of a payload, which the note above says this
  // function never does. The backend is the only thing that can send a push today, so this is a
  // guard on the contract rather than a live hole.
  if (!isBookingId(bookingId)) return '/home';

  return `/booking/${bookingId}`;
}
