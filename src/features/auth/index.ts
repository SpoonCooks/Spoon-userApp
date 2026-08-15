import { createKeyFactory } from '@core/query';

/**
 * Feature: auth.
 *
 * Screens (NEW Figma `1kd1u3WEc00SENkToIPloW`):
 *   `53:174`  Page 17a Login No. — hero, logo lockup, tagline, pill phone field, legal footer
 *   `227:1649` Page 17b Login OTP — six-box code entry, resend line, "Verify & Proceed"
 *
 * The OTP screen's previous DESIGN_PENDING / B-7 status is OBSOLETE: it is now fully designed.
 * Ruling R-6: T&C / Privacy live in Profile; no additional legal UI is to be added to Login.
 *
 * Headless session machinery lives in `@core/auth` (it is cross-cutting). This module owns the
 * auth *screens* and their hooks only.
 * TODO(backend-contract): no auth endpoints or payloads exist.
 */
export const authKeys = createKeyFactory('auth');

export { LoginScreen } from './screens/LoginScreen';
export type { LoginScreenProps } from './screens/LoginScreen';
export { OtpScreen } from './screens/OtpScreen';
export type { OtpScreenProps } from './screens/OtpScreen';
export type { LoginViewModel, OtpViewModel } from './types';
