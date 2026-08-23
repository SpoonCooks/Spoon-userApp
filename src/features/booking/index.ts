/**
 * Feature: booking (instant + the lifecycle host).
 *
 * Boundary — the backend owns and the client only renders: matching, slot generation,
 * availability, ETA, cook assignment/reassignment, penalties, refunds and every state transition.
 *
 * Ruling R-1 — payment: `Pay →` opens Razorpay checkout DIRECTLY. There is no Spoon payment or
 * payment-review screen. After checkout returns — success, failure or dismissal alike — the app
 * REFETCHES authoritative booking state. It never infers that a payment succeeded and never
 * computes an amount.
 *
 * The lifecycle mapping table lives in `./state/bookingStatusView.ts` and is keyed by the
 * backend's own seven-value status enum.
 */

export {
  BOOKING_STATUS_VIEWS,
  isAwaitingConfirmation,
  resolveBookingView,
  UNKNOWN_BOOKING_VIEW,
} from './state/bookingStatusView';
export type { BookingView } from './state/bookingStatusView';

export { InstantSheet } from './components/InstantSheet';
export type { InstantSheetProps } from './components/InstantSheet';
export { ExtensionSheet } from './components/ExtensionSheet';
export type { ExtensionSheetProps } from './components/ExtensionSheet';
export { BookingDetailsSheet } from './components/BookingDetailsSheet';
export type {
  BookingDetailsSheetProps,
  BookingDetailsViewModel,
} from './components/BookingDetailsSheet';
export {
  durationLabelFor,
  useBookingDetailData,
  useBookingSubmission,
  useExtensionCheckout,
  useExtensionData,
  useInstantData,
  useTipCheckout,
} from './data';
export type { BookingSelection, BookingSubmission } from './data';
export { extensionMinutesFrom, tipAmountPaiseFrom, tipIdFor } from './adapters';
export { BookingDetailScreen, BookingDetailView } from './screens/BookingDetailScreen';
export type { BookingDetailActions, BookingDetailViewProps } from './screens/BookingDetailScreen';
export type * from './types';
export * from './api';
