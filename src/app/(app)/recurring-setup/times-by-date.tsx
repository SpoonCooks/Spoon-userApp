import { RecurringTimesByDateScreen } from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — Step 3 "Times by date". DEV-reachable at
 * `spoon://recurring-setup/times-by-date`.
 *
 * Not linked from anywhere in the app yet, and `onContinue` is left unwired — see
 * `RecurringTimesByDateScreen`'s own banner and docs/CLAUDE_DESIGN_RECURRING_SETUP.md. `/home` is
 * a placeholder fallback for the same reason as the earlier steps' routes.
 */
export default function RecurringSetupTimesByDateRoute() {
  const goBack = useSafeBack('/home');

  return <RecurringTimesByDateScreen onBack={goBack} />;
}
