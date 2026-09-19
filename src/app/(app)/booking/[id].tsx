import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import {
  BookingDetailScreen,
  tipAmountPaiseFrom,
  useCallCook,
  useExtensionCheckout,
  usePaymentRetry,
  payRetryingOnceWhileProcessing,
  ratingScopeFor,
  useRateBooking,
  useTipCheckout,
} from '@features/booking';
import type { PaymentOutcome } from '@features/booking';
import { useCancelFlow } from '@features/cancellation';
import { paymentErrorMessage } from '@features/payment';
import { useWhatsAppHelp } from '@features/support';
import { ErrorBoundary, isNumericRating } from '@ui';
import { createIdempotencyKey } from '@core/api';
import { useDeterministicBack } from '@core/navigation';

/**
 * Booking lifecycle host - Confirmation (`3:1041`), En route (`3:1381` / `99:1413`), Arrived
 * (`3:1658`), In service (`101:1812`) and Completion (`143:207`) are VIEWS of this one route.
 *
 * Wrapped in its own error boundary: an unexpected server state must degrade, not white-screen.
 *
 * Help (`39:5331`) is CLOSED. Blocker B-10 recorded that the design named no destination; the
 * founder's comment on the final file does — every WhatsApp control reaches Spoon on 8792997836.
 * `useWhatsAppHelp` owns the link so no screen builds a `wa.me` URL of its own (task §15).
 *
 * Call Cook (`94:936`) is REAL: offered only where `allowedActions.canCallCook` says it may be,
 * and pressing it reads the number from `GET /v1/bookings/:id/cook-contact` at that moment and
 * hands it to the device dialer. The number is never a prop, never cached.
 *
 * Cancel is REAL, and blocker B-11 is closed. It recorded that no live-booking frame drew a
 * Cancel control; the current file does — `3:1041` draws the Reschedule/Cancel pair under the
 * summary and `292:241` draws it on the en-route and reassigned frames. The four-step sheet was
 * already built and already read live data; all it lacked was this entry point and a booking id.
 * `allowedActions.canCancel` decides whether it is offered, and the SERVER decides the fee and
 * the refund — this route sends the reason and refetches.
 */
/**
 * What to tell the customer when the press opened no checkout.
 *
 * `cancelled` returns null on purpose: they closed the sheet themselves, and reporting that back
 * at them is noise.
 */
function payNoticeFor(outcome: PaymentOutcome): string | null {
  if (outcome === 'cancelled') return null;
  if (outcome === 'processing') {
    return 'Still confirming your last payment. Try again in a moment.';
  }
  if (outcome === 'failed') return 'That payment did not go through. You can try again.';
  return 'Could not open checkout. Check your connection and try again.';
}

export default function BookingRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = id ?? '';

  const callCook = useCallCook(bookingId === '' ? null : bookingId);
  const openHelp = useWhatsAppHelp();

  const rate = useRateBooking();
  const tip = useTipCheckout();
  /**
   * "Book now" on an unpaid hold — see `onPayNow` below.
   *
   * The SAME hook the Payment Failed screen retries with, for the same reason: the booking already
   * exists and `usePayForBooking`'s idempotency scope is keyed by booking id alone, so this reopens
   * the order that was already created instead of making a second one (and instead of a second
   * BOOKING, which the server's own overlap constraint would refuse anyway — the customer would
   * be told they clash with themselves).
   */
  const payHold = usePaymentRetry(bookingId);
  /**
   * What the last Book now press did, when it opened no checkout.
   *
   * Only `verified` used to be acted on, so every other outcome ended in silence — including
   * `processing`, which is the ordinary answer while a slow payment attempt is still unresolved.
   * The customer pressed a button, watched a spinner stop, and was told nothing.
   */
  const [payNotice, setPayNotice] = useState<string | null>(null);
  /**
   * The delayed retry is in flight.
   *
   * Kept separate from `payHold.retrying`, which is false while we are merely waiting. Without it
   * the bar would go idle mid-recovery and invite a press that starts the whole thing again.
   */
  const [awaitingPayRetry, setAwaitingPayRetry] = useState(false);
  /** Stops a pending retry from touching state after the screen has gone. */
  const payAbandoned = useRef(false);
  useEffect(() => {
    payAbandoned.current = false;
    return () => {
      payAbandoned.current = true;
    };
  }, []);
  const extend = useExtensionCheckout();
  const cancelFlow = useCancelFlow(bookingId === '' ? null : bookingId, {
    onReschedule: () => router.push(`/reschedule/${bookingId}`),
    onHelp: () => openHelp('Hi Spoon, I need help cancelling my booking.'),
    // PRODUCT_DESIGN_CONFLICT (§37): `115:2703` labels this "Book Now", but a cancellation flow
    // must not create a booking. It closes and returns the customer to Home, where booking
    // actually starts. Recorded, not obeyed.
    onCancelled: () => router.replace('/home'),
  });

  /**
   * HOME, always — and now DETERMINISTICALLY so (V7 founder comment, task §11: "all these back
   * buttons take the user to the home page").
   *
   * This one route renders every service-lifecycle screen — `3:1041` Confirm, `289:6607` Confirm
   * reassign, `201:278` Auto cancelled, `3:1381` / `292:469` Arriving, `201:100` / `292:657`
   * Reassigned, `3:1658` Arrived, `101:1812` / `292:1197` In service, `299:1424` Completion — and
   * it is entered from a Home banner, from history, from a reschedule and from a PUSH
   * NOTIFICATION that launched the app straight into it.
   *
   * `useSafeBack` popped, and popping is wrong here in a way that is specific to a live booking:
   * the state advances underneath the customer. A booking that was "Arriving" when they opened it
   * can be "In service" by the time they press back, and popping would show them a stack entry
   * describing a state the booking has already left. Home reads the CURRENT state and draws the
   * banner for it, so it is both the founder's answer and the only one that cannot be stale.
   */
  const goBack = useDeterministicBack('/home');

  return (
    <ErrorBoundary scope="booking-host">
      <BookingDetailScreen
        bookingId={bookingId}
        onBack={goBack}
        onReschedule={() => router.push(`/reschedule/${bookingId}`)}
        onHelp={() => {
          openHelp('Hi Spoon, I need help with my booking.');
        }}
        onCallCook={() => {
          void callCook.call();
        }}
        callCookError={callCook.errorMessage}
        onDismissCallCookError={callCook.clearError}
        onCancel={cancelFlow.open}
        /**
         * The unpaid hold's only action (`status: created`, drawn by `ConfirmationBody` as a single
         * "Book now" bar under the amber "Payment pending!" banner).
         *
         * `verified` hands over to `/booking/confirming`, which polls until the SERVER's status
         * leaves `created` and then returns here — the client never redraws this screen as
         * confirmed off the back of a checkout callback (ruling R-1). Every other outcome leaves
         * the customer on this screen, which already says the payment is pending and offers the
         * bar again: a dismissal is a choice, `processing` is safe to retry against the same
         * order, and a failure is what the banner is already reporting.
         */
        onPayNow={() => {
          if (bookingId === '') return;
          setPayNotice(null);
          setAwaitingPayRetry(true);
          void payRetryingOnceWhileProcessing(payHold.retry)
            .then((outcome) => {
              // The screen may be gone: a customer who leaves mid-retry gets no state written
              // under them, and no navigation they did not ask for.
              if (payAbandoned.current) return;
              if (outcome === 'verified') {
                router.replace(`/booking/confirming?id=${bookingId}`);
                return;
              }
              setPayNotice(payNoticeFor(outcome));
            })
            .finally(() => {
              if (!payAbandoned.current) setAwaitingPayRetry(false);
            });
        }}
        paying={payHold.retrying || awaitingPayRetry}
        payNotice={payNotice}
        /**
         * `275:4265` — "Extend" (task §15, the extension step of the service flow).
         *
         * `POST /v1/bookings/:id/extensions` with the MINUTES the catalogue published. The new end
         * time, the price and whether the extension was allowed at all are the server's; this
         * refetches and the In-service view re-renders from the answer. Nothing here adds minutes
         * to a clock.
         */
        onExtendBooking={(minutes) =>
          extend.mutateAsync({
            bookingId,
            minutes,
            // Scoped to the booking AND the size of the extension, so a retry after an ambiguous
            // failure replays the same intent instead of extending twice.
            scope: `booking.extend:${bookingId}:${minutes}`,
          })
        }
        extending={extend.isPending}
        extendError={paymentErrorMessage(extend.error)}
        /**
         * `201:93` / `201:96` — the auto-cancelled rebook prompt.
         *
         * PRODUCT_DESIGN_CONFLICT (§37), settled the same way `115:2703` already was: a cancelled
         * booking cannot rebook itself, and this flow has no authority to create one. "Yes" returns
         * to HOME, where booking actually starts, and "No" leaves the screen. Both are real
         * destinations — neither invents a booking — and neither answer is left inert.
         */
        onRebook={() => router.replace('/home')}
        onDeclineRebook={goBack}
        /* `383:748` — the same Spoon line as every other WhatsApp control (task §15). */
        onShareRecipe={() => {
          openHelp("Hi Spoon, I'd like to share a recipe or a special request for my booking.");
        }}
        /**
         * `306:2885` — the tip sheet's CTA (task §14).
         *
         * The amount is the catalogue's, decoded from the option id the sheet reports, and it is
         * sent to `POST /v1/bookings/:id/tips` — no figure is computed here (ruling R-1).
         *
         * The CHECKOUT half is closed and no longer a gap. `useTipCook` runs the same proven
         * pipeline booking payment does — order, open Razorpay against the `keyId` the order
         * carries, verify against the TIP-scoped `POST /v1/bookings/:id/tips/verify`, then
         * refetch. Whether the tip took is the server's answer, never the SDK callback's.
         */
        onSelectTip={(tipId) => {
          const amountPaise = tipAmountPaiseFrom(tipId);
          // An id that carries no amount is not a tip. Rejected rather than sent as zero.
          if (amountPaise === null) return Promise.reject(new Error('Unknown tip option'));

          /**
           * A FRESH scope per checkout attempt, so each press is its own intent.
           *
           * It was `booking.tip:<bookingId>` -- one key for the life of the booking, released
           * only on a fully verified tip. Two failures came out of that. A customer who dismissed
           * checkout and then chose a different amount sent the same key with a different body,
           * which the backend answers 409 forever ("hash mismatch"), so the amount could never be
           * changed until the app was force-quit. And a key surviving an attempt that succeeded
           * server-side but never reached verify would REPLAY that completed order, reopening a
           * checkout Razorpay had already captured.
           *
           * Not per-amount, which was the obvious fix and the wrong one: tips are not capped per
           * booking, so tipping ₹50 twice would replay the first ₹50 order. The key identifies an
           * ATTEMPT, never a value. `useTipCook` releases it on every outcome.
           *
           * A stale `payment_pending` tip does NOT block a new attempt. Nothing server-side
           * sweeps that row and the detail payload carries no `providerOrderId` or `keyId`, so it
           * can neither expire nor be resumed -- blocking would strand the customer permanently
           * on a dead row. The abandoned Razorpay session cannot be paid, so the risk it leaves
           * is a dead row, not a stranded payment.
           */
          return tip.mutateAsync({
            bookingId,
            amountPaise,
            scope: `booking.tip.${bookingId}.${createIdempotencyKey()}`,
          });
        }}
        tipping={tip.isPending}
        tipError={paymentErrorMessage(tip.error)}
        /**
         * `143:292` -> `319:3191`. Submit sends the rating AND the words in one call, because
         * `299:1424` draws one Submit for both, and then the booking is refetched: the thank-you
         * state renders because the SERVER now says `canRate: false`, never because this callback
         * fired.
         */
        onSubmitFeedback={(feedback, rating) => {
          if (rate.isPending || rating === null) return;

          /*
           * `5+` is RECORDED, not collapsed.
           *
           * It used to be sent as a bare `stars: 5` with a structured warning, because the
           * contract had no way to say which of the two top chips was pressed and two different
           * customers were indistinguishable in the database. It has one now: `exceptional` is a
           * field of its own, valid only alongside `stars: 5`, and it changes no payout — the
           * five-plus EARNINGS bonus is still exactly `stars === 5`.
           *
           * So the pair is sent together and the warning is gone. Nothing is lost and nothing is
           * inferred: the numeric chips send the number, and `5+` sends 5 AND the flag.
           */
          const exceptional = !isNumericRating(rating);

          /*
           * RETURNED, so Completion can draw its acknowledgement only once the server has the
           * words -- a press alone used to be enough, which thanked customers for feedback a
           * failed request never delivered. The rejection is handled there; the mutation still
           * owns the normalized error.
           */
          const words = feedback.trim();

          return rate.mutateAsync({
            bookingId,
            stars: exceptional ? 5 : rating,
            ...(exceptional ? { exceptional: true } : {}),
            ...(words === '' ? {} : { feedback: words }),
            /* Writing is a different intent from rating — see `ratingScopeFor`. */
            scope: ratingScopeFor(bookingId, words),
          });
        }}
      />

      {cancelFlow.sheet}
    </ErrorBoundary>
  );
}
