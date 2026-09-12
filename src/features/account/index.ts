/**
 * Feature: account.
 *
 * Reached from Profile's "Manage account" row (superseded Ruling R-6 in `@features/profile`):
 * Terms of Service and Privacy Policy (both opened via `@features/legal`'s existing in-app
 * routes), and Delete Account, which opens `DeleteAccountSheet` for a No/Yes confirmation, then
 * hands off to the Login OTP screen (`@features/auth`'s `OtpScreen`, reused as-is) at
 * `/account/delete-otp` to confirm the deletion.
 *
 * BACKEND_GAP: neither half of this has an endpoint yet — no deletion-confirmation OTP send/verify,
 * and no `DELETE /v1/me`. See `data.ts` and `docs/FRONTEND_BACKEND_PENDING.md`.
 */
export { AccountView } from './screens/AccountScreen';
export type { AccountActions, AccountViewProps } from './screens/AccountScreen';
export { DeleteAccountSheet } from './components/DeleteAccountSheet';
export type { DeleteAccountSheetProps } from './components/DeleteAccountSheet';
export {
  AccountDeletionUnavailableError,
  useConfirmAccountDeletion,
  useRequestAccountDeletionOtp,
} from './data';
export type { AccountDeletionOtpRequest } from './data';
