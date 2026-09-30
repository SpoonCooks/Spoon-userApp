import { RecurringPlanConfirmedScreen } from '@features/recurringSetup';

/**
 * Recurring setup — Step 6 "Plan confirmed". DEV-reachable at `spoon://recurring-setup/confirmed`.
 *
 * Not linked from anywhere in the app yet, and both actions are left unwired — see
 * `RecurringPlanConfirmedScreen`'s own banner and docs/CLAUDE_DESIGN_RECURRING_SETUP.md. No
 * `useSafeBack` here: this is a terminal screen with no back control, same as the other steps'
 * routes but for the opposite reason — there is nowhere to go back TO once a plan is confirmed.
 */
export default function RecurringSetupConfirmedRoute() {
  return <RecurringPlanConfirmedScreen />;
}
