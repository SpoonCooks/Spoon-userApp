import { Stack, useRouter } from 'expo-router';

import {
  RecurringPlanFlow,
  RecurringPlanningProvider,
  useRecurringPlanningSource,
} from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — the whole flow: pick days and plans → Schedule each plan's visits → Summary.
 * Reachable at `spoon://recurring-setup/days`. (The file keeps its name: `/recurring-setup` itself
 * is the dev preview's path, `(dev)/recurring-setup.tsx`, and two routes can't share it.)
 *
 * The flow plans against the backend's Recurring reads (DEC-086): the window and day limits, the
 * days a live Recurring booking already has, the durations with their base and effective prices,
 * and start times per visit by time of day (`useRecurringPlanningSource`). Each falls back to the
 * local rules until it has answered.
 *
 * The "?" on every screen opens the Recurring landing page (`/recurring`, `1302:2617`).
 *
 * Not linked from anywhere in the app yet, and "Book Now" (`onComplete`) is left unwired: saving
 * and UPI Autopay are ready in `useBookRecurring`, but the Autopay step has no design yet. `/home`
 * is a placeholder fallback for the same reason: nothing has decided where this flow is entered.
 */
export default function RecurringSetupRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/home');
  const planning = useRecurringPlanningSource();

  // Swipe-back is off: a sweep across the calendar from its Monday column would otherwise start
  // the stack's back gesture. Each screen has its own back button.
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <RecurringPlanningProvider value={planning}>
        <RecurringPlanFlow onExit={goBack} onOpenInfo={() => router.push('/recurring')} />
      </RecurringPlanningProvider>
    </>
  );
}
