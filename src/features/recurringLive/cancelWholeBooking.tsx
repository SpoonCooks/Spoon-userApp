import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import { idempotency } from '@core/api';
import { getUserMessage, isAppError } from '@core/errors';
import { formatPaise } from '@core/format';
import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import {
  useCancelRecurringBooking,
  useRecurringBookingCancellationQuote,
} from '@features/recurringSetup';
import type { BookingCancellationDto } from '@features/recurringSetup';

/**
 * Cancel the whole Recurring booking (spec: "Cancel the whole Recurring booking"). Reached from
 * Manage plans' trash and from Payment details' "Manage".
 *
 * The server's quote first — how many visits cancel free, and the fee and refund for any already
 * debited — then a confirm, then the app's cancellation reason sheet (a reason is required), then
 * `POST …/cancel`. Every visit not yet started is cancelled and Autopay is stopped by the server.
 *
 * `enabled` gates the quote read, so a screen that never offers the action never asks for it.
 */
export function useCancelWholeBooking({
  bookingId,
  enabled,
  onCancelled,
  onViewRefunds,
}: {
  readonly bookingId: string | null;
  readonly enabled: boolean;
  readonly onCancelled: (result: BookingCancellationDto) => void;
  /** "View refunds" on the result, when the cancellation refunded anything (DEC-090). */
  readonly onViewRefunds?: () => void;
}): { readonly askToCancel: () => void; readonly sheet: ReactNode } {
  const quote = useRecurringBookingCancellationQuote(enabled ? bookingId : null);
  const quoteData = quote.state.status === 'ready' ? quote.state.data : null;
  const reasons = useCancellationData(null);
  const cancelBooking = useCancelRecurringBooking();
  const [step, setStep] = useState<CancellationStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancellation = useMemo(() => {
    if (reasons.state.status !== 'ready') return null;
    return {
      ...reasons.state.data,
      refundRows:
        quoteData === null
          ? []
          : [
              {
                label: 'Cancellation Processing Fee',
                value: formatPaise(quoteData.totals.feePaise),
              },
              {
                label: 'Refund Amount',
                value: formatPaise(quoteData.totals.refundPaise),
                emphasis: 'total' as const,
              },
            ],
      refundPending: quoteData === null,
      rescheduleAllowed: false,
    };
  }, [reasons.state, quoteData]);

  const askToCancel = () => {
    if (quoteData === null) {
      Alert.alert('One moment', 'We’re still checking what cancelling would cost.');
      return;
    }
    if (!quoteData.cancellable) {
      Alert.alert('Can’t cancel right now', 'This booking can’t be cancelled at the moment.');
      return;
    }
    const fee = quoteData.totals.feePaise;
    Alert.alert(
      'Cancel this booking?',
      fee === 0
        ? 'Every visit still to come will be cancelled and Autopay stopped. There’s no cancellation fee.'
        : `Every visit still to come will be cancelled and Autopay stopped. The cancellation fee is ${formatPaise(fee)}.`,
      [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel booking', style: 'destructive', onPress: () => setStep('reason') },
      ],
    );
  };

  const confirmCancel = (reasonCode: string, reasonDetail: string) => {
    if (bookingId === null) return;
    setError(null);
    const scope = `recurring.booking.cancel:${bookingId}`;
    cancelBooking.mutate(
      {
        id: bookingId,
        reason: reasonDetail.trim() === '' ? { reasonCode } : { reasonCode, reasonDetail },
        scope,
      },
      {
        onSuccess: (result) => {
          setStep(null);
          onCancelled(result);
          if (result.totals.refundPaise > 0 && onViewRefunds !== undefined) {
            Alert.alert('Booking cancelled', cancelledSummary(result), [
              { text: 'OK' },
              { text: 'View refunds', onPress: onViewRefunds },
            ]);
          } else {
            Alert.alert('Booking cancelled', cancelledSummary(result));
          }
        },
        onError: (failure) => {
          idempotency.release(scope);
          setError(
            isAppError(failure) ? getUserMessage(failure) : 'The booking could not be cancelled.',
          );
        },
      },
    );
  };

  const sheet =
    cancellation === null ? null : (
      <CancelBookingSheet
        visible={step !== null}
        cancellation={cancellation}
        step={step ?? 'reason'}
        // Back from the reason step closes: the policy step is the one-time booking's table.
        onStepChange={(next) => setStep(next === 'policy' ? null : next)}
        onClose={() => setStep(null)}
        onConfirmCancel={confirmCancel}
        onBookAgain={() => setStep(null)}
        cancelling={cancelBooking.isPending}
        cancelErrorMessage={error}
      />
    );

  return { askToCancel, sheet };
}

/**
 * The result in the handoff's words (Part 1 A1): "1 visit cancelled with a fee, ₹x refunded". The
 * figures are the server's `totals`; nothing is summed here. "View refunds" opens the tracker list.
 */
export function cancelledSummary(result: BookingCancellationDto): string {
  const visits =
    result.visitsCancelled === 1
      ? '1 visit cancelled'
      : `${result.visitsCancelled} visits cancelled`;
  const { feePaise, refundPaise } = result.totals;
  const withFee = feePaise > 0 ? ' with a fee' : '';
  const refunded = refundPaise > 0 ? `, ${formatPaise(refundPaise)} refunded` : '';
  return `${visits}${withFee}${refunded}.`;
}
