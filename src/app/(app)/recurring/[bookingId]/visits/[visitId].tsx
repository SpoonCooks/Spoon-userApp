import { useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { idempotency } from '@core/api';
import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { getUserMessage, isAppError } from '@core/errors';
import { formatPaise } from '@core/format';
import { useSafeBack } from '@core/navigation';
import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import { cookProfileFrom, useCookPoolList, useCookPoolProfile } from '@features/cookPool';
import {
  ModifyBookingSheet,
  PaymentDetailsSheet,
  VisitDetailsScreen,
  todayInKolkata,
  visitDetailsFrom,
} from '@features/recurringLive';
import type { VisitDetailsModel, VisitPrepKey } from '@features/recurringLive';
import {
  useCancelRecurringVisit,
  useRecurringBooking,
  useRecurringVisit,
  useRecurringVisitCancellationQuote,
  useUpdateBookingPrep,
} from '@features/recurringSetup';
import { QueryBoundary } from '@ui';

/**
 * Recurring — one visit's "Visit details" (Figma `1005:131`: `1008:5398` assigned, `1466:8275`
 * pending, `1466:8639` completed, `1466:8446` cancelled), on the visit itself.
 *
 *   checklist     saved to the visit's booking as it is ticked (only once it has one)
 *   Modify        the cancellation timeline from the visit's quote; "Cancel this visit" asks for a
 *                 reason with the app's own cancellation sheet (opened at the reason step — its fee
 *                 table is the one-time booking's, not Recurring's) and cancels the visit
 *   Payment       the price, GST and Autopay mandate
 *   Help, Share   WhatsApp with Spoon (`1434:2205`), when the backend gives the link
 *   Cook Pool     the pool landing; the next-visit row that visit's own details
 */
export default function RecurringVisitRoute() {
  const router = useRouter();
  const { bookingId, visitId } = useLocalSearchParams<{ bookingId: string; visitId: string }>();
  const goBack = useSafeBack(`/recurring/${bookingId ?? ''}`);

  const visit = useRecurringVisit(bookingId ?? null, visitId ?? null);
  const booking = useRecurringBooking(bookingId ?? null);
  const pool = useCookPoolList();
  const quote = useRecurringVisitCancellationQuote(bookingId ?? null, visitId ?? null);
  const cookId = visit.state.status === 'ready' ? (visit.state.data.cook?.cookId ?? null) : null;
  const profile = useCookPoolProfile(cookId ?? 'none', { enabled: cookId !== null });

  const state = useMemo<DataState<VisitDetailsModel>>(() => {
    if (visit.state.status !== 'ready') return visit.state;
    const cookProfile =
      cookId !== null && profile.state.status === 'ready' ? profile.state.data : null;
    return ready(
      visitDetailsFrom({
        visit: visit.state.data,
        booking: booking.state.status === 'ready' ? booking.state.data : null,
        cookProfile,
        cookCard: cookProfile === null ? null : cookProfileFrom(cookProfile),
        pool: pool.state.status === 'ready' ? pool.state.data : null,
        quote: quote.state.status === 'ready' ? quote.state.data : null,
        todayId: todayInKolkata(),
      }),
    );
  }, [visit.state, booking.state, pool.state, quote.state, profile.state, cookId]);

  const detail = visit.state.status === 'ready' ? visit.state.data : null;
  const whatsappUrl = detail?.support.whatsappUrl ?? null;
  const openWhatsApp =
    whatsappUrl === null
      ? undefined
      : () => {
          void Linking.openURL(whatsappUrl);
        };

  // ─── Checklist ─────────────────────────────────────────────────────────────────────────────
  const prepBookingId = detail?.payment?.bookingId ?? detail?.bookingId ?? null;
  const updatePrep = useUpdateBookingPrep();
  const savePrep =
    prepBookingId === null
      ? undefined
      : (checked: readonly VisitPrepKey[]) => {
          updatePrep.mutate(
            {
              bookingId: prepBookingId,
              input: {
                entryApproved: checked.includes('entry'),
                groceriesReady: checked.includes('groceries'),
                utensilsReady: checked.includes('utensils'),
              },
            },
            {
              onSuccess: () => visit.refetch(),
              onError: () =>
                Alert.alert('Couldn’t save that', 'Your checklist didn’t save. Please try again.'),
            },
          );
        };

  // ─── Sheets and cancelling ─────────────────────────────────────────────────────────────────
  const [modifyOpen, setModifyOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<CancellationStep | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const reasons = useCancellationData(null);
  const cancelVisit = useCancelRecurringVisit();

  const quoteData = quote.state.status === 'ready' ? quote.state.data : null;
  const cancellation = useMemo(() => {
    if (reasons.state.status !== 'ready') return null;
    return {
      ...reasons.state.data,
      // The visit's own figures; Recurring has no reschedule.
      refundRows:
        quoteData === null
          ? []
          : [
              { label: 'Original Amount Paid', value: formatPaise(quoteData.chargedPaise) },
              { label: 'Cancellation Processing Fee', value: formatPaise(quoteData.feePaise) },
              {
                label: 'Refund Amount',
                value: formatPaise(quoteData.refundPaise),
                emphasis: 'total' as const,
              },
            ],
      refundPending: quoteData === null,
      rescheduleAllowed: false,
    };
  }, [reasons.state, quoteData]);

  const confirmCancel = (reasonCode: string, reasonDetail: string) => {
    if (bookingId === undefined || visitId === undefined) return;
    setCancelError(null);
    const scope = `recurring.visit.cancel:${bookingId}:${visitId}`;
    cancelVisit.mutate(
      {
        id: bookingId,
        visitId,
        reason: reasonDetail.trim() === '' ? { reasonCode } : { reasonCode, reasonDetail },
        scope,
      },
      {
        onSuccess: () => {
          setCancelStep(null);
          visit.refetch();
          booking.refetch();
          Alert.alert('Visit cancelled', 'Your other visits stay as they are.');
        },
        onError: (error) => {
          idempotency.release(scope);
          setCancelError(
            isAppError(error) ? getUserMessage(error) : 'The visit could not be cancelled.',
          );
        },
      },
    );
  };

  const nextVisitId =
    booking.state.status === 'ready' ? (booking.state.data.upNext?.visitId ?? null) : null;

  return (
    <QueryBoundary state={state} onRetry={visit.refetch}>
      {(model) => (
        <>
          <VisitDetailsScreen
            model={model}
            onBack={goBack}
            onPaymentDetails={() => setPaymentOpen(true)}
            {...(model.modifySheet === null ? {} : { onModifyBooking: () => setModifyOpen(true) })}
            onHelp={openWhatsApp}
            onShareRecipe={openWhatsApp}
            onViewCookPool={() => router.push('/cook-pool')}
            {...(nextVisitId === null || nextVisitId === visitId
              ? {}
              : {
                  onNextVisit: () =>
                    router.replace({
                      pathname: '/recurring/[bookingId]/visits/[visitId]',
                      params: { bookingId: bookingId ?? '', visitId: nextVisitId },
                    }),
                })}
            onPrepChange={savePrep}
          />
          <PaymentDetailsSheet
            visible={paymentOpen}
            data={model.paymentSheet}
            onClose={() => setPaymentOpen(false)}
          />
          {model.modifySheet === null ? null : (
            <ModifyBookingSheet
              visible={modifyOpen}
              data={model.modifySheet}
              onClose={() => setModifyOpen(false)}
              onCancelVisit={() => {
                setModifyOpen(false);
                setCancelStep('reason');
              }}
            />
          )}
          {cancellation === null ? null : (
            <CancelBookingSheet
              visible={cancelStep !== null}
              cancellation={cancellation}
              step={cancelStep ?? 'reason'}
              // Back from the reason step closes: the policy step is the one-time booking's table.
              onStepChange={(step) => setCancelStep(step === 'policy' ? null : step)}
              onClose={() => setCancelStep(null)}
              onConfirmCancel={confirmCancel}
              onBookAgain={() => setCancelStep(null)}
              {...(openWhatsApp === undefined ? {} : { onHelp: openWhatsApp })}
              cancelling={cancelVisit.isPending}
              cancelErrorMessage={cancelError}
            />
          )}
        </>
      )}
    </QueryBoundary>
  );
}
