import { useRecurringEligibility } from '../api';
import { upiIntentSupported } from './upiApps';

/**
 * Whether Autopay approval runs as the Figma UPI Intent sheet (2316:3558) or as Razorpay's
 * Checkout, the fallback.
 *
 * Server-driven: V0's `RECURRING_UPI_INTENT_ENABLED` (default off) reaches the app as the
 * eligibility read's `charging.mandateFlow`. Flipping that one variable switches every build that
 * can do UPI Intent; no release. A build that cannot (no native module, no declared iOS schemes)
 * stays on Checkout whatever the server says, and so does any build until the read has answered.
 */
export function useAutopayIntentEnabled(): boolean {
  const eligibility = useRecurringEligibility();
  return (
    eligibility.state.status === 'ready' &&
    eligibility.state.data.charging.mandateFlow === 'upi_intent' &&
    upiIntentSupported()
  );
}
