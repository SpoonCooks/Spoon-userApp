import type { ApiClient } from '@core/api';
import { idempotencyHeader } from '@core/api';

import { deleteAccountResponseSchema } from './schemas';
import type { DeleteAccountResponse } from './schemas';

/**
 * The account-lifecycle endpoints, as functions.
 *
 * `DELETE /v1/me` is the same resource `GET /v1/me` reads, which is why the path is stated here
 * rather than imported from `AUTH_PATHS`: the two features own different verbs on it, and an
 * import would tie account deletion's contract to auth's.
 */
export const ACCOUNT_PATHS = {
  me: '/v1/me',
} as const;

export function createAccountApi(api: ApiClient) {
  return {
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
