import type { ApiClient } from '@core/api';
import { idempotencyHeader } from '@core/api';

import { paymentOrderSchema } from './schemas';
import type { PaymentOrderDto, RazorpayCheckoutResult } from './schemas';

/**
 * Payment endpoints.
 *
 * ## The rule this file exists to enforce
 *
 * Razorpay's client callback is NOT proof of payment. It is an untrusted message from a
 * third-party SDK running on a device the customer controls. The only thing that makes a payment
 * real is the BACKEND verifying the signature (and, independently, the webhook it receives from
 * Razorpay directly).
 *
 * So the flow is:
 *
 *   order  -> open checkout -> callback -> POST verify -> REFETCH THE BOOKING -> render its state
 *
 * and never:
 *
 *   callback -> show "Payment successful"
 *
 * `verify` returning 2xx is the backend's word, not the SDK's. Even then the client re-reads the
 * booking rather than assuming what the payment did to it.
 */

export const PAYMENT_PATHS = {
  order: (bookingId: string) => `/v1/bookings/${bookingId}/payments/order`,
  verify: (bookingId: string) => `/v1/bookings/${bookingId}/payments/verify`,
} as const;

export function createPaymentApi(api: ApiClient) {
  return {
    /**
     * `POST /v1/bookings/:id/payments/order` — 201 (`created`) or 202 (`processing`).
     *
     * Idempotent by key: a retry after an ambiguous failure returns the ORIGINAL order rather
     * than creating a second one against the same booking.
     */
    async createOrder(bookingId: string, scope: string): Promise<PaymentOrderDto> {
      return api.request(PAYMENT_PATHS.order(bookingId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: {},
        parse: (data) => paymentOrderSchema.parse(data),
      });
    },

    /**
     * `POST /v1/bookings/:id/payments/verify`.
     *
     * The two values come straight from Razorpay's checkout callback and are passed through
     * untouched. The client does not parse, validate or trust them — it forwards them to the one
     * party holding the secret that can check them.
     */
    async verify(
      bookingId: string,
      result: RazorpayCheckoutResult,
      scope: string,
    ): Promise<unknown> {
      return api.request(PAYMENT_PATHS.verify(bookingId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: {
          providerPaymentId: result.providerPaymentId,
          signature: result.signature,
        },
        parse: (data) => data,
      });
    },
  };
}

export type PaymentApi = ReturnType<typeof createPaymentApi>;

/**
 * The checkout SDK seam.
 *
 * ## Why this is not implemented
 *
 * Opening Razorpay checkout needs a NATIVE module (`react-native-razorpay`, or Razorpay's Expo
 * plugin). Adding one is a native dependency change: it requires `expo prebuild`, a Gradle
 * rebuild and a new APK on every reviewer's device, and §16 says to implement it only after the
 * dependency and configuration strategy is approved. That approval has not been given, so no
 * package was added.
 *
 * ## What is ready
 *
 * Everything either side of it. The order is created, the publishable key arrives with it, the
 * verify call is written, and the post-verify refetch is wired. Supplying an implementation of
 * this one function completes the flow with no other change.
 *
 * ## What must NOT happen instead
 *
 * A stub that resolves with a fabricated `providerPaymentId` and `signature` would make the app
 * claim a payment the customer never made, and the backend would reject it — so the default
 * implementation REFUSES rather than pretending.
 */
export interface CheckoutLauncher {
  open(input: {
    readonly keyId: string;
    readonly providerOrderId: string;
    readonly amountPaise: number;
    readonly currency: 'INR';
    readonly description: string;
    readonly prefill?: { readonly contact?: string; readonly name?: string };
  }): Promise<RazorpayCheckoutResult>;
}

export class CheckoutUnavailableError extends Error {
  constructor() {
    super(
      'Razorpay checkout is not available in this build: no payment SDK is installed. ' +
        'See docs/BACKEND_INTEGRATION_MAP.md — FRONTEND_GAP: payment SDK.',
    );
    this.name = 'CheckoutUnavailableError';
  }
}

/** Fails closed. It is replaced, not edited, when the SDK is approved. */
export const unavailableCheckoutLauncher: CheckoutLauncher = {
  async open() {
    throw new CheckoutUnavailableError();
  },
};
