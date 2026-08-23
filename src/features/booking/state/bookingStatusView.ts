import { resolveStatusView } from '@core/render';
import type { StatusResolution, StatusViewRegistry } from '@core/render';

/**
 * The booking-lifecycle mapping table. (FRONTEND_FOUNDATION_PLAN.md §18)
 *
 * The audit confirms the *screen sequence* structurally:
 *   Confirmation → En route (on-time / late) → Arrived (+ Start OTP) → In service → Completion,
 * with Cancellation branching off.
 *
 * The backend's status enum now exists and is wired below. It is
 *   `created | assigned | cook_en_route | cook_arrived | cooking | completed | cancelled`
 * and this table is the ONLY place those strings appear in the app.
 *
 * ## Two backend statuses share one view, and that is correct
 *
 * `created` and `assigned` both render `confirmation`: from the customer's side the booking is
 * confirmed either way, and whether a cook has been matched yet shows up as the presence of the
 * `cook` block on the payload, not as a different screen.
 *
 * ## What is NOT in this table
 *
 * `reassigned` and `autoCancelled` are VIEWS but not statuses. Reassignment is an event on a
 * booking that is still `assigned` or `cook_en_route`, and auto-cancellation is `cancelled` with
 * cancellation metadata. Resolving them needs the payload, not just the status, so it happens in
 * `viewForBooking` below — deliberately, rather than by inventing two statuses the server does
 * not send.
 *
 * An unrecognised status still resolves to `unknown`, which renders a safe generic state and
 * logs. That remains the correct behaviour for an app whose backend will add states its older
 * versions have never heard of.
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

export const BOOKING_STATUS_VIEWS: StatusViewRegistry<BookingView> = Object.freeze({
  created: 'confirmation',
  assigned: 'confirmation',
  cook_en_route: 'enRoute',
  cook_arrived: 'arrived',
  cooking: 'inService',
  completed: 'completion',
  cancelled: 'cancelled',
});

export function resolveBookingView(
  status: string | null | undefined,
  onUnknown?: (status: string | null) => void,
): StatusResolution<BookingView> {
  return resolveStatusView(BOOKING_STATUS_VIEWS, status, UNKNOWN_BOOKING_VIEW, onUnknown);
}

/**
 * The status `POST /v1/bookings` returns: a booking that EXISTS but that the server has not
 * finished with. It carries `holdExpiresAt`, and a worker releases it if nothing pays.
 *
 * Declared here because this file is the only place the backend's status strings are allowed to
 * appear, and `isAwaitingConfirmation` needs to name one that the view table cannot distinguish —
 * `created` and `assigned` deliberately share the `confirmation` view.
 */
const AWAITING_CONFIRMATION_STATUS = 'created';

/**
 * Is this booking still inside the window `433:2290` exists to cover?
 *
 * Page 21 holds the customer between a verified payment and a booking the SERVER has moved on
 * (V7 founder comment, task §9). "Moved on" is any status other than `created`: assigned, en
 * route, arrived, cooking, completed — and cancelled, because a booking the server refused is
 * also an answer, and one Home is entitled to show.
 *
 * The client asserts nothing by asking this. It reads a field off the payload and reports it;
 * whether the booking is confirmed, and when, is decided entirely upstream (task §30).
 */
export function isAwaitingConfirmation(status: string | null | undefined): boolean {
  return status === AWAITING_CONFIRMATION_STATUS;
}

/**
 * The view for a whole booking payload, not just its status string.
 *
 * Three of the designed screens are not reachable from a status alone, so this reads the fields
 * that actually distinguish them:
 *
 *  - `autoCancelled` (`201:278`) is a `cancelled` booking the SYSTEM cancelled. `cancelledBy` is
 *    the server's word for who did it; the client does not infer it from a missing reason.
 *  - `reassigned` (`201:100` / `209:747`, pages 8c/8d) is an EN ROUTE booking whose assignment
 *    changed. The payload carries that as `reassignment.occurred`; absent it, the booking renders
 *    its ordinary lifecycle screen.
 *
 * ## Reassignment before departure is NOT the `reassigned` view
 *
 * A `created` / `assigned` booking whose cook was replaced is page 8b, `289:6607`
 * "Confirm reassign" — the CONFIRMATION screen plus the `292:201` notice between the banner and
 * the cook card. It is not 8c: nobody is travelling yet, so there is no ETA panel, no
 * "arriving in" banner and no Cancel/Reschedule pair drawn the en-route way.
 *
 * Returning `reassigned` for it (as this used to) sent a confirmed booking to `TrackingBody`,
 * which needs a `reassigned` sub-model the confirmation copy does not carry — so the host fell
 * through to its unknown-view fallback and a reassigned-but-unstarted booking showed
 * "This booking is being updated". The notice belongs on the SUMMARY, which is where the copy
 * for 8b already puts it, and `Home`'s banner machine draws the same distinction
 * (`reassignedConfirmed` → 8b, `reassignedArriving` → 10a/10b).
 *
 * Everything else defers to the status table. Nothing here advances a booking or predicts a
 * transition — it only chooses which designed surface shows the state the server already reported.
 */
export function viewForBooking(input: {
  readonly status: string | null | undefined;
  readonly cancelledBy?: string | null | undefined;
  readonly reassigned?: boolean | undefined;
  readonly onUnknown?: (status: string | null) => void;
}): StatusResolution<BookingView> {
  const base = resolveBookingView(input.status, input.onUnknown);

  if (base.view === 'cancelled' && input.cancelledBy === 'system') {
    return { ...base, view: 'autoCancelled' };
  }
  if (input.reassigned === true && base.view === 'enRoute') {
    return { ...base, view: 'reassigned' };
  }
  return base;
}
