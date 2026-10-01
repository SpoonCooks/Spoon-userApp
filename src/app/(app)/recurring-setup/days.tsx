import { Stack } from 'expo-router';

import { RecurringDaysScreen } from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — Step 1 "Pick your days". DEV-reachable at `spoon://recurring-setup/days`.
 *
 * Not linked from anywhere in the app yet, and `onContinue` is left unwired — see
 * `RecurringDaysScreen`'s own banner and docs/CLAUDE_DESIGN_RECURRING_SETUP.md. `/home` is a
 * placeholder fallback for the same reason: nothing has decided yet where this flow is entered
 * from.
 */
export default function RecurringSetupDaysRoute() {
  const goBack = useSafeBack('/home');

  // Swipe-back is off: a sweep across the calendar from its Monday column would otherwise start
  // the stack's back gesture. The screen has its own back button.
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <RecurringDaysScreen onBack={goBack} />
    </>
  );
}
