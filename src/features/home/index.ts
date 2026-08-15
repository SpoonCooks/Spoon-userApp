import { createKeyFactory } from '@core/query';

/**
 * Feature: home.
 *
 * Ruling R-2 — ONE route with booking-state variants:
 *   `1:455`    (390×2014) = the canonical complete Home
 *   `209:1207` (390×830)  = the SAME Home with `UpcomingBookingCard` (`59:587`) inserted between
 *                           the promo carousel and the booking tiles
 * These are NOT two routes and NOT two designs. Which variant renders is decided by authoritative
 * server state (is there an upcoming booking?), never by a client guess.
 *
 * Ruling R-5 — upcoming/active booking information appears here; there is no separate
 * Upcoming Bookings screen.
 *
 * Everything in the en-route card — ETA, cook name, duration — is dynamic backend data. The
 * client never computes an ETA.
 *
 * TODO(backend-contract): the active-booking query has no endpoint or payload yet.
 * TODO(design D-20): the two variants use different tile copy; one canonical pair is pending.
 */
export const homeKeys = createKeyFactory('home');

export { useHomeData } from './data';
export { UpcomingBookingCard } from './components/UpcomingBookingCard';
export type { UpcomingBookingCardProps } from './components/UpcomingBookingCard';
export { HomeScreen, HomeView } from './screens/HomeScreen';
export type { HomeActions, HomeViewProps } from './screens/HomeScreen';
export type * from './types';
