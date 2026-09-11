import { getUserMessage, normalizeError } from '@core/errors';

import { CheckoutCancelledError } from './razorpayLauncher';

/**
 * A payment failure as customer copy — or null when there is nothing to report.
 *
 * ## The rule this exists to hold
 *
 * A DISMISSED checkout is a choice, not a fault. Closing Razorpay over a ₹50 tip must leave the
 * sheet quiet; telling that customer their payment "failed" accuses them of something they did on
 * purpose. Every payment surface in the app owes them the same answer, so the rule lives here
 * rather than being re-derived per screen — it has already been got wrong once, on the booking
 * flow, where a dismissal was reported as a failure on a full screen.
 *
 * Everything else becomes the taxonomy's wording via `getUserMessage`. Nothing here inspects a
 * provider code or invents copy of its own.
 */
export function paymentErrorMessage(error: Error | null | undefined): string | null {
  if (error === null || error === undefined) return null;
  if (error instanceof CheckoutCancelledError) return null;
  return getUserMessage(normalizeError(error));
}
