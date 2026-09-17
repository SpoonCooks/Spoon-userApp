import type { ApiClient } from '@core/api';
import { idempotencyHeader } from '@core/api';

import { deleteAccountResponseSchema, deletionOtpResponseSchema } from './schemas';
import type { DeleteAccountResponse, DeletionOtpResponse } from './schemas';

/**
 * The account-lifecycle endpoints, as functions.
 *
 * `DELETE /v1/me` is the same resource `GET /v1/me` reads, which is why the path is stated here
 * rather than imported from `AUTH_PATHS`: the two features own different verbs on it, and an
 * import would tie account deletion's contract to auth's.
 */
export const ACCOUNT_PATHS = {
  me: '/v1/me',
  /**
   * The deletion code's OWN send.
   *
   * It used to go through `POST /v1/auth/otp/send`, which login also uses. That endpoint's
   * 30-second cooldown was keyed on the phone number alone and could not tell the two intents
   * apart -- and deletion can only be asked for while signed in, so login's send always preceded
   * it by seconds. The customer's FIRST press of Delete Account was refused `RATE_LIMITED`,
   * having attempted nothing. Reproduced against production: two sends seconds apart, 202 then
   * 429.
   *
   * This endpoint carries its own cooldown. It takes an EMPTY body -- the phone is resolved from
   * the session, so the client neither sends nor needs one -- and answers with the same envelope
   * `otp/send` does, which is why the response schema is shared rather than copied.
   */
  deletionOtp: '/v1/me/account-deletion/otp',
} as const;

export function createAccountApi(api: ApiClient) {
  return {
    /**
     * `POST /v1/me/account-deletion/otp` -- the code `deleteAccount` below spends.
     *
     * Authenticated with no body: the account being deleted is the one holding the session, and
     * accepting a phone here would let a caller name an account that is not theirs.
     */
    async requestDeletionOtp(): Promise<DeletionOtpResponse> {
      return api.request(ACCOUNT_PATHS.deletionOtp, {
        method: 'POST',
        body: {},
        parse: (data) => deletionOtpResponseSchema.parse(data),
      });
    },

    /**
     * `DELETE /v1/me` — instant, self-serve, irreversible.
     *
     * ## The OTP
     *
     * The code is passed STRAIGHT THROUGH; it is never verified first. `POST /v1/auth/otp/verify`
     * would consume the code and mint a fresh session as a side effect, so calling it here would
     * both spend the one-time code this endpoint needs and re-authenticate a customer who is in
     * the middle of deleting themselves. This endpoint verifies the code itself.
     *
     * ## The idempotency key
     *
     * `scope` names the INTENT, not the attempt, and the same key must survive every retry of it
     * — a wrong code, a block, a timeout, a 5xx. The backend hashes an EMPTY body against the key
     * (the OTP is deliberately not part of the hash) and marks a failed attempt `failed_retryable`,
     * so re-sending the same key with a corrected code is processed normally rather than replaying
     * the failure. A key is only retired when the customer leaves the flow and starts over; see
     * `useConfirmAccountDeletion`.
     *
     * The key itself must match `^[A-Za-z0-9._~-]{8,128}$` server-side — narrower than the 200-char
     * printable-ASCII ceiling the transport allows, and narrow enough to exclude base64/nanoid
     * alphabets. `createIdempotencyKey` satisfies it; `idempotency.test.ts` pins that.
     */
    async deleteAccount(otp: string, scope: string): Promise<DeleteAccountResponse> {
      return api.request(ACCOUNT_PATHS.me, {
        method: 'DELETE',
        headers: idempotencyHeader(scope),
        body: { otp },
        parse: (data) => deleteAccountResponseSchema.parse(data),
      });
    },
  };
}

export type AccountApi = ReturnType<typeof createAccountApi>;
