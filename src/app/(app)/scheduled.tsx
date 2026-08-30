import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useBookingSubmission } from '@features/booking';
import { formatPaise } from '@core/format';
import { useSafeBack } from '@core/navigation';
import { ScheduleView, devScheduleSelection, useScheduleData } from '@features/scheduled';
import type { ScheduleSelection } from '@features/scheduled';

/**
 * Scheduled booking — Figma `sbIXeBfaMzUFUz2NYJIJTm`, finalized "Scheduled flow" `267:3521`.
 *
 * One screen, four progressively-disclosed states:
 *   `275:4488` Day → `275:4713` + Time → `275:4938` + Duration → `34:3035` + Start time.
 *
 * No booking horizon is encoded (blocker B-8): the day row renders whatever the payload provides.
 *
 * The selection lives here as well as in the screen, because the DAY and the DURATION are the
 * arguments to `GET /v1/availability/scheduled` — picking a different day has to re-ask the
 * server which slots exist, not re-filter a grid the client already holds. The slot id IS the
 * server's ISO start, so submitting sends back exactly the instant that was offered.
 *
 * DEV reachability (task §16): `?step=1..4` seeds the selection so each finalized state opens
 * directly instead of requiring three taps. `__DEV__`-only; a release build always starts empty.
 */
export default function ScheduledRoute() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step?: string }>();
  const [selection, setSelection] = useState<ScheduleSelection>({
    dayId: null,
    periodId: null,
    durationId: null,
    slotId: null,
  });

  const { state, refetch } = useScheduleData('book', {
    date: selection.dayId,
    durationMinutes: durationMinutesFrom(selection.durationId),
  });

  const submission = useBookingSubmission({
    slotType: 'scheduled',
    durationId: selection.durationId,
    scheduledStart: selection.slotId,
  });

  const seed = __DEV__ ? devScheduleSelection(state, step) : undefined;

  /**
   * Home. Reached from the Home tile and from the Instant sheet's "Schedule instead", both of
   * which sit on Home; a `spoon://scheduled` deep link has nothing behind it and lands there too.
   */
  const goBack = useSafeBack('/home');

  return (
    <ScheduleView
      state={state}
      onRetry={refetch}
      onBack={goBack}
      {...(seed === undefined ? {} : { initialSelection: seed })}
      {...(submission.quote.state.status === 'ready'
        ? {
            primaryCtaAmountLabel: formatPaise(submission.quote.state.data.quote.totalAmountPaise),
          }
        : {})}
      /**
       * The SERVER's half of the CTA gate (task §A4/§A5).
       *
       * A complete grid selection is not a bookable booking. `canSubmit` is the account's default
       * address plus a duration plus a start the server itself offered; the ready QUOTE is the
       * server having priced that exact combination. Until both hold, "Book Now" stays grey —
       * which is also what stops the bar from ever being live while it carries no amount, since
       * the amount comes from the same quote.
       *
       * A quote that fails or is still in flight therefore leaves the CTA disabled rather than
       * letting a booking be created at a price nobody stated.
       */
      canSubmit={submission.canSubmit && submission.quote.state.status === 'ready'}
      onSelectionChange={setSelection}
      submitting={submission.submitting}
      onSubmit={() => {
        if (!submission.canSubmit || submission.submitting) return;
        void submission
          .submit()
          .then((created) => {
            const bookingId = created.booking.booking.id;

            /**
             * REPLACE, not push (task §3). The slot has been taken, so returning to a grid that
             * still offers it — with a filled-in selection and a live "Book Now" — invites a
             * second booking of a time the customer already has.
             *
             * A VERIFIED payment goes to `433:2290`, Page 21, which waits on the SERVER and then
             * moves to Home (V7 founder comment, task §9/§10). Anything else has no confirmation
             * to wait for and goes to the booking screen, which shows the hold as it stands. See
             * `app/(app)/home.tsx` for the same split on the Instant path.
             */
            router.replace(
              created.payment === 'verified'
                ? `/booking/confirming?id=${bookingId}`
                : `/booking/${bookingId}`,
            );
          })
          .catch(() => {
            // Already normalized and surfaced by the mutation; the selection is left intact so a
            // retry replays the same idempotency scope rather than creating a second booking.
          });
      }}
      /*
       * `onOpenPaymentDetails` is still not passed, and no longer needs to be.
       *
       * It was withheld as FIGMA_PENDING on the reading that no breakdown sheet existed for
       * Scheduled. The founder confirmed against frame 5d (2026-08-31) that the line IS drawn
       * there and opens the same explainer as `25:1585`. The screen now owns that sheet itself,
       * exactly as the Instant sheet does, so the link is live without a host seam; this prop
       * remains only as an override for a host that wants a different destination.
       */
    />
  );
}

/** `dur-90` -> 90. Mirrors the booking feature's own handle for a server duration. */
function durationMinutesFrom(durationId: string | null): number | null {
  if (durationId === null || !durationId.startsWith('dur-')) return null;
  const minutes = Number.parseInt(durationId.slice('dur-'.length), 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}
