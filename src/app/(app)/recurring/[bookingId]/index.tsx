import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { idempotency } from '@core/api';
import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { getUserMessage, isAppError } from '@core/errors';
import { formatPaise } from '@core/format';
import { useSafeBack } from '@core/navigation';
import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import {
  AutopayNotice,
  RecurringLiveScreen,
  RecurringPlansScreen,
  liveCalendarFrom,
  plansSummaryFrom,
  todayInKolkata,
} from '@features/recurringLive';
import type {
  AutopayNoticeKind,
  LiveCalendarModel,
  RecurringTab,
  VisitRef,
} from '@features/recurringLive';
import {
  useApproveRecurringMandate,
  useCancelRecurringBooking,
  useRecurringBooking,
  useRecurringBookingCancellationQuote,
} from '@features/recurringSetup';
import type { VisitSummaryDto } from '@features/recurringSetup';
import { QueryBoundary } from '@ui';

/**
 * Recurring — a live booking's "Live booking" tab, on the booking itself
 * (`GET /v1/me/recurring-bookings/{bookingId}`): the visit calendar, each date's visits, Up next
 * and the done / cancelled / to-go thread. Opened from Home's "Recurring · Live" chip; back
 * returns to whatever opened it (`/home` when nothing did, as on a deep link).
 *
 * Per the page note (`1008:5909`): a visit in a date's pop-up opens its Visit details; today's
 * visit and the Up-next card go to the existing live booking page (`/booking/[id]`) once the visit
 * has a booking — until its charge it has none, and they open Visit details too. The pop-up's
 * "Close" (`1006:542`) only dismisses it; a visit is cancelled from its own "Modify booking".
 *
 * "Manage plans" (`1017:433`) shows the same booking's plans, read-only: each plan's dates and its
 * visits' time, length and past visits (`plansSummaryFrom`). A past visit opens its details. The
 * trash cancels the whole booking — every visit still to come — after the server's quote and the
 * app's cancellation reason sheet. The backend cannot edit a plan yet, so no edit control is drawn.
 *
 * A booking whose visits can't be charged — saved but never approved (`pending_mandate`), or its
 * mandate paused / revoked / expired (`banner`) — carries the Autopay notice on the Live tab, which
 * reopens Razorpay's Autopay checkout for this same booking.
 */
export default function RecurringBookingRoute() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const goBack = useSafeBack('/home');
  const booking = useRecurringBooking(bookingId ?? null);

  const state = useMemo<DataState<LiveCalendarModel>>(
    () =>
      booking.state.status === 'ready'
        ? ready(liveCalendarFrom(booking.state.data, todayInKolkata()))
        : booking.state,
    [booking.state],
  );

  const [tab, setTab] = useState<RecurringTab>('live');
  const plans = useMemo(
    () =>
      booking.state.status === 'ready'
        ? plansSummaryFrom(booking.state.data, todayInKolkata())
        : null,
    [booking.state],
  );

  const data = booking.state.status === 'ready' ? booking.state.data : null;
  const visitsOn = (dateId: string): readonly VisitSummaryDto[] =>
    data?.days.find((day) => day.date === dateId)?.visits ?? [];

  const openDetails = (visitId: string) =>
    router.push({
      pathname: '/recurring/[bookingId]/visits/[visitId]',
      params: { bookingId: bookingId ?? '', visitId },
    });

  /** Today's (or Up next's) visit with a booking: the live booking page. Otherwise its details. */
  const openVisit = (visit: VisitSummaryDto, live: boolean) => {
    if (live && visit.bookingId !== null) {
      router.push({ pathname: '/booking/[id]', params: { id: visit.bookingId } });
      return;
    }
    openDetails(visit.visitId);
  };

  const onOpenVisit = (ref: VisitRef) => {
    const visit = visitsOn(ref.dateId).find((v) => v.visitId === ref.visitId);
    if (visit !== undefined) openVisit(visit, ref.isToday);
  };

  // ─── Autopay ───────────────────────────────────────────────────────────────────────────────
  const autopay = useApproveRecurringMandate();
  const noticeKind: AutopayNoticeKind | null =
    data === null
      ? null
      : data.status === 'pending_mandate'
        ? 'pending'
        : data.banner !== null
          ? data.banner.kind
          : null;
  const approveAutopay = () => {
    if (data === null) return;
    autopay.approve(data).then(
      (outcome) => {
        booking.refetch();
        if (outcome.kind === 'approved') {
          Alert.alert(
            'Autopay approved',
            'Your visits are set. We’ll confirm each cook 3 hours before.',
          );
        }
      },
      (error: unknown) => {
        booking.refetch();
        Alert.alert(
          'Couldn’t approve Autopay',
          isAppError(error) ? getUserMessage(error) : 'Please try again in a moment.',
        );
      },
    );
  };
  const notice =
    noticeKind === null ? null : (
      <AutopayNotice kind={noticeKind} busy={autopay.pending} onApprove={approveAutopay} />
    );

  // ─── Cancelling the whole booking ──────────────────────────────────────────────────────────
  const quote = useRecurringBookingCancellationQuote(tab === 'plans' ? (bookingId ?? null) : null);
  const quoteData = quote.state.status === 'ready' ? quote.state.data : null;
  const reasons = useCancellationData(null);
  const cancelBooking = useCancelRecurringBooking();
  const [cancelStep, setCancelStep] = useState<CancellationStep | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
        ? 'Every visit still to come will be cancelled. There’s no cancellation fee.'
        : `Every visit still to come will be cancelled. The cancellation fee is ${formatPaise(fee)}.`,
      [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel booking', style: 'destructive', onPress: () => setCancelStep('reason') },
      ],
    );
  };

  const confirmCancel = (reasonCode: string, reasonDetail: string) => {
    if (bookingId === undefined) return;
    setCancelError(null);
    const scope = `recurring.booking.cancel:${bookingId}`;
    cancelBooking.mutate(
      {
        id: bookingId,
        reason: reasonDetail.trim() === '' ? { reasonCode } : { reasonCode, reasonDetail },
        scope,
      },
      {
        onSuccess: (result) => {
          setCancelStep(null);
          setTab('live');
          booking.refetch();
          Alert.alert(
            'Booking cancelled',
            result.visitsCancelled === 1
              ? '1 visit was cancelled.'
              : `${result.visitsCancelled} visits were cancelled.`,
          );
        },
        onError: (error) => {
          idempotency.release(scope);
          setCancelError(
            isAppError(error) ? getUserMessage(error) : 'The booking could not be cancelled.',
          );
        },
      },
    );
  };

  const cancelSheet =
    cancellation === null ? null : (
      <CancelBookingSheet
        visible={cancelStep !== null}
        cancellation={cancellation}
        step={cancelStep ?? 'reason'}
        // Back from the reason step closes: the policy step is the one-time booking's table.
        onStepChange={(step) => setCancelStep(step === 'policy' ? null : step)}
        onClose={() => setCancelStep(null)}
        onConfirmCancel={confirmCancel}
        onBookAgain={() => setCancelStep(null)}
        cancelling={cancelBooking.isPending}
        cancelErrorMessage={cancelError}
      />
    );

  return (
    <QueryBoundary state={state} onRetry={booking.refetch}>
      {(model) =>
        tab === 'plans' && plans !== null ? (
          <>
            <RecurringPlansScreen
              model={plans}
              onBack={goBack}
              onTabChange={setTab}
              onDelete={data?.status === 'active' ? askToCancel : undefined}
              onHistoryPress={(_visitKey, visitId) => openDetails(visitId)}
            />
            {cancelSheet}
          </>
        ) : (
          <RecurringLiveScreen
            model={model}
            onBack={goBack}
            onTabChange={setTab}
            notice={notice}
            onOpenVisit={onOpenVisit}
            onOpenUpNext={() => {
              if (data?.upNext) openVisit(data.upNext, true);
            }}
          />
        )
      }
    </QueryBoundary>
  );
}
