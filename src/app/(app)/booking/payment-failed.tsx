import { useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  isAwaitingConfirmation,
  PaymentFailedBody,
  useBookingConfirmation,
  usePaymentRetry,
} from '@features/booking';
import { useCancelFlow } from '@features/cancellation';
import { ErrorBoundary, QueryBoundary } from '@ui';
import { useDeterministicBack } from '@core/navigation';

/**
 * Payment Failed — the sibling Page 21 (`433:2290`, `confirming.tsx`) never needed until now:
 * checkout came back with nothing to confirm. The booking created by `useBookingSubmission` is
 * still on HOLD (task §9's V7 comment applies here too), so this screen's whole job is to say so
 * and offer the two honest next steps — try the SAME booking again, or give it up.
 *
 * ## Why this polls at all
 *
 * A client-side failure is a message from the SDK on this device; Razorpay's webhook reaches the
 * backend independently of it and can still settle the booking while the customer is reading this
 * screen. `useBookingConfirmation` is the same hook and cache entry Page 21 polls, so the moment
 * the server's status leaves `created` — paid after all, or the hold expired — this screen gets
 * out of the way to `/booking/:id`, which renders whatever that turns out to be. Nothing here
 * asserts the payment failed; it only reports what checkout said and waits to be contradicted.
 *
 * ## Cancel
 *
 * Wired exactly like `[id].tsx`: the reason-picking sheet, not a shortcut. There is no backend
 * endpoint for a bare "abandon this hold", and inventing a reason code the sheet's own catalogue
 * never published would be exactly the kind of client-side invention this app's boundary forbids.
 */
export default function PaymentFailedRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof id === 'string' && id !== '' ? id : null;

  const confirmation = useBookingConfirmation(bookingId);
  const retryPayment = usePaymentRetry(bookingId ?? '');

  const goHome = useDeterministicBack('/home');

  const status = confirmation.state.status === 'ready' ? confirmation.state.data.status : null;
  const settled = status !== null && !isAwaitingConfirmation(status);
  const nothingToWaitFor = bookingId === null;
  /**
   * A read that keeps failing is not a reason to hold the customer on an error screen forever —
   * same call `confirming.tsx` makes. The booking already exists; if the device cannot read it,
   * Home is where the next successful read (the banner's own poll) reports whatever it actually
   * is, including a payment that settled while this screen couldn't confirm it.
   */
  const unreadable = confirmation.state.status === 'error';

  /** Leaving must happen once — see `confirming.tsx`'s identical guard. */
  const left = useRef(false);

  const cancelFlow = useCancelFlow(bookingId, {
    onCancelled: () => {
      if (left.current) return;
      /**
       * HOME, the same answer `[id].tsx` gives after a cancellation, and for a second reason
       * here: `/booking/:id` has no view for a customer-cancelled booking — `cancelled` falls
       * through to the "This booking is being updated" fallback — so sending them there after
       * they had just been told the booking was cancelled contradicted the receipt they had
       * only now read. PRODUCT_DESIGN_CONFLICT (§37) still applies: this flow creates no
       * booking, so both answers to "book again?" land in the same place.
       */
      left.current = true;
      goHome();
    },
  });

  useEffect(() => {
    if (left.current) return;
    /**
     * The cancel sheet owns the screen while it is open, and must be allowed to finish.
     *
     * Confirming a cancellation invalidates the booking read, so the next poll sees `cancelled`
     * and `settled` flips true — which used to navigate immediately, replacing `115:2703` ("Your
     * booking has been cancelled") with another screen after a single frame. The customer saw
     * their receipt blink and vanish. Nothing here needs to race the sheet: `onCancelled` above
     * is what leaves, once they have answered its own prompt.
     */
    if (cancelFlow.isOpen) return;
    if (nothingToWaitFor || unreadable) {
      left.current = true;
      goHome();
      return;
    }
    if (!settled || bookingId === null) return;

    left.current = true;
    router.replace(`/booking/${bookingId}`);
  }, [settled, unreadable, nothingToWaitFor, bookingId, goHome, router, cancelFlow.isOpen]);

  return (
    <ErrorBoundary scope="payment-failed">
      <QueryBoundary state={confirmation.state} onRetry={confirmation.refetch}>
        {(booking) => (
          <PaymentFailedBody
            amountPaise={booking.price.totalAmountPaise}
            retrying={retryPayment.retrying}
            onRetry={() => {
              if (bookingId === null) return;
              void retryPayment.retry().then((outcome) => {
                // Guarded by `left`: the poll above can already have moved the customer on (the
                // hold settled via an earlier attempt's webhook, say) while this retry was still
                // in flight, and a late `verified` here must not yank them back onto Page 21.
                if (outcome === 'verified' && !left.current) {
                  left.current = true;
                  router.replace(`/booking/confirming?id=${bookingId}`);
                }
                // Every other outcome leaves the customer here — a dismissal is a choice, a
                // fresh failure is what this screen already says, and `processing` is safe to
                // retry again against the same order. Nothing here needs its own message.
              });
            }}
            cancelAllowed={booking.allowedActions.canCancel}
            onCancel={cancelFlow.open}
          />
        )}
      </QueryBoundary>

      {cancelFlow.sheet}
    </ErrorBoundary>
  );
}
