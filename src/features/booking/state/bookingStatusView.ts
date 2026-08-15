import { resolveStatusView } from '@core/render';
import type { StatusResolution, StatusViewRegistry } from '@core/render';

/**
 * The booking-lifecycle mapping table. (FRONTEND_FOUNDATION_PLAN.md §18)
 *
 * The audit confirms the *screen sequence* structurally:
 *   Confirmation → En route (on-time / late) → Arrived (+ Start OTP) → In service → Completion,
 * with Cancellation branching off.
 *
 * It does NOT confirm the backend's status names, and no contract exists — so THE REGISTRY IS
 * DELIBERATELY EMPTY. Every status currently resolves to the `unknown` fallback, which renders a
 * safe generic state and logs. That is the correct behaviour for an app whose backend will add
 * states its older versions have never heard of.
 *
 * TODO(backend-contract): populate `BOOKING_STATUS_VIEWS` the day the status enum lands. This is
 * the single place to update. Do not scatter status strings anywhere else.
 */

/**
 * Client-side view identifiers — screens we know exist from the design, not backend values.
 *
 * `reassigned` (`201:100` / `209:747`) and `autoCancelled` (`201:278`) are listed because the
 * designs exist and are implemented. What CAUSES either transition is backend/business logic and
 * is deliberately absent: no timer, no matching rule and no penalty logic lives in this client
 * (task §7).
 */
export type BookingView =
  | 'confirmation'
  | 'enRoute'
  | 'reassigned'
  | 'arrived'
  | 'inService'
  | 'completion'
  | 'autoCancelled'
  | 'cancelled'
  | 'unknown';

export const UNKNOWN_BOOKING_VIEW: BookingView = 'unknown';

export const BOOKING_STATUS_VIEWS: StatusViewRegistry<BookingView> = Object.freeze({});

export function resolveBookingView(
  status: string | null | undefined,
  onUnknown?: (status: string | null) => void,
): StatusResolution<BookingView> {
  return resolveStatusView(BOOKING_STATUS_VIEWS, status, UNKNOWN_BOOKING_VIEW, onUnknown);
}
