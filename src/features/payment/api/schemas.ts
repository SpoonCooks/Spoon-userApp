import { z } from 'zod';

/**
 * Payment DTOs — `POST /v1/bookings/:id/payments/order` and `.../verify`.
 *
 * ## The publishable key comes from the server, per order
 *
 * `keyId` is Razorpay's PUBLIC key. The backend returns it on every order rather than the app
 * embedding it, so rotating the key or moving between the test and live merchant accounts needs
 * no app release — and `EXPO_PUBLIC_RAZORPAY_KEY_ID` does not exist anywhere in this repo. The
 * SECRET never leaves the backend; it signs orders and verifies webhooks.
 *
 * `keyId` is nullable, and null is reachable in development only (staging and production fail
 * configuration validation without one). A null key means checkout cannot be opened, which the
 * caller must surface rather than paper over.
 */

export const paymentOrderSchema = z.object({
  paymentId: z.string(),
  provider: z.literal('razorpay'),
  /** Null while the order is still being created upstream (`status: 'processing'`). */
  providerOrderId: z.string().nullable(),
  amountPaise: z.number().int().nonnegative(),
  currency: z.literal('INR'),
  /**
   * `created` — the order exists and checkout may open.
   * `processing` — the backend is still creating it; the client polls or retries rather than
   * opening checkout against an order id it does not have.
   */
  status: z.enum(['created', 'processing']),
  keyId: z.string().nullable(),
});

export type PaymentOrderDto = z.infer<typeof paymentOrderSchema>;

/**
 * The verify response.
 *
 * Deliberately permissive: what matters to the client is that the call SUCCEEDED, because the
 * authoritative payment state is then read back from the booking. A 2xx here means the backend
 * checked the signature itself — it is not the client asserting that payment happened.
 */
export const paymentVerifySchema = z.unknown();

/** What Razorpay's checkout hands back and the backend needs to verify it. */
export interface RazorpayCheckoutResult {
  readonly providerPaymentId: string;
  readonly signature: string;
}
