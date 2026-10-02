import { Stack } from 'expo-router';

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
 * The flow plans against the backend's recurring reads (DEC-084): the window and day limits, the
 * days a pool Cook can take, catalogue durations and prices, and start times per visit
 * (`useRecurringPlanningSource`). Each falls back to the local rules until it has answered.
 *
 * Not linked from anywhere in the app yet, and "Book Now" (`onComplete`) is left unwired: saving a
 * plan needs the autopay step, which has no design yet, and the flow builds several plans where
 * the backend keeps one live plan per household. `/home` is a placeholder fallback for the same
 * reason: nothing has decided yet where this flow is entered from.
 */
export default function RecurringSetupRoute() {
  const goBack = useSafeBack('/home');
  const planning = useRecurringPlanningSource();

  // Swipe-back is off: a sweep across the calendar from its Monday column would otherwise start
  // the stack's back gesture. Each screen has its own back button.
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <RecurringPlanningProvider value={planning}>
        <RecurringPlanFlow onExit={goBack} />
      </RecurringPlanningProvider>
    </>
  );
}
