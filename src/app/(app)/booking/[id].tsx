import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  BookingDetailScreen,
  tipAmountPaiseFrom,
  useCallCook,
  useCancelBooking,
  useExtensionCheckout,
  useRateBooking,
  useTipCheckout,
} from '@features/booking';
import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import { useWhatsAppHelp } from '@features/support';
import { ErrorBoundary, QueryBoundary, isNumericRating } from '@ui';
import { getUserMessage, normalizeError } from '@core/errors';
import { useAndroidBackHandler, useDeterministicBack } from '@core/navigation';

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
export default function BookingRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = id ?? '';

  const callCook = useCallCook(bookingId === '' ? null : bookingId);
  const openHelp = useWhatsAppHelp();

  const rate = useRateBooking();
  const tip = useTipCheckout();
  const extend = useExtensionCheckout();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<CancellationStep>('policy');
  const cancellation = useCancellationData(bookingId === '' ? null : bookingId);
  const cancelBooking = useCancelBooking();

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

  /**
   * The cancellation sheet is a native modal and takes Android back itself. This closes the loop
   * for the ONE state the modal cannot see: a sheet mid-flight whose `QueryBoundary` has not
   * resolved yet renders no modal at all, so back would pop the booking out from under a
   * cancellation the customer believes they opened.
   */
  useAndroidBackHandler(() => {
    if (!cancelOpen) return false;
    setCancelOpen(false);
    return true;
  });

  return (
    <ErrorBoundary scope="booking-host">
      <BookingDetailScreen
        bookingId={bookingId}
        onBack={goBack}
        onReschedule={() => router.push(`/reschedule/${bookingId}`)}
        onHelp={() => {
          /*
           * No booking id in the message.
           *
           * A customer opening WhatsApp is handed a draft they can read, edit and forward, and a
           * UUID in it is noise to them and an identifier to anyone the chat is shared with. Ops
           * can find the booking from the phone number the message arrives on, which they have to
           * verify against anyway before acting on a request.
           */
          openHelp('Hi Spoon, I need help with my booking.');
        }}
        onCallCook={() => {
          void callCook.call();
        }}
        callCookError={callCook.errorMessage}
        onDismissCallCookError={callCook.clearError}
        onCancel={() => {
          setCancelStep('policy');
          setCancelOpen(true);
        }}
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
        /*
         * A refused extension has to say so. The server declines for real reasons — the
         * session is not running, the length is no longer available, the payment did not
         * complete — and without this the sheet just sat there, which reads as a broken
         * button rather than an answer.
         */
        extendError={extend.error === null ? null : getUserMessage(normalizeError(extend.error))}
        onDismissExtendError={() => extend.reset()}
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
        /*
         * `383:748` — the same Spoon line as every other WhatsApp control (task §15).
         *
         * The booking id is deliberately NOT carried (founder instruction, 2026-08-31). It was a
         * raw UUID pasted into the customer's own outgoing message: meaningless to the person
         * typing it, and it made the prefilled text long enough to look broken in the WhatsApp
         * composer. Support identifies the booking from the phone number that is writing to them.
         */
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

          return tip.mutateAsync({ bookingId, amountPaise, scope: `booking.tip:${bookingId}` });
        }}
        tipping={tip.isPending}
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

          rate
            .mutateAsync({
              bookingId,
              stars: exceptional ? 5 : rating,
              ...(exceptional ? { exceptional: true } : {}),
              ...(feedback.trim() === '' ? {} : { feedback: feedback.trim() }),
              scope: `booking.rate:${bookingId}`,
            })
            .catch(() => {
              // Normalized and surfaced by the mutation. The form stays as it is so the customer
              // can retry against the same idempotency scope; nothing claims a rating landed.
            });
        }}
      />

      {cancelOpen ? (
        <QueryBoundary state={cancellation.state} onRetry={cancellation.refetch}>
          {(model) => (
            <CancelBookingSheet
              visible
              cancellation={model}
              step={cancelStep}
              onStepChange={setCancelStep}
              onClose={() => setCancelOpen(false)}
              cancelling={cancelBooking.isPending}
              cancelErrorMessage={
                cancelBooking.error === null
                  ? null
                  : getUserMessage(normalizeError(cancelBooking.error))
              }
              onReschedule={() => {
                setCancelOpen(false);
                router.push(`/reschedule/${bookingId}`);
              }}
              onConfirmCancel={(reasonId, detail) => {
                if (cancelBooking.isPending) return;

                cancelBooking
                  .mutateAsync({
                    bookingId,
                    reasonCode: reasonId,
                    // The sheet already refuses to continue without a detail when the
                    // catalogue's `requiresDetail` says one is needed. Whatever the customer
                    // typed is forwarded — it is their words, and the server stores them.
                    ...(detail.trim() === '' ? {} : { reasonDetail: detail.trim() }),
                    scope: `booking.cancel:${bookingId}`,
                  })
                  .then(() => {
                    // The fee, the refund and the final status are the SERVER's. The mutation
                    // invalidates the booking reads; the confirmation step then renders what
                    // came back rather than what this screen predicted.
                    setCancelStep('confirmed');
                  })
                  .catch(() => {
                    // Already normalized and surfaced by the sheet's own state. Staying on the
                    // reason step lets the customer retry against the same idempotency scope.
                  });
              }}
              onBookAgain={() => {
                // PRODUCT_DESIGN_CONFLICT (§37): `115:2703` labels this "Book Now", but a
                // cancellation flow must not create a booking. It closes and returns the
                // customer to Home, where booking actually starts. Recorded, not obeyed.
                setCancelOpen(false);
                router.replace('/home');
              }}
              onHelp={() => {
                // No booking id — see the note on the help draft above.
                openHelp('Hi Spoon, I need help cancelling my booking.');
              }}
            />
          )}
        </QueryBoundary>
      ) : null}
    </ErrorBoundary>
  );
}
