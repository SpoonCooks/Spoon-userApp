import { useRecurringEligibility } from '../api';
import { upiIntentSupported } from './upiApps';

/**
 * Whether "Book Now" (and re-approving on the live booking) opens the Figma UPI Autopay sheet
 * (`2316:3558`) or the plain Checkout step, which has no frame.
 *
 * The sheet, whenever this build can list UPI apps (the owner, 2026-10-16: the flow is the Figma
 * one, not a screen it never drew). What happens after an app is picked is the server's call,
 * `useServerUpiIntent`: UPI Intent when it is on, Razorpay's Checkout from the sheet while it is
 * off. A build that cannot list apps (no native module, no declared iOS schemes) keeps the step.
 */
export function useAutopayIntentEnabled(): boolean {
  return upiIntentSupported();
}

/**
 * Whether the server takes Autopay approval by UPI Intent: V0's `RECURRING_UPI_INTENT_ENABLED`
 * (default off, until Razorpay enables S2S UPI Intent for Recurring) as the eligibility read's
 * `charging.mandateFlow`. Off, or not answered yet, the sheet approves through Checkout.
 */
export function useServerUpiIntent(): boolean {
  const eligibility = useRecurringEligibility();
  return (
    eligibility.state.status === 'ready' &&
    eligibility.state.data.charging.mandateFlow === 'upi_intent'
  );
}
