import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { isAwaitingConfirmation, useBookingConfirmation } from '@features/booking';
import { ConfirmationLoading } from '@features/loading';
import { useAndroidBackHandler, useDeterministicBack } from '@core/navigation';
import { getLogger } from '@core/logging';

/**
 * Page 21 — "Confirmation in progress", Figma `433:2290`.
 *
 * ## What this screen is for
 *
 * Razorpay returning is not a booking. The founder's V7 comment (task §9) is explicit about the
 * gap this covers: after checkout completes the customer STAYS here for the few seconds the
 * backend spends verifying the payment and settling the booking, instead of being thrown at a
 * screen chosen from a client-side callback. Before this existed the app pushed the lifecycle
 * screen the moment `submit()` resolved, which meant the customer could land on a "Confirmed"
 * view built from a booking that was still on hold.
 *
 * ## Who decides when it ends
 *
 * The SERVER, and only the server. `useBookingConfirmation` re-reads `GET /v1/bookings/:id` every
 * two seconds and this screen leaves the moment the booking's status is anything other than
 * `created` — assigned, en route, cancelled, whatever it is. Nothing here advances a booking,
 * predicts an assignment, or treats the elapsed time as evidence (task §9, §30).
 *
 * ## The bound, and why it is not a source of truth
 *
 * Polling can fail to settle: the device drops offline, the deployment is slow, a scheduled
 * booking sits on `created` far longer than an instant one. Holding a spinner forever for any of
 * those is its own defect, so after `MAX_WAIT_MS` this screen goes to HOME anyway.
 *
 * That is a bound on how long a CONTENTLESS screen may be shown, not a verdict. It asserts nothing
 * about the booking: Home renders the same authoritative state through its own banner, so the
 * customer sees exactly what the server says either way, and the difference between timing out and
 * settling is which screen they read it on. The one thing that never happens is the app claiming a
 * booking is confirmed because a timer expired.
 *
 * ## Destination
 *
 * HOME (task §10). Home's dynamic banner is the designed surface for a live booking, so a
 * confirmed booking is shown there rather than on a separate confirmation screen. `replace`, via
 * `useDeterministicBack`, so the stack does not keep Page 21 — or the sheet the customer booked
 * from — behind it.
 */

/**
 * The longest this screen may be shown. See the class comment: a presentation bound, not a
 * verdict.
 *
 * Long enough that an ordinary assignment resolves well inside it, short enough that a customer
 * who has paid is never left looking at a spinner wondering whether the app has hung.
 */
const MAX_WAIT_MS = 45_000;

export default function BookingConfirmingRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof id === 'string' && id !== '' ? id : null;

  const { state } = useBookingConfirmation(bookingId);
  const goHome = useDeterministicBack('/home');

  /**
   * Leaving must happen once. The poll keeps running for a beat after the status changes, and a
   * second `replace` would remount Home under the first one.
   */
  const left = useRef(false);
  const [waitedOut, setWaitedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaitedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  const settled = state.status === 'ready' && !isAwaitingConfirmation(state.data.status);
  /**
   * A read that FAILED is not a reason to hold the customer here. The booking exists — it was
   * created before checkout opened — so the honest move is Home, where the banner will show
   * whatever the next successful read returns.
   */
  const unreadable = state.status === 'error';
  // Nothing to poll: this route was opened without a booking id, which only a bad deep link does.
  const nothingToWaitFor = bookingId === null;

  useEffect(() => {
    if (left.current) return;
    if (!settled && !waitedOut && !unreadable && !nothingToWaitFor) return;

    left.current = true;

    if (!settled) {
      getLogger('booking-confirming').warn('Left Page 21 without a settled booking', {
        feature: 'booking',
        ...(bookingId === null ? {} : { bookingId }),
        reason: nothingToWaitFor ? 'no-booking-id' : unreadable ? 'read-failed' : 'timed-out',
      });
    }

    goHome();
  }, [settled, waitedOut, unreadable, nothingToWaitFor, goHome, bookingId]);

  /**
   * Android back goes HOME rather than being swallowed.
   *
   * Swallowing it would trap the customer on a screen with no controls if the poll never settles,
   * and Home is both the destination this screen was heading for and the surface that shows the
   * booking's real state. Pressing back therefore skips the wait; it does not cancel anything,
   * because there is nothing here to cancel.
   */
  useAndroidBackHandler(() => {
    if (left.current) return false;
    left.current = true;
    goHome();
    return true;
  });

  return <ConfirmationLoading />;
}
