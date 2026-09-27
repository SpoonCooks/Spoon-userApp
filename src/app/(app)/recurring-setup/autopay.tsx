import { RecurringAutopayScreen } from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — Step 5 "Autopay". DEV-reachable at `spoon://recurring-setup/autopay`.
 *
 * Not linked from anywhere in the app yet, and `onContinue` is left unwired — see
 * `RecurringAutopayScreen`'s own banner and docs/CLAUDE_DESIGN_RECURRING_SETUP.md. `/home` is a
 * placeholder fallback for the same reason as the earlier steps' routes.
 */
export default function RecurringSetupAutopayRoute() {
  const goBack = useSafeBack('/home');

  return <RecurringAutopayScreen onBack={goBack} />;
}
