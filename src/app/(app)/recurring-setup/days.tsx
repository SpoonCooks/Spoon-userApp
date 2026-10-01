import { Stack } from 'expo-router';

import { RecurringPlanFlow } from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — the whole flow: pick days and plans → Schedule each plan's visits → Summary.
 * Reachable at `spoon://recurring-setup/days`. (The file keeps its name: `/recurring-setup` itself
 * is the dev preview's path, `(dev)/recurring-setup.tsx`, and two routes can't share it.)
 *
 * Not linked from anywhere in the app yet, and "Book Now" (`onComplete`) is left unwired — there
 * is no backend contract or next screen for it yet. `/home` is a placeholder fallback for the same
 * reason: nothing has decided yet where this flow is entered from.
 */
export default function RecurringSetupRoute() {
  const goBack = useSafeBack('/home');

  // Swipe-back is off: a sweep across the calendar from its Monday column would otherwise start
  // the stack's back gesture. Each screen has its own back button.
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <RecurringPlanFlow onExit={goBack} />
    </>
  );
}
