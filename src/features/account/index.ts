/**
 * Feature: account.
 *
 * Reached from Profile's "Manage account" row (superseded Ruling R-6 in `@features/profile`):
 * Terms of Service and Privacy Policy (both opened via `@features/legal`'s existing in-app
 * routes), and Delete Account, which opens `DeleteAccountSheet` for a No/Yes confirmation.
 *
 * BACKEND_GAP: account deletion has no endpoint yet. See `AccountDeletionUnavailableError` in
 * `data.ts` and `docs/FRONTEND_BACKEND_PENDING.md`.
 */
export { AccountView } from './screens/AccountScreen';
export type { AccountActions, AccountViewProps } from './screens/AccountScreen';
export { DeleteAccountSheet } from './components/DeleteAccountSheet';
export type { DeleteAccountSheetProps } from './components/DeleteAccountSheet';
export { AccountDeletionUnavailableError, useDeleteAccount } from './data';
