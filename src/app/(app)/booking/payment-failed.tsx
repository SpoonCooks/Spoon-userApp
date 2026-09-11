import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  isAwaitingConfirmation,
  PaymentFailedBody,
  useBookingConfirmation,
  useCancelBooking,
  usePaymentRetry,
} from '@features/booking';
import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import { ErrorBoundary, QueryBoundary } from '@ui';
import { getUserMessage, normalizeError } from '@core/errors';
import { useAndroidBackHandler, useDeterministicBack } from '@core/navigation';

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

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<CancellationStep>('policy');
  const cancellation = useCancellationData(bookingId);
  const cancelBooking = useCancelBooking();

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

  useEffect(() => {
    if (left.current) return;
    if (nothingToWaitFor || unreadable) {
      left.current = true;
      goHome();
      return;
    }
    if (!settled || bookingId === null) return;

    left.current = true;
    router.replace(`/booking/${bookingId}`);
  }, [settled, unreadable, nothingToWaitFor, bookingId, goHome, router]);

  useAndroidBackHandler(() => {
    if (cancelOpen) {
      setCancelOpen(false);
      return true;
    }
    return false;
  });

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
            cancelling={cancelBooking.isPending}
            onCancel={() => {
              setCancelStep('policy');
              setCancelOpen(true);
            }}
          />
        )}
      </QueryBoundary>

      {cancelOpen && bookingId !== null ? (
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
              onConfirmCancel={(reasonId, detail) => {
                if (cancelBooking.isPending || bookingId === null) return;
                const id = bookingId;

                cancelBooking
                  .mutateAsync({
                    bookingId: id,
                    reasonCode: reasonId,
                    ...(detail.trim() === '' ? {} : { reasonDetail: detail.trim() }),
                    scope: `booking.cancel:${id}`,
                  })
                  .then(() => {
                    setCancelStep('confirmed');
                  })
                  .catch(() => {
                    // Surfaced by `cancelErrorMessage`. The sheet stays on the refund step so
                    // the customer can retry against the same idempotency scope.
                  });
              }}
              onBookAgain={() => {
                // PRODUCT_DESIGN_CONFLICT (§37), same answer `[id].tsx` gives: a cancellation
                // flow creates no booking. Either choice leaves this hold behind, so both close
                // the sheet and hand off to the real host, which now shows the cancelled state.
                if (bookingId === null) return;
                left.current = true;
                setCancelOpen(false);
                router.replace(`/booking/${bookingId}`);
              }}
            />
          )}
        </QueryBoundary>
      ) : null}
    </ErrorBoundary>
  );
}
