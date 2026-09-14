/**
 * Feature: account.
 *
 * Reached from Profile's "Manage account" row (superseded Ruling R-6 in `@features/profile`):
 * Terms of Service and Privacy Policy (both opened via `@features/legal`'s existing in-app
 * routes), and Delete Account — a No/Yes sheet, then the Login OTP screen (`@features/auth`'s
 * `OtpScreen`, reused as-is) at `/account/delete-otp` to confirm.
 *
 * Deletion is instant, self-serve and irreversible: `DELETE /v1/me` takes the typed code, and by
 * the time it answers the account is gone and every session on every device is revoked. Bookings,
 * payments and refunds are RETAINED for eight years under Indian tax law with the name and number
 * stripped — which is why no copy in this feature may say "all your data will be deleted".
 */
export { AccountView } from './screens/AccountScreen';
export type { AccountActions, AccountViewProps } from './screens/AccountScreen';
export { DeleteAccountSheet } from './components/DeleteAccountSheet';
export type { DeleteAccountSheetProps } from './components/DeleteAccountSheet';
export {
  accountDeletionScope,
  useConfirmAccountDeletion,
  useRequestAccountDeletionOtp,
} from './data';
export type { ConfirmAccountDeletionInput } from './data';
export { deletionFailureView } from './deletionError';
export type {
  DeletionBlockTarget,
  DeletionBlockedNotice,
  DeletionFailureView,
} from './deletionError';
export { ACCOUNT_PATHS, createAccountApi, deleteAccountResponseSchema } from './api';
export type { AccountApi, DeleteAccountResponse } from './api';
