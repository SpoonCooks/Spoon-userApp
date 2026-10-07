import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { useSafeBack } from '@core/navigation';
import { RecurringLiveScreen, liveCalendarFrom, todayInKolkata } from '@features/recurringLive';
import type { LiveCalendarModel } from '@features/recurringLive';
import { useRecurringBooking } from '@features/recurringSetup';
import { QueryBoundary } from '@ui';

/**
 * Recurring — a live booking's "Live booking" tab, on the booking itself
 * (`GET /v1/me/recurring-bookings/{bookingId}`): the visit calendar, each date's visits, Up next
 * and the done / cancelled / to-go thread. Opened from Home's "Recurring · Live" chip; back
 * returns to whatever opened it (`/home` when nothing did, as on a deep link).
 *
 * Manage plans, Visit details and cancelling from a date are designed but not yet on real data,
 * so they say so rather than opening the static fixture screens.
 */
export default function RecurringBookingRoute() {
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

  return (
    <QueryBoundary state={state} onRetry={booking.refetch}>
      {(model) => (
        <RecurringLiveScreen
          model={model}
          onBack={goBack}
          onTabChange={(tab) => {
            if (tab !== 'live') comingSoon();
          }}
          onOpenVisit={comingSoon}
          onCancelDay={comingSoon}
        />
      )}
    </QueryBoundary>
  );
}
