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
 * Headless session machinery (the machine, the token store, the controller) lives in
 * `@core/auth` because it is cross-cutting. This module owns the auth SCREENS, the auth
 * ENDPOINTS and the adapter between them.
 *
 * `createSessionGateway` is exported from here rather than from `@core/auth` because it is the
 * only piece of session machinery that knows a URL: `POST /v1/auth/refresh`. Keeping the endpoint
 * with the other endpoints means there is exactly one description of the auth contract in the
 * codebase, and the composition root wires the two halves together.
 */

export { LoginScreen } from './screens/LoginScreen';
export type { LoginScreenProps } from './screens/LoginScreen';
export { OtpScreen } from './screens/OtpScreen';
export type { OtpScreenProps } from './screens/OtpScreen';
export type { LoginViewModel, OtpViewModel } from './types';

export {
  AUTH_PATHS,
  authKeys,
  createAuthApi,
  createSessionGateway,
  loginWithError,
  meResponseSchema,
  otpViewModel,
  otpWithError,
  resendLabelFor,
  profileDataSchema,
  sentToLabelFor,
  toE164,
  updateProfileResponseSchema,
  useMe,
  useSendOtp,
  useSignOut,
  useUpdateProfile,
  useVerifyOtp,
} from './api';
export type {
  AuthApi,
  AuthUser,
  MeResponse,
  OtpSendResponse,
  OtpVerifyResponse,
  ProfileData,
  ProfileUpdateRequest,
} from './api';
