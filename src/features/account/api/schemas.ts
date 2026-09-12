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
