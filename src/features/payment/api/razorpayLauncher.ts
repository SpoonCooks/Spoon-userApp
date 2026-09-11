import { getLogger } from '@core/logging';

import type { CheckoutLauncher } from './paymentApi';
import type { RazorpayCheckoutResult } from './schemas';

/**
 * Razorpay's code for "the customer dismissed checkout".
 *
 * From the Android SDK's `Checkout` constants, which the wrapper forwards verbatim as `code`.
 * Treated as a HINT for messaging only — if Razorpay renumbers it, the worst case is that a
 * cancellation reads as a generic failure, never that an unpaid booking reads as paid.
 *
 * That "worst case" turned out to be real: a device dismissal was observed landing here as a
 * `CheckoutFailedError` rather than a `CheckoutCancelledError`, which means either the platform
 * SDK in use does not send `2` for a dismissal, or sends `code` in a shape `readRejection` was
 * not reading. The classification below no longer trusts the numeric code alone —
 * `mentionsCancellation` is the fallback for whichever of those it turns out to be.
 */
const RAZORPAY_PAYMENT_CANCELLED = 2;

/**
 * Razorpay's own wording for a closed sheet, seen across `description` and `reason` depending on
 * platform and SDK version — a case-insensitive SUBSTRING match, not an enum, because the exact
 * string is not part of any published contract either.
 */
const CANCELLATION_WORDS = ['cancel', 'dismiss'];

function mentionsCancellation(...values: readonly (string | null)[]): boolean {
  return values.some(
    (value) =>
      value !== null && CANCELLATION_WORDS.some((word) => value.toLowerCase().includes(word)),
  );
}

export class CheckoutCancelledError extends Error {
  constructor() {
    super('Payment was cancelled before it completed.');
    this.name = 'CheckoutCancelledError';
  }
}

export class CheckoutFailedError extends Error {
  /** Razorpay's own reason, kept for logging. Never shown raw to the customer. */
  readonly providerCode: number | null;
  readonly providerDescription: string | null;

  constructor(providerCode: number | null, providerDescription: string | null) {
    super(providerDescription ?? 'Payment could not be completed.');
    this.name = 'CheckoutFailedError';
    this.providerCode = providerCode;
    this.providerDescription = providerDescription;
  }
}

/** Narrows the SDK's rejection, which is a plain object rather than an `Error`. */
function readRejection(error: unknown): {
  code: number | null;
  description: string | null;
  reason: string | null;
} {
  if (typeof error !== 'object' || error === null) {
    return { code: null, description: null, reason: null };
  }
  const record = error as Record<string, unknown>;
  return {
    code: typeof record['code'] === 'number' ? record['code'] : null,
    description: typeof record['description'] === 'string' ? record['description'] : null,
    /**
     * Razorpay nests this one level DEEPER than its own published type suggests. A real
     * rejection captured from a device reads:
     *
     *   { code, description, details: { code, description, reason, source, step, metadata } }
     *
     * so reading `reason` off the top level found nothing, every time — the fallback added to
     * catch a dismissal Razorpay worded rather than numbered was never actually armed. Both
     * positions are read, because the documented shape is flat and the observed one is not.
     */
    reason: readReason(record),
  };
}

function readReason(record: Record<string, unknown>): string | null {
  if (typeof record['reason'] === 'string') return record['reason'];

  const details = record['details'];
  if (typeof details !== 'object' || details === null) return null;

  const nested = (details as Record<string, unknown>)['reason'];
  return typeof nested === 'string' ? nested : null;
}

/** The SDK is absent from this build. Distinct from a failed payment: nothing was attempted. */
export class CheckoutSdkMissingError extends Error {
  constructor(cause: unknown) {
    super(
      'Razorpay checkout is unavailable in this build: the native module is not linked. ' +
        'A development or release build is required — Expo Go cannot load it.',
    );
    this.name = 'CheckoutSdkMissingError';
    this.cause = cause;
  }
}

interface RazorpayModule {
  open(options: Record<string, unknown>): Promise<{
    razorpay_payment_id: string;
    razorpay_signature?: string;
  }>;
}

function loadCheckout(): RazorpayModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('react-native-razorpay') as {
      default?: RazorpayModule;
    } & RazorpayModule;
    return loaded.default ?? loaded;
  } catch (error) {
    throw new CheckoutSdkMissingError(error);
  }
}

/**
 * The real Razorpay checkout launcher — the one function `CheckoutLauncher` was left open for.
 *
 * ## What it is allowed to conclude
 *
 * Nothing. It opens the sheet and reports what the SDK said, and that report is an untrusted
 * message from a third party running on a device the customer controls. `usePayForBooking`
 * forwards it to `POST /v1/bookings/:id/payments/verify` — the backend holds the secret and is
 * the only party that can check the signature — and then REFETCHES the booking. A success here
 * is not a paid booking; a failure here is not an unpaid one, because Razorpay's webhook reaches
 * the backend independently of this device.
 *
 * ## Why cancellation is an outcome, not an error
 *
 * Closing the sheet is something customers do on purpose. The SDK rejects for it exactly as it
 * rejects for a declined card, so this classifies the rejection and lets the caller distinguish
 * "they changed their mind" from "the payment failed" — the difference between a screen that
 * quietly returns and one that shows an error the customer did not cause. Either way NO payment
 * is claimed: the booking is refetched and the server says what actually happened.
 *
 * ## What is never done here
 *
 * No amount is computed — `amountPaise` comes from the order the backend created. No key is
 * embedded — `keyId` arrives with that order, so rotating it needs no app release. And nothing
 * is fabricated: there is no path through this file that produces a payment id the SDK did not
 * give, which is the failure mode `unavailableCheckoutLauncher` exists to prevent.
 *
 * ## Why the SDK is required lazily
 *
 * `react-native-razorpay` builds a `NativeEventEmitter` over its native module at IMPORT time,
 * which throws when that module is absent — in Expo Go, in a JS-only test runner, and in any
 * build made before the native dependency was linked. Imported at the top level that throw would
 * take down the whole bundle at startup, turning "payments are unavailable" into "the app does
 * not open". Requiring it at the moment checkout is opened confines the failure to the payment
 * the customer just asked for, which is where it belongs and where it can be reported.
 */
export const razorpayCheckoutLauncher: CheckoutLauncher = {
  async open(input): Promise<RazorpayCheckoutResult> {
    const checkout = loadCheckout();

    let data;
    try {
      data = await checkout.open({
        key: input.keyId,
        // Razorpay's `amount` is in the smallest currency unit — paise for INR — which is the
        // unit the backend already priced in. No conversion, no rounding, no arithmetic.
        amount: input.amountPaise,
        currency: input.currency,
        order_id: input.providerOrderId,
        name: 'Spoon',
        description: input.description,
        ...(input.prefill === undefined ? {} : { prefill: input.prefill }),
      });
    } catch (error) {
      const { code, description, reason } = readRejection(error);
      if (code === RAZORPAY_PAYMENT_CANCELLED || mentionsCancellation(description, reason)) {
        throw new CheckoutCancelledError();
      }
      // Logged for every OTHER rejection, not just an unrecognised code: a real decline and a
      // dismissal this heuristic still failed to catch both need to be visible in the one place
      // that ever sees the SDK's raw rejection — nothing upstream of this file sees it again.
      getLogger('payment').warn('Razorpay checkout rejected', {
        code,
        description,
        reason,
        raw: error,
      });
      throw new CheckoutFailedError(code, description);
    }

    // A success the backend cannot verify is not a success. Razorpay omits the signature for
    // flows this app does not use (it is present for order-based payments, which is all we
    // create), so an absent one is a contract violation rather than something to work around by
    // sending an empty string the backend would reject anyway.
    const signature = data.razorpay_signature;
    if (typeof signature !== 'string' || signature.length === 0) {
      throw new CheckoutFailedError(null, 'Checkout returned no signature to verify.');
    }

    return { providerPaymentId: data.razorpay_payment_id, signature };
  },
};
