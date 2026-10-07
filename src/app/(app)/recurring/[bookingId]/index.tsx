import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { useSafeBack } from '@core/navigation';
import { RecurringLiveScreen, liveCalendarFrom, todayInKolkata } from '@features/recurringLive';
import type { LiveCalendarModel, VisitRef } from '@features/recurringLive';
import { useRecurringBooking } from '@features/recurringSetup';
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
 * has a booking — until its charge it has none, and they open Visit details too. A date's "Cancel"
 * opens that date's visit, whose "Modify booking" cancels it. Manage plans is not on real data
 * yet, so it says so rather than opening the static fixture screen.
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

  const comingSoon = () => Alert.alert('Coming soon', 'This part of Recurring is on its way.');

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

  return (
    <QueryBoundary state={state} onRetry={booking.refetch}>
      {(model) => (
        <RecurringLiveScreen
          model={model}
          onBack={goBack}
          onTabChange={(tab) => {
            if (tab !== 'live') comingSoon();
          }}
          onOpenVisit={onOpenVisit}
          onOpenUpNext={() => {
            if (data?.upNext) openVisit(data.upNext, true);
          }}
          onCancelDay={(dateId) => {
            const visit = visitsOn(dateId).find(
              (v) => v.status !== 'cancelled' && v.status !== 'completed',
            );
            if (visit !== undefined) openDetails(visit.visitId);
          }}
        />
      )}
    </QueryBoundary>
  );
}
