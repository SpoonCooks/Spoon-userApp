/**
 * The OTP screen's Back / Edit "go back to the login screen with the number prefilled and the
 * keyboard open". Login stays mounted under the OTP screen, so the number is still there; this
 * one-shot flag tells it to bring the keyboard back on its next focus (and not after, say, a trip
 * to the Terms page).
 *
 * The request expires: when the OTP screen was opened WITHOUT Login under it (a cold start into
 * `/otp`), Back lands somewhere else, and a flag left pending would make a much later Login steal
 * focus — even from an OTP screen pushed on top of it.
 */
const EXPIRES_MS = 1500;
let requestedAt: number | null = null;

export function requestPhoneEdit(): void {
  requestedAt = Date.now();
}

export function consumePhoneEdit(): boolean {
  const fresh = requestedAt !== null && Date.now() - requestedAt < EXPIRES_MS;
  requestedAt = null;
  return fresh;
}
