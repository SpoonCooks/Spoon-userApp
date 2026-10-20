import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { destinationForPayment, useBookingSubmission } from '@features/booking';
import { isAppError } from '@core/errors';
import { formatPaise } from '@core/format';
import { useNavigationGuard, useSafeBack } from '@core/navigation';
import { ScheduleForLaterView, useScheduleForLater } from '@features/scheduleLater';

/**
 * Schedule for Later — Figma `cCQlzTeiObQkpVBzwI8mZi` `2466:18844` / `2466:18864` / `2466:19025`.
 *
 * Reached from Home's "Book for later" with the chosen duration. The duration carousel, the three
 * days, the time-of-day tabs and the start times all read the three-day overview (DEC-094), so a
 * duration, day, time of day or start time with nothing free is greyed before it is tapped. The
 * slot id is the server's ISO start, so booking sends back exactly the instant that was offered.
 * Rescheduling keeps its own screen (`reschedule/[id].tsx`).
 */
export default function ScheduledRoute() {
  const router = useRouter();
  const { durationId: presetDuration, date: presetDate } = useLocalSearchParams<{
    durationId?: string;
    date?: string;
  }>();
  /**
   * Home's "Book for later" passes the duration the customer already chose (`?durationId=dur-90`),
   * so it stays selected on the carousel and only a day and a start time remain.
   */
  const preset = presetDuration?.startsWith('dur-') === true ? presetDuration : null;
  /**
   * A Recurring visit whose Autopay debit failed books "a one-time visit for the same slot"
   * (`?date=2026-10-14&durationId=dur-60`): its day is chosen too, when it is free.
   */
  const presetDay =
    typeof presetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(presetDate) ? presetDate : null;

  // Re-read every 30 seconds only while this screen is showing (DEC-094).
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const later = useScheduleForLater({
    presetDurationId: preset,
    presetDayId: presetDay,
    focused,
  });
  const { selection, refreshFresh } = later;

  const submission = useBookingSubmission({
    slotType: 'scheduled',
    durationId: selection.durationId,
    scheduledStart: selection.slotId,
  });

  // One screen per tap: a quick double tap must not open (or pop) a screen twice.
  const guard = useNavigationGuard();
  const goBack = useSafeBack('/home');

  return (
    <ScheduleForLaterView
      state={later.state}
      selection={selection}
      lostPick={later.lostPick}
      onBack={guard(goBack)}
      onRetry={later.refetch}
      onSelectDuration={later.selectDuration}
      onSelectDay={later.selectDay}
      onSelectPeriod={later.selectPeriod}
      onSelectSlot={later.selectSlot}
      /**
       * The SERVER's half of the CTA gate: the account's default address, a duration and a start
       * the server offered, priced by a ready quote. Until both hold, Confirm Booking stays grey,
       * so it is never live without the amount the footer states.
       */
      canSubmit={submission.canSubmit && submission.quote.state.status === 'ready'}
      submitting={submission.submitting}
      submitError={submission.submitError}
      {...(submission.quote.state.status === 'ready'
        ? { amountLabel: formatPaise(submission.quote.state.data.quote.totalAmountPaise) }
        : {})}
      onSubmit={() => {
        if (!submission.canSubmit || submission.submitting) return;
        void submission
          .submit()
          .then((created) => {
            // This customer's own booking changed what is free: Home reads it afresh, not from
            // the 30-second cache that still offers the time just taken.
            void refreshFresh().catch(() => undefined);
            const bookingId = created.booking.booking.id;
            /**
             * REPLACE, not push: returning to a grid that still offers the time just booked
             * invites a second booking of it. A VERIFIED payment goes to the confirmation, an
             * unpaid one to Payment Failed (`destinationForPayment`, shared with Home); a dismissed
             * checkout (null) stays here with the selection intact so the CTA can be pressed again.
             */
            const destination = destinationForPayment(created.payment, bookingId);
            if (destination !== null) router.replace(destination);
          })
          .catch((failure: unknown) => {
            // Rendered through `submitError`. A start time taken since the grid was drawn: read
            // the three days again past the cache, so the grid greys it and the pick is dropped.
            if (isAppError(failure) && failure.code === 'SLOT_UNAVAILABLE') {
              void refreshFresh().catch(() => undefined);
            }
          });
      }}
    />
  );
}
