import { Platform } from 'react-native';

/**
 * Which Razorpay account the backend opens a NEW payment on (backend DEC-092).
 *
 * Android and iOS both ask for the live account. iOS sent nothing while the app was in App Store
 * review; it was released on 20 Oct 2026 and now asks too. The backend decides in the end: it
 * also needs its live keys configured and keeps excluded customers (the review demo account,
 * internal testers) on the default (test) account, which is how App Review keeps working. A payment never changes account after it is created, so retries and verify
 * calls need no header. Sent only on the three order-creating calls: booking payment, tip and
 * extension.
 */
export const PAYMENTS_MODE_HEADER = 'X-Spoon-Payments';

export function paymentsModeHeader(os: string = Platform.OS): Record<string, string> {
  return os === 'android' || os === 'ios' ? { [PAYMENTS_MODE_HEADER]: 'live' } : {};
}
