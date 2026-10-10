/**
 * The login number rules from dev note `1949:2203`.
 *
 * Valid = 10 digits starting with 6, 7, 8 or 9 (an Indian mobile). The backend accepts any E.164
 * number, so this is a CLIENT rule that only decides whether Get OTP is enabled; the server still
 * answers for the number it is sent.
 */

export const PHONE_DIGITS = 10;

/**
 * Typed, pasted or autofilled text → the national number.
 *
 * "On paste, strip spaces, dashes, +91 and a leading 0, then keep the last 10 digits." Keeping the
 * LAST ten handles all of those at once: `+91 98765-43210`, `09876543210` and `919876543210` all
 * reduce to `9876543210`, and ordinary typing (one digit at a time) is unaffected.
 */
export function normalizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(-PHONE_DIGITS);
}

/**
 * The field's next value from what the TextInput reports, given what it was showing.
 *
 * - Typing past 10 digits is ignored ("digits only, max 10"); only a PASTE (more than one
 *   character arriving at once) keeps the last 10, which is what strips +91 or a leading 0.
 * - The field shows a complete number grouped as "98765 43210" (`1945:1526`). Backspacing over
 *   that space would leave the digits unchanged, so it deletes the digit before it instead.
 */
export function nextPhoneDigits(previousDigits: string, previousDisplay: string, text: string) {
  const digits = text.replace(/\D/g, '');
  if (text.length - previousDisplay.length > 1) return digits.slice(-PHONE_DIGITS);
  if (digits === previousDigits && text.length < previousDisplay.length) {
    return previousDigits.slice(0, -1);
  }
  return digits.slice(0, PHONE_DIGITS);
}

/** "98765 43210" once all 10 digits are in; a partial number is shown as typed (`1940:7590`). */
export function displayDigits(digits: string): string {
  return formatNational(digits);
}

export function isValidMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}

/** `98765 43210` — the frame's grouping, for "Sent to +91 98765 43210". */
export function formatNational(digits: string): string {
  return digits.length === PHONE_DIGITS ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

/**
 * The E.164 string back to its display form. The dial code is passed in rather than parsed out,
 * because no pattern can split a country code from a national number without knowing the country.
 */
export function displayPhone(phoneE164: string, dialCode: string): string {
  if (dialCode.length === 0 || !phoneE164.startsWith(dialCode)) return phoneE164;
  return `${dialCode} ${formatNational(phoneE164.slice(dialCode.length))}`;
}
