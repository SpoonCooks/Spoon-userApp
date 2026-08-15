import { createKeyFactory } from '@core/query';

/**
 * Feature: cancellation.
 *
 * Confirmed C-4 — a bottom-sheet STACK, not four screens: `6:2` policy → `104:2260` reason →
 * `104:2336` refund details → `115:2703` confirmation, all under one
 * `← Cancel booking + Help` header over a scrim. One sheet, four steps.
 *
 * Boundary — this is the most legally consequential surface in the app:
 *  - the fee schedule (>3 hr ₹0 / 3–1 hr 25% / <1 hr 50%) is rendered as CONTENT; the applicable
 *    fee is whatever the server says. The client never evaluates the tier.
 *  - refund figures are three server-provided values, DISPLAYED. The client never computes
 *    "paid − fee = refund"; a client/server mismatch on a refund figure is a trust incident.
 *  - Ruling R-3: the "Reschedule for free" block renders only when the backend says the booking
 *    is still eligible (`@features/reschedule`).
 *
 * TODO(backend-contract): no cancellation endpoints, fee payloads or reason-code encoding exist.
 */
export const cancellationKeys = createKeyFactory('cancellation');

export { CancelBookingSheet } from './components/CancelBookingSheet';
export type { CancelBookingSheetProps, CancellationStep } from './components/CancelBookingSheet';
export { useCancellationData } from './data';
export type * from './types';
