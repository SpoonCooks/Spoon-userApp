import { RecurringReviewScreen } from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — Step 4 "Review plan". DEV-reachable at `spoon://recurring-setup/review`.
 *
 * Not linked from anywhere in the app yet, and `onContinue` is left unwired — see
 * `RecurringReviewScreen`'s own banner and docs/CLAUDE_DESIGN_RECURRING_SETUP.md. `/home` is a
 * placeholder fallback for the same reason as the earlier steps' routes.
 */
export default function RecurringSetupReviewRoute() {
  const goBack = useSafeBack('/home');

  return <RecurringReviewScreen onBack={goBack} />;
}
