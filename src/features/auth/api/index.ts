export { AUTH_PATHS, createAuthApi, toE164 } from './authApi';
export type { AuthApi } from './authApi';
export { createSessionGateway } from './sessionGateway';
export {
  authUserSchema,
  meResponseSchema,
  otpSendResponseSchema,
  otpVerifyResponseSchema,
  profileDataSchema,
  refreshResponseSchema,
  sessionTokensSchema,
  updateProfileResponseSchema,
} from './schemas';
export type {
  AuthUser,
  MeResponse,
  OtpSendResponse,
  OtpVerifyResponse,
  ProfileData,
  ProfileUpdateRequest,
  SessionTokensDto,
} from './schemas';
export { authKeys } from './keys';
export { useMe, useSendOtp, useSignOut, useUpdateProfile, useVerifyOtp } from './hooks';
export {
  loginWithError,
  otpViewModel,
  otpWithError,
  resendLabelFor,
  sentToLabelFor,
} from './adapters';
