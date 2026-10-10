import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { getUserMessage, isAppError } from '@core/errors';
import { useSafeBack } from '@core/navigation';
import {
  AutopayNotice,
  RecurringLiveScreen,
  useCancelWholeBooking,
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
import { useApproveRecurringMandate, useRecurringBooking } from '@features/recurringSetup';
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
  const { askToCancel, sheet: cancelSheet } = useCancelWholeBooking({
    bookingId: bookingId ?? null,
    enabled: tab === 'plans',
    onViewRefunds: () => router.push('/refunds'),
    onCancelled: () => {
      setTab('live');
      booking.refetch();
    },
  });

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
