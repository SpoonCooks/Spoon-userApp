import { createKeyFactory } from '@core/query';

/**
 * Feature: tracking (pre-service lifecycle rendering).
 *
 * Screens: `3:1041` Confirmation, `3:1381` En route on-time, `99:1413` En route late,
 * `3:1658` Arrived (+ Start OTP).
 *
 * Boundary: on-time vs late is a SERVER verdict rendered as a variant — the client never compares
 * an ETA to the clock to decide lateness. ETA values are displayed, never computed.
 *
 * These are views of the booking-lifecycle host (`@features/booking`), not independent routes.
 *
 * TODO(product B-11): neither En route screen has a Cancel control, so the cancellation flow has
 * no verified entry point from here.
 * TODO(backend-contract): no tracking endpoint, polling cadence or payload exists.
 */
export const trackingKeys = createKeyFactory('tracking');
