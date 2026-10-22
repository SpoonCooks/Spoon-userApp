import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { getUserMessage, isAppError } from '@core/errors';
import { useNavigationGuard, useSafeBack } from '@core/navigation';
import {
  AutopayNotice,
  RecurringLiveScreen,
  useDeletePlan,
  RecurringPlansScreen,
  liveCalendarFrom,
  planHasLiveVisit,
  planNumberOf,
  plansSummaryFrom,
  todayInKolkata,
} from '@features/recurringLive';
import type {
  AutopayNoticeKind,
  LiveCalendarModel,
  RecurringTab,
  VisitRef,
} from '@features/recurringLive';
import { useMe } from '@features/auth';
import { CheckoutNoPaymentMethodsError, NO_UPI_APP_MESSAGE } from '@features/payment';
import {
  AutopayFlowSheet,
  summaryFromBooking,
  useApproveRecurringMandate,
  useAutopayIntentEnabled,
  useRecurringBooking,
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
 * trash deletes the Plan on screen (DEC-092): its days not charged yet are cancelled free, after the
 * server's quote and the app's cancellation reason sheet; the other Plans carry on. Cancelling the
 * whole booking is Payment details → Manage. The pencil opens Edit duration for the visit on screen
 * (DEC-093): one day's duration changes, until that day's Autopay notice 27 hours before.
 *
 * A booking whose visits can't be charged — saved but never approved (`pending_mandate`), or its
 * mandate paused / revoked / expired (`banner`) — carries the Autopay notice on the Live tab, which
 * approves Autopay again for this same booking: the UPI Autopay sheet (Figma 2316:3558) when the
 * server has UPI Intent on (`useAutopayIntentEnabled`), otherwise Razorpay's Autopay checkout.
 */
export default function RecurringBookingRoute() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  // One screen per tap: a quick double tap must not open (or pop) a screen twice.
  const guard = useNavigationGuard();
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
  const intent = useAutopayIntentEnabled();
  const me = useMe();
  /** The UPI Autopay sheet, fresh per tap. */
  const [sheet, setSheet] = useState<{ readonly open: boolean; readonly key: number } | null>(null);
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
    if (intent) {
      setSheet((previous) => ({ open: true, key: (previous?.key ?? 0) + 1 }));
      return;
    }
    autopay.approve(data).then(
      (outcome) => {
        booking.refetch();
        if (outcome.kind !== 'approved') return;
        // Only the bank's confirmation is "approved". Checkout succeeding means the request
        // reached the bank; it can still be pending there, or refused (handoff V2).
        const { mandate } = outcome;
        // Not `bookingStatus === 'active'`: re-approving a paused, revoked or expired mandate
        // happens on a booking that is already active, whatever the new mandate's state.
        if (mandate.status === 'confirmed') {
          Alert.alert(
            'Autopay approved',
            'Your visits are set. We’ll confirm each cook 3 hours before.',
          );
        } else if (mandate.status === 'pending' || mandate.status === 'initiated') {
          Alert.alert(
            'Waiting for your bank',
            'We’ll let you know as soon as your bank confirms Autopay. This usually takes a few minutes.',
          );
        } else {
          Alert.alert(
            'Autopay wasn’t approved',
            'Your bank didn’t confirm Autopay. Please try again from this booking.',
          );
        }
      },
      (error: unknown) => {
        booking.refetch();
        Alert.alert(
          'Couldn’t approve Autopay',
          error instanceof CheckoutNoPaymentMethodsError
            ? NO_UPI_APP_MESSAGE
            : isAppError(error)
              ? getUserMessage(error)
              : 'Please try again in a moment.',
        );
      },
    );
  };
  const notice =
    noticeKind === null ? null : (
      <AutopayNotice kind={noticeKind} busy={autopay.pending} onApprove={approveAutopay} />
    );
  const closeSheet = () => {
    setSheet((previous) => (previous === null ? null : { ...previous, open: false }));
    booking.refetch();
  };
  const autopaySheet =
    sheet === null || data === null ? null : (
      <AutopayFlowSheet
        key={sheet.key}
        visible={sheet.open}
        source={{ kind: 'booking', booking: data }}
        summary={summaryFromBooking(data)}
        userId={me.state.status === 'ready' ? me.state.data.id : null}
        onClose={closeSheet}
        onBackToHome={guard(() => router.dismissTo('/home'))}
        onViewPlan={closeSheet}
      />
    );

  // ─── Deleting a Plan (Manage plans' trash) ─────────────────────────────────────────────────
  const [planChosen, setPlanChosen] = useState<number | null>(null);
  // The Plan on screen: the one chosen, while it is still shown; otherwise the first shown, as
  // the screen opens on it (a deleted Plan drops out of Manage plans).
  const shownPlans = plans?.plans.map((plan) => planNumberOf(plan.id)) ?? [];
  const planOnScreen =
    planChosen !== null && shownPlans.includes(planChosen) ? planChosen : (shownPlans[0] ?? 1);
  const { askToDelete, sheet: deletePlanSheet } = useDeletePlan({
    bookingId: bookingId ?? null,
    planNumber: tab === 'plans' ? planOnScreen : null,
    lastPlan:
      data !== null &&
      !data.plans.some(
        (plan) => plan.planNumber !== planOnScreen && planHasLiveVisit(data, plan.planNumber),
      ),
    onDeleted: () => {
      setPlanChosen(null);
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
              onBack={guard(goBack)}
              onTabChange={setTab}
              // Figma draws the bin on every live plan; a booking still waiting for Autopay can have
              // a Plan deleted too (the server's quote marks `pending_mandate` cancellable).
              onDelete={
                data?.status === 'active' || data?.status === 'pending_mandate'
                  ? askToDelete
                  : undefined
              }
              onPlanChange={setPlanChosen}
              // The pencil changes one day's visit duration, until its Autopay notice (DEC-093).
              onEditDuration={
                data?.status === 'active' || data?.status === 'pending_mandate'
                  ? guard((planNumber: number, visitNumber: number) =>
                      router.push({
                        pathname: '/recurring/[bookingId]/duration',
                        params: {
                          bookingId: bookingId ?? '',
                          planNumber: String(planNumber),
                          visitNumber: String(visitNumber),
                        },
                      }),
                    )
                  : undefined
              }
              onHistoryPress={guard((_visitKey: string, visitId: string) => openDetails(visitId))}
            />
            {deletePlanSheet}
          </>
        ) : (
          <>
            <RecurringLiveScreen
              model={model}
              onBack={guard(goBack)}
              onTabChange={setTab}
              notice={notice}
              onOpenVisit={guard(onOpenVisit)}
            />
            {autopaySheet}
          </>
        )
      }
    </QueryBoundary>
  );
}
