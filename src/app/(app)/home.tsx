import { useCallback, useState } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { getLogger } from '@core/logging';
import { useMe } from '@features/auth';
import { destinationForPayment, durationIdFor, useBookingSubmission } from '@features/booking';
import {
  HomeRedesignView,
  joinWaitlist,
  useHomeRedesignData,
  useJoinWaitlist,
} from '@features/homeRedesign';
import type { BookingRequest, RecurringTarget } from '@features/homeRedesign';
import { QueryBoundary } from '@ui';

const logger = getLogger('home');

/**
 * Home — the redesign (Figma `cCQlzTeiObQkpVBzwI8mZi`: `941:4884`, `1255:2973`, `1290:1280`,
 * `1302:3539`), on live data from `useHomeRedesignData`.
 *
 * Book now (Now, instant available) creates an instant booking and opens Razorpay, exactly as
 * the old Instant sheet did — `useBookingSubmission` owns the hold, idempotency and checkout, and
 * `destinationForPayment` decides where the outcome lands. Schedule hands the chosen duration to
 * `/scheduled`, so only a slot and payment remain.
 *
 * An address OUTSIDE the service area now renders the not-live Home (waitlist + referral) rather
 * than bouncing to the map; only an account with no saved address at all is sent to add one.
 *
 * Destinations that do not exist in this app yet (plan tracker, recurring explainer, cook pool,
 * cook profile) answer "coming soon" on the screen rather than doing nothing.
 */
export default function HomeRoute() {
  const router = useRouter();
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const home = useHomeRedesignData({ waitlistJoined });
  const me = useMe();
  const join = useJoinWaitlist();

  // The duration the submission prices and books. Kept in step with every new selection.
  const [durationId, setDurationId] = useState<string | null>(null);
  const submission = useBookingSubmission({ slotType: 'instant', durationId });
  /**
   * One-line notices. A refused booking's copy is read from `submitError` at render — the
   * rejection handler would only see the previous render's value.
   */
  const [notice, setNotice] = useState<{ id: number; message: string | 'booking' } | null>(null);
  const say = (message: string | 'booking') =>
    setNotice((prev) => ({ id: (prev?.id ?? 0) + 1, message }));
  const shownNotice =
    notice === null
      ? null
      : {
          id: notice.id,
          message:
            notice.message === 'booking'
              ? (submission.submitError ?? 'Couldn’t start the booking. Please try again.')
              : notice.message,
        };

  // Re-resolve the variant on every Home focus (address change, a first completed booking).
  const { refetch } = home;
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (home.needsAddress) {
    return <Redirect href="/address/location?onboarding=1" />;
  }

  const bookNow = (request: BookingRequest) => {
    if (!submission.canSubmit || submission.submitting) return;
    if (durationId !== request.duration.id) return;
    submission.submit().then(
      ({ booking, payment }) => {
        // Verified → the confirming screen; failed → Payment Failed; dismissed → stay on Home.
        const destination = destinationForPayment(payment, booking.booking.id);
        if (destination !== null) router.push(destination);
      },
      () => say('booking'),
    );
  };

  const openRecurring = (target: RecurringTarget): boolean => {
    if (target === 'recurringFlow') {
      router.push('/recurring-setup/days');
      return true;
    }
    // Plan tracker and the recurring explainer are not built yet.
    return false;
  };

  return (
    <QueryBoundary state={home.state} onRetry={home.refetch}>
      {(model) => (
        <HomeRedesignView
          model={model}
          bookingBusy={submission.submitting}
          notice={shownNotice}
          onPressAddress={() => router.push('/address?from=home')}
          onPressProfile={() => router.push('/profile')}
          onDurationSelected={(event) => {
            setDurationId(durationIdFor(event.durationMin));
            logger.info('duration_selected', event);
          }}
          onBookNow={bookNow}
          onPickSlot={(request) =>
            router.push({
              pathname: '/scheduled',
              params: { durationId: request.duration.id },
            })
          }
          onPressRecurring={openRecurring}
          onRefreshAvailability={home.refetch}
          onJoinWaitlist={async () => {
            const meData = me.state.status === 'ready' ? me.state.data : null;
            const name = meData?.name?.trim() || meData?.phone || 'Spoon customer';
            await joinWaitlist(
              { pincode: model.address.pincode, alreadyJoined: waitlistJoined },
              {
                requestPushPermission: async () => {
                  const existing = await Notifications.getPermissionsAsync();
                  if (existing.granted) return true;
                  return (await Notifications.requestPermissionsAsync()).granted;
                },
                // The backend takes no channel; push permission is asked for its own sake.
                register: async () => {
                  await join.mutateAsync({ name, addressId: home.addressId });
                },
              },
            ).catch((error: unknown) => {
              say('Couldn’t add you to the list. Please try again.');
              throw error;
            });
            setWaitlistJoined(true);
          }}
        />
      )}
    </QueryBoundary>
  );
}
