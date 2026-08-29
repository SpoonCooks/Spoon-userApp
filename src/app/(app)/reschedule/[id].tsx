import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useBookingDetail, useRescheduleBooking } from '@features/booking';
import {
  ScheduleView,
  devScheduleSelection,
  serviceDateIn,
  useScheduleData,
} from '@features/scheduled';
import { useCatalogue } from '@features/catalogue';
import type { ScheduleSelection } from '@features/scheduled';
import { getUserMessage, isAppError } from '@core/errors';
import { useSafeBack } from '@core/navigation';
import { InfoDialog } from '@ui';

/**
 * Reschedule — Figma `sbIXeBfaMzUFUz2NYJIJTm`, finalized "Rescheduled flow" section `275:5217`.
 *
 * This became its OWN finalized section in v4. In the previous file the same frames sat under a
 * second section also called "Scheduled flow", which is why they were byte-identical to Schedule
 * and were recorded as a duplicate; the rename resolves that — they were always the reschedule
 * variant.
 *
 * The section holds **three** states, not Schedule's four:
 *   `275:5442`  Day
 *   `275:5490`  + Time
 *   `275:5218`  + Start time, CTA "Reschedule"
 *
 * The missing step is DURATION, and that matches the locked product rule: a reschedule moves
 * *when*, never *how long*. The screen already produces exactly this shape from `mode:
 * 'reschedule'` + an absent `durations` — no reschedule-specific layout exists or is needed.
 *
 * The v4 CTA reads "Reschedule" and there is NO payment line, which is also the locked rule
 * (reschedule is free, max once, no Razorpay).
 *
 * ## Submit is live, and ruling R-3 is intact
 *
 * It used to be inert "until blocker B-4 resolves reschedule eligibility server-side", which left
 * the one CTA on the screen doing nothing at all — the dead control §11 forbids. B-4 is about who
 * DECIDES eligibility, and the answer has not changed: the server does.
 * `POST /v1/bookings/:id/reschedule` is that decision. This screen sends the slot the server
 * itself offered and renders whatever comes back, including a refusal. It infers nothing — which
 * is exactly what R-3 requires, and is not the same thing as refusing to ask.
 *
 * DEV reachability (task §16): `?step=1..3` seeds the selection so each finalized state opens
 * directly. `__DEV__`-only.
 */
export default function RescheduleRoute() {
  const router = useRouter();
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  const bookingId = typeof id === 'string' ? id : '';
  const booking = useBookingDetail(bookingId === '' ? null : bookingId);
  const catalogue = useCatalogue();
  const bookingData = booking.state.status === 'ready' ? booking.state.data : null;
  const serviceTimeZone =
    catalogue.state.status === 'ready'
      ? catalogue.state.data.operatingWindow.timeZone
      : 'Asia/Kolkata';
  const bookingDate =
    bookingData?.scheduledStart === null || bookingData?.scheduledStart === undefined
      ? null
      : serviceDateIn(serviceTimeZone, new Date(bookingData.scheduledStart));
  const selectionScope = `${bookingId}:${bookingDate ?? 'pending'}:${bookingData?.durationMinutes ?? 'pending'}`;
  const [selectionState, setSelectionState] = useState<{
    scope: string;
    value: ScheduleSelection | null;
  }>({ scope: '', value: null });
  const selection = selectionState.scope === selectionScope ? selectionState.value : null;

  const handleSelectionChange = useCallback(
    (value: ScheduleSelection) => setSelectionState({ scope: selectionScope, value }),
    [selectionScope],
  );

  const { state, refetch } = useScheduleData('reschedule', {
    date: selection?.dayId ?? bookingDate,
    durationMinutes: bookingData?.durationMinutes ?? null,
  });
  const reschedule = useRescheduleBooking();
  const [error, setError] = useState<string | null>(null);

  const seed = __DEV__ ? devScheduleSelection(state, step) : undefined;
  const initialSelection =
    bookingDate === null
      ? seed
      : {
          dayId: bookingDate,
          periodId: seed?.periodId ?? null,
          durationId: null,
          slotId: seed?.slotId ?? null,
        };

  /**
   * The BOOKING being rescheduled — the only screen this one can be about. A notification that
   * deep-links here (or a `spoon://reschedule/:id`) therefore backs out to that booking rather
   * than to Home, which is where the customer expects to be when they abandon the change.
   */
  const goBack = useSafeBack(bookingId === '' ? '/home' : `/booking/${bookingId}`);

  return (
    <>
      <ScheduleView
        key={selectionScope}
        state={state}
        onRetry={refetch}
        onBack={goBack}
        {...(initialSelection === undefined ? {} : { initialSelection })}
        onSelectionChange={handleSelectionChange}
        /* Reschedule is free, so there is no quote to wait on — but the call in flight still has
           to hold the CTA, or a second tap moves the booking twice. */
        submitting={reschedule.isPending}
        onSubmit={(selection) => {
          // The slot id IS the server's ISO start, so what is sent back is exactly what was
          // offered. No slot is constructed here, and an unselected grid cannot submit.
          if (bookingId === '' || selection.slotId === null || reschedule.isPending) return;

          reschedule
            .mutateAsync({
              bookingId,
              scheduledStart: selection.slotId,
              // Scoped to the booking and the target instant, so a retry after an ambiguous
              // failure replays the same move instead of booking a second one.
              scope: `booking.reschedule:${bookingId}:${selection.slotId}`,
            })
            .then(() => {
              /**
               * REPLACE, not push. The booking has moved, so returning to a grid still showing
               * the old slots would offer the customer a choice that no longer describes their
               * booking. The detail screen re-reads the authoritative state.
               */
              router.replace(`/booking/${bookingId}`);
            })
            .catch((thrown: unknown) => {
              // Includes the server's own refusal — "already rescheduled once", "too close to
              // the start". Its message is shown; this screen decides nothing about eligibility.
              setError(
                isAppError(thrown)
                  ? getUserMessage(thrown)
                  : 'We could not reschedule this booking.',
              );
            });
        }}
      />

      {/* FIGMA_PENDING — `275:5218` draws no failure state for the reschedule. */}
      <InfoDialog
        visible={error !== null}
        onClose={() => setError(null)}
        title="Couldn’t reschedule"
        body={error ?? ''}
        testID="reschedule-error"
      />
    </>
  );
}
