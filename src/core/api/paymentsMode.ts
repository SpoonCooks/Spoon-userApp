import { Platform } from 'react-native';

/**
 * Which Razorpay account the backend opens a NEW payment on (backend DEC-092).
 *
 * The Android build asks for the live account; iOS sends nothing and stays on the default (test)
 * account while it is in App Store review. The backend decides in the end: it also needs its live
 * keys configured and keeps excluded customers (the review demo account, internal testers) on the
 * default account. A payment never changes account after it is created, so retries and verify
 * calls need no header. Sent only on the three order-creating calls: booking payment, tip and
 * extension.
 */
export const PAYMENTS_MODE_HEADER = 'X-Spoon-Payments';

export function paymentsModeHeader(os: string = Platform.OS): Record<string, string> {
  return os === 'android' ? { [PAYMENTS_MODE_HEADER]: 'live' } : {};
}
