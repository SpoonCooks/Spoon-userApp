import { useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { idempotency } from '@core/api';
import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { getUserMessage, isAppError } from '@core/errors';
import { formatPaise } from '@core/format';
import { useSafeBack } from '@core/navigation';
import { ratingScopeFor, useBookingDetail, useRateBooking } from '@features/booking';
import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import {
  cookProfileFrom,
  useAddCookToPool,
  useCookPoolList,
  useCookPoolProfile,
} from '@features/cookPool';
import {
  ModifyBookingSheet,
  PaymentDetailsSheet,
  RateVisitCard,
  TellUsMoreSheet,
  VisitDetailsScreen,
  rateVisitInfo,
  useCancelWholeBooking,
  ratingRequestFor,
  todayInKolkata,
  visitDetailsFrom,
  visitWhatsAppLink,
} from '@features/recurringLive';
import type { RateVisitSubmission, VisitDetailsModel, VisitPrepKey } from '@features/recurringLive';
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
 *   Payment       the price, GST and Autopay mandate; "Manage" cancels the whole booking
 *   Cook          a completed visit offers adding its cook to the Pool (while not in it) and a
 *                 tip, which opens the visit's booking on the V0 tip sheet
 *   Rebook        a past visit's "Book again" starts a new Recurring plan; one whose debit failed
 *                 also books a one-time visit for the same day and length
 *   Help, Share   WhatsApp with Spoon (`1434:2205`), when the backend gives the link
 *   Cook Pool     the pool landing; the next-visit row that visit's own details
 *   Rate          a completed visit's own booking, while the server still allows it
 *                 (`allowedActions.canRate`): stars, 5+ and a written note go to
 *                 `PUT /v1/bookings/:id/rating`; the card's chips ride in the note
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
  // `Note · Help deep link`: one tap to WhatsApp, prefilled. `wa.me` is a universal link, so it
  // opens WhatsApp where it is installed and the same page in the browser where it is not.
  const whatsApp = (purpose: 'help' | 'recipe') => {
    const link = detail === null ? null : visitWhatsAppLink(detail, purpose);
    return link === null
      ? undefined
      : () => {
          Linking.openURL(link).catch(() =>
            Alert.alert('Couldn’t open WhatsApp', 'Please try again in a moment.'),
          );
        };
  };
  const openHelp = whatsApp('help');
  const openRecipe = whatsApp('recipe');

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

  // ─── Rating ────────────────────────────────────────────────────────────────────────────────
  const completedBookingId =
    detail !== null && detail.displayState === 'completed'
      ? (detail.payment?.bookingId ?? detail.bookingId)
      : null;
  const ratedBooking = useBookingDetail(completedBookingId);
  const canRate =
    ratedBooking.state.status === 'ready' && ratedBooking.state.data.allowedActions.canRate;
  const rateInfo = detail === null ? null : rateVisitInfo(detail);
  const rate = useRateBooking();
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [rateHidden, setRateHidden] = useState(false);

  const submitRating = (submission: RateVisitSubmission) => {
    if (completedBookingId === null) return;
    const request = ratingRequestFor(submission, note);
    const scope = ratingScopeFor(completedBookingId, request.feedback);
    rate.mutate(
      { bookingId: completedBookingId, ...request, scope },
      {
        onSuccess: () => {
          setRateHidden(true);
          Alert.alert('Thanks for rating', 'It helps us send you the right cooks.');
        },
        onError: (error) => {
          idempotency.release(scope);
          Alert.alert(
            'Couldn’t send your rating',
            isAppError(error) ? getUserMessage(error) : 'Please try again.',
          );
        },
      },
    );
  };
  const ratingSlot =
    canRate && rateInfo !== null && !rateHidden ? (
      <RateVisitCard
        live
        visit={rateInfo}
        submitting={rate.isPending}
        noteAdded={note !== ''}
        onTellUsMore={() => setNoteOpen(true)}
        onLater={() => setRateHidden(true)}
        onSubmit={submitRating}
      />
    ) : undefined;

  // ─── A completed visit's cook: add to Pool, tip (spec, "Rating") ─────────────────────────────
  const addToPool = useAddCookToPool();
  const cookInPool =
    cookId !== null && profile.state.status === 'ready' ? profile.state.data.inPool : null;
  const canTip =
    ratedBooking.state.status === 'ready' && ratedBooking.state.data.allowedActions.canTip;
  const offerAddToPool =
    detail?.displayState === 'completed' && cookId !== null && cookInPool === false;
  const addCookToPool = () => {
    if (cookId === null) return;
    addToPool.mutate(
      { cookId },
      {
        onSuccess: () => {
          profile.refetch();
          Alert.alert('Added to your Cook Pool', 'They can now cook your Recurring visits.');
        },
        onError: (error) =>
          Alert.alert(
            'Couldn’t add to your Cook Pool',
            isAppError(error) ? getUserMessage(error) : 'Please try again.',
          ),
      },
    );
  };

  // ─── Payment details → Manage: cancel the whole booking (spec, "Per-visit payment record") ───
  const bookingActive = booking.state.status === 'ready' && booking.state.data.status === 'active';
  const wholeBooking = useCancelWholeBooking({
    bookingId: bookingId ?? null,
    // Not tied to the sheet being open: Manage closes it, and the quote must still be there.
    enabled: bookingActive,
    onCancelled: () => {
      visit.refetch();
      booking.refetch();
    },
  });

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
            onHelp={openHelp}
            onShareRecipe={openRecipe}
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
            onBookAgain={() => router.push('/recurring-setup/days')}
            {...(offerAddToPool ? { onAddCookToPool: addCookToPool } : {})}
            addingCookToPool={addToPool.isPending}
            {...(canTip && completedBookingId !== null
              ? {
                  onTipCook: () =>
                    router.push({
                      pathname: '/booking/[id]',
                      params: { id: completedBookingId, tip: '1' },
                    }),
                }
              : {})}
            onBookOneTime={() =>
              detail === null
                ? undefined
                : router.push({
                    pathname: '/scheduled',
                    params: { date: detail.date, durationId: `dur-${detail.durationMinutes}` },
                  })
            }
            ratingSlot={ratingSlot}
          />
          <TellUsMoreSheet
            visible={noteOpen}
            writtenOnly
            initialText={note}
            onClose={() => setNoteOpen(false)}
            onSend={({ text }) => {
              setNote(text.trim());
              setNoteOpen(false);
            }}
          />
          <PaymentDetailsSheet
            visible={paymentOpen}
            data={model.paymentSheet}
            onClose={() => setPaymentOpen(false)}
            {...(bookingActive
              ? {
                  onManageAutopay: () => {
                    setPaymentOpen(false);
                    wholeBooking.askToCancel();
                  },
                }
              : {})}
          />
          {wholeBooking.sheet}
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
              {...(openHelp === undefined ? {} : { onHelp: openHelp })}
              cancelling={cancelVisit.isPending}
              cancelErrorMessage={cancelError}
            />
          )}
        </>
      )}
    </QueryBoundary>
  );
}
