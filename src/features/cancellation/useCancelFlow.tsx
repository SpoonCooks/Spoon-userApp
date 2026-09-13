import { useState } from 'react';
import type { ReactNode } from 'react';

import { useCancelBooking } from '@features/booking';
import { getUserMessage, normalizeError } from '@core/errors';
import { useAndroidBackHandler } from '@core/navigation';
import { QueryBoundary } from '@ui';

import { CancelBookingSheet } from './components/CancelBookingSheet';
import type { CancellationStep } from './components/CancelBookingSheet';
import { useCancellationData } from './data';

/**
 * The cancel-sheet flow — state, data, and the mutation — shared by every host that offers
 * "Cancel booking" (`app/(app)/booking/[id].tsx` and the Payment Failed screen today).
 *
 * Extracted because the sheet is, in its own words, "the most legally consequential surface in
 * the app": a fee schedule, a refund figure and a mutation that cannot be retried casually. Two
 * hand-written copies of that wiring are two chances for a future fix (a new required field, a
 * changed error path) to land in one and not the other.
 *
 * What stays with the CALLER, because it differs per host: where "Reschedule instead" and Help
 * go, and what happens once the customer has answered the sheet's own "book again?" prompt —
 * home for a live booking (`[id].tsx`), the real lifecycle host for a hold that never got paid
 * (Payment Failed).
 */
export interface CancelFlowOptions {
  readonly onReschedule?: () => void;
  readonly onHelp?: () => void;
  /** Called once the confirmed step's prompt is answered, either way — see the class comment. */
  readonly onCancelled: () => void;
}

export interface CancelFlow {
  readonly isOpen: boolean;
  /** Opens the sheet on its first step, same as every existing "Cancel booking" control. */
  readonly open: () => void;
  readonly close: () => void;
  /** Render this once, alongside the host's other overlays. Renders nothing while closed. */
  readonly sheet: ReactNode;
}

/**
 * `bookingId` is nullable, matching `useCancellationData`'s own contract: a host whose id has not
 * resolved yet (or, for `[id].tsx`, an empty route param) passes `null` so the preview and
 * reschedule reads stay disabled rather than firing against a malformed path. `open`/`sheet` are
 * still safe to call before that — the cancel button they back is never drawn without an id.
 */
export function useCancelFlow(bookingId: string | null, options: CancelFlowOptions): CancelFlow {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<CancellationStep>('policy');
  // Fetched only once the sheet is actually open: every host that offers "Cancel booking" would
  // otherwise fire the catalogue, preview and reschedule reads on its OWN mount, whether or not
  // the customer ever presses the control — on Payment Failed, that is every payment failure.
  const cancellation = useCancellationData(isOpen ? bookingId : null);
  const cancelBooking = useCancelBooking();

  /**
   * The sheet is a native modal and takes Android back itself in the general case, but a
   * `QueryBoundary` still loading renders no modal at all — this closes that one gap. Owned here,
   * not by each host, for the same reason the rest of this hook is: one behavior, one place.
   */
  useAndroidBackHandler(() => {
    if (!isOpen) return false;
    setIsOpen(false);
    return true;
  });

  return {
    isOpen,
    open: () => {
      setStep('policy');
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
    sheet: !isOpen ? null : (
      <QueryBoundary state={cancellation.state} onRetry={cancellation.refetch}>
        {(model) => (
          <CancelBookingSheet
            visible
            cancellation={model}
            step={step}
            onStepChange={setStep}
            onClose={() => setIsOpen(false)}
            cancelling={cancelBooking.isPending}
            cancelErrorMessage={
              cancelBooking.error === null
                ? null
                : getUserMessage(normalizeError(cancelBooking.error))
            }
            {...(options.onReschedule === undefined
              ? {}
              : {
                  onReschedule: () => {
                    // The customer is leaving the sheet for a different flow, same as
                    // `onBookAgain` below — closed here so a return trip (device back from
                    // `/reschedule/:id`) does not find this sheet still open behind it.
                    setIsOpen(false);
                    options.onReschedule?.();
                  },
                })}
            {...(options.onHelp === undefined ? {} : { onHelp: options.onHelp })}
            onConfirmCancel={(reasonId, detail) => {
              if (cancelBooking.isPending || bookingId === null) return;

              cancelBooking
                .mutateAsync({
                  bookingId,
                  reasonCode: reasonId,
                  ...(detail.trim() === '' ? {} : { reasonDetail: detail.trim() }),
                  scope: `booking.cancel:${bookingId}`,
                })
                .then(() => {
                  setStep('confirmed');
                })
                .catch(() => {
                  // Surfaced by `cancelErrorMessage`. The sheet stays on the refund step so the
                  // customer can retry against the same idempotency scope.
                });
            }}
            onBookAgain={() => {
              // PRODUCT_DESIGN_CONFLICT (§37): a cancellation flow must not create a booking, so
              // both answers to "book again?" do the same thing — recorded, not obeyed. Neither
              // caller today distinguishes the two either.
              setIsOpen(false);
              options.onCancelled();
            }}
          />
        )}
      </QueryBoundary>
    ),
  };
}
