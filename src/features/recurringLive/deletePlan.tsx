import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import { idempotency } from '@core/api';
import { getUserMessage, isAppError } from '@core/errors';
import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import {
  useCancelRecurringPlan,
  useRecurringPlanCancellationQuote,
} from '@features/recurringSetup';
import type { PlanCancellationDto, PlanCancellationQuoteDto } from '@features/recurringSetup';

/**
 * Delete a Plan from a live Recurring booking (DEC-092), from Manage plans' trash. The Plan's days
 * that have not been charged yet are cancelled free; a day already charged (its Autopay taken 3
 * hours before its first visit), started or done stays, and the other Plans carry on. Deleting the
 * last Plan closes the booking, as the server decides. Cancelling the whole booking stays under
 * Payment details → Manage.
 *
 * The server's quote first (which days go and which stay), then a confirm, then the app's
 * cancellation reason sheet (a reason is required), then `POST …/plans/:planNumber/cancel`.
 *
 * `planNumber` is the Plan on screen, null while Manage plans is not showing.
 */
export function useDeletePlan({
  bookingId,
  planNumber,
  onDeleted,
}: {
  readonly bookingId: string | null;
  readonly planNumber: number | null;
  readonly onDeleted: (result: PlanCancellationDto) => void;
}): { readonly askToDelete: () => void; readonly sheet: ReactNode } {
  const quote = useRecurringPlanCancellationQuote(bookingId, planNumber);
  const quoteData = quote.state.status === 'ready' ? quote.state.data : null;
  const reasons = useCancellationData(null);
  const cancelPlan = useCancelRecurringPlan();
  const [step, setStep] = useState<CancellationStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancellation = useMemo(() => {
    if (reasons.state.status !== 'ready') return null;
    // Nothing deleted here was charged, so there is no fee or refund to show.
    return {
      ...reasons.state.data,
      refundRows: [],
      refundPending: false,
      rescheduleAllowed: false,
    };
  }, [reasons.state]);

  const askToDelete = () => {
    if (planNumber === null) return;
    if (quoteData === null) {
      Alert.alert('One moment', 'We’re still checking which days of this plan can be deleted.');
      return;
    }
    if (!quoteData.cancellable) {
      Alert.alert(
        'Nothing left to delete',
        'Every day of this plan has already been paid for or has happened.',
      );
      return;
    }
    Alert.alert(`Delete Plan ${planNumber}?`, deleteMessage(quoteData), [
      { text: 'Keep plan', style: 'cancel' },
      { text: 'Delete plan', style: 'destructive', onPress: () => setStep('reason') },
    ]);
  };

  const confirmDelete = (reasonCode: string, reasonDetail: string) => {
    if (bookingId === null || planNumber === null) return;
    setError(null);
    const scope = `recurring.plan.cancel:${bookingId}:${String(planNumber)}`;
    cancelPlan.mutate(
      {
        id: bookingId,
        planNumber,
        reason: reasonDetail.trim() === '' ? { reasonCode } : { reasonCode, reasonDetail },
        scope,
      },
      {
        onSuccess: (result) => {
          setStep(null);
          onDeleted(result);
          Alert.alert(`Plan ${result.planNumber} deleted`, deletedSummary(result));
        },
        onError: (failure) => {
          idempotency.release(scope);
          setError(
            isAppError(failure) ? getUserMessage(failure) : 'The plan could not be deleted.',
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
        onConfirmCancel={confirmDelete}
        onBookAgain={() => setStep(null)}
        cancelling={cancelPlan.isPending}
        cancelErrorMessage={error}
      />
    );

  return { askToDelete, sheet };
}

const days = (n: number) => (n === 1 ? '1 day' : `${n} days`);

/** What the confirm says: the days that go, free, and the paid days that stay. */
export function deleteMessage(quote: PlanCancellationQuoteDto): string {
  const going = `${days(quote.cancelDates.length)} still to come will be cancelled. Nothing is charged for them.`;
  if (quote.keptDates.length === 0) return going;
  const kept = quote.keptDates.length;
  return `${going} ${days(kept)} already paid for or done ${kept === 1 ? 'stays' : 'stay'} as booked.`;
}

/** The result: how many days went, and that the rest of the booking carries on. */
export function deletedSummary(result: PlanCancellationDto): string {
  const going = `${days(result.cancelDates.length)} cancelled, nothing charged.`;
  return result.booking.status === 'active' || result.booking.status === 'pending_mandate'
    ? `${going} The rest of your Recurring booking continues.`
    : `${going} That was your last plan, so this Recurring booking is closed and Autopay is stopped.`;
}
