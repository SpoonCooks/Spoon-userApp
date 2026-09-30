import { RecurringTimeScreen } from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — Step 2 "Time & duration". DEV-reachable at `spoon://recurring-setup/time`.
 *
 * Not linked from anywhere in the app yet, and `onContinue` is left unwired — see
 * `RecurringTimeScreen`'s own banner and docs/CLAUDE_DESIGN_RECURRING_SETUP.md. `/home` is a
 * placeholder fallback for the same reason as Step 1's route: nothing has decided yet where this
 * flow is entered from, and this screen doesn't yet receive Step 1's day selection either.
 */
export default function RecurringSetupTimeRoute() {
  const goBack = useSafeBack('/home');

  return <RecurringTimeScreen onBack={goBack} />;
}
