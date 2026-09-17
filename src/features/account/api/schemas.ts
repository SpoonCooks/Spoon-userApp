import { z } from 'zod';

/**
 * Wire shapes for account deletion — `DELETE /v1/me`.
 *
 * The reply is the server's acknowledgement, not a projection of anything: by the time it lands
 * the account is gone, every session and refresh token is revoked, and the phone number is free
 * for a fresh signup. It is parsed rather than ignored so that a 200 carrying something OTHER
 * than a completed deletion is caught at the boundary instead of being read as success.
 */
export const deleteAccountResponseSchema = z.object({
  deleted: z.boolean(),
});

export type DeleteAccountResponse = z.infer<typeof deleteAccountResponseSchema>;

/**
 * `POST /v1/me/account-deletion/otp`.
 *
 * The same envelope `POST /v1/auth/otp/send` answers with, declared here rather than imported
 * from auth for the reason `ACCOUNT_PATHS` states about the path: the two features own different
 * things, and sharing a schema would make a change to login's reply a change to deletion's.
 *
 * `retryAfterSeconds` is this endpoint's OWN cooldown, independent of login's since the backend
 * scoped the limit to (phone, purpose). It is what the delete sheet counts down; a client
 * constant would be a guess at a number the server already states.
 */
export const deletionOtpResponseSchema = z.object({
  accepted: z.boolean(),
  retryAfterSeconds: z.number().int().nonnegative(),
});

export type DeletionOtpResponse = z.infer<typeof deletionOtpResponseSchema>;
