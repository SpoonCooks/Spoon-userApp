import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { idempotency } from '@core/api';
import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { useNavigationGuard, useSafeBack } from '@core/navigation';
import {
  RecurringEditDurationScreen,
  durationChangeMessage,
  editDurationDatesFrom,
  useChangeVisitDuration,
  useRecurringBooking,
  useVisitDurationOptions,
} from '@features/recurringSetup';
import type { EditDurationDate } from '@features/recurringSetup';
import { QueryBoundary } from '@ui';

/**
 * Recurring — change one day's visit duration on a live booking (DEC-093), from Manage plans'
 * pencil. `planNumber` and `visitNumber` name the visit on screen there; its dates still
 * `scheduled` are offered, the first one chosen. The server says whether the chosen date can still
 * change (until its Autopay notice, 27 hours before) and today's prices; Save changes it and goes
 * back to Manage plans.
 */
export default function RecurringEditDurationRoute() {
  const params = useLocalSearchParams<{
    bookingId: string;
    planNumber: string;
    visitNumber: string;
  }>();
  const bookingId = params.bookingId ?? null;
  const planNumber = Number(params.planNumber ?? '1');
  const visitNumber = Number(params.visitNumber ?? '1');
  const guard = useNavigationGuard();
  const goBack = useSafeBack(bookingId === null ? '/home' : `/recurring/${bookingId}`);
  const booking = useRecurringBooking(bookingId);

  const state = useMemo<DataState<readonly EditDurationDate[]>>(
    () =>
      booking.state.status === 'ready'
        ? ready(editDurationDatesFrom(booking.state.data, planNumber, visitNumber))
        : booking.state,
    [booking.state, planNumber, visitNumber],
  );
  const dates = state.status === 'ready' ? state.data : [];

  const [chosen, setChosen] = useState<string | null>(null);
  const selectedVisitId = chosen ?? dates[0]?.visitId ?? null;
  const options = useVisitDurationOptions(bookingId, selectedVisitId);
  const change = useChangeVisitDuration();

  const save = (durationMinutes: number) => {
    if (bookingId === null || selectedVisitId === null) return;
    const scope = `recurring.visit.duration:${selectedVisitId}:${String(durationMinutes)}`;
    change.mutate(
      { id: bookingId, visitId: selectedVisitId, durationMinutes, scope },
      {
        onSuccess: () => {
          Alert.alert('Duration changed', 'Your visit and its Autopay amount are updated.');
          goBack();
        },
        onError: (failure) => {
          idempotency.release(scope);
          options.refetch();
          Alert.alert('Couldn’t change the duration', durationChangeMessage(failure));
        },
      },
    );
  };

  return (
    <QueryBoundary state={state} onRetry={booking.refetch}>
      {(entries) => (
        <RecurringEditDurationScreen
          planNumber={planNumber}
          dates={entries}
          selectedVisitId={selectedVisitId ?? ''}
          onSelectDate={setChosen}
          options={options.state.status === 'ready' ? options.state.data : null}
          saving={change.isPending}
          onBack={guard(goBack)}
          onSave={save}
        />
      )}
    </QueryBoundary>
  );
}
