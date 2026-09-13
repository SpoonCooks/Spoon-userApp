import { useMutation } from '@tanstack/react-query';

import { idempotency } from '@core/api';
import { useRuntime } from '@core/runtimeContext';
import { addressDraftStore } from '@core/store/addressDraftStore';
import { bookingDraftStore } from '@core/store/bookingDraftStore';
import { createAuthApi, toE164 } from '@features/auth';
import type { OtpSendResponse } from '@features/auth';

import { createAccountApi } from './api';

/**
 * Account deletion — instant, self-serve and irreversible.
 *
 * Two calls, in this order:
 *
 *   1. `POST /v1/auth/otp/send` — Login's endpoint, asked with `audience: 'customer'` and with
 *      the caller's bearer token attached. See `SendOtpOptions` in `@features/auth` for why the
 *      token is worth attaching to a route that never reads it.
 *   2. `DELETE /v1/me` — carries the typed code. It verifies the code ITSELF; the code is never
 *      put through `otp/verify` first, which would consume it and mint a new session.
 *
 * The phone number is the account's own, read from `GET /v1/me` by the caller and passed in. It
 * is never typed by the customer and never inferred from the session: `otp/send` texts whatever
 * number is in the body, so the number has to be one the app read back from the server.
 */

/** Names the deletion INTENT for the idempotency store. One customer, one live attempt. */
export function accountDeletionScope(userId: string): string {
  return `account:delete:${userId}`;
}

export function useRequestAccountDeletionOtp() {
  const { api } = useRuntime();
  const auth = createAuthApi(api);

  return useMutation<OtpSendResponse, Error, string>({
    /*
     * Normalised even though the number came from the server, for the same reason
     * `addressApi.create` normalises a stored `receiverPhone`: `otp/send` bounds `phone` with
     * `^\+[1-9][0-9]{7,14}$`, `meResponseSchema` bounds it with nothing at all, and a number that
     * ever arrives spaced would fail as INVALID_REQUEST — surfacing as "we couldn't send a code"
     * with no way for the customer to ever delete their account. `toE164` is idempotent on a
     * number that is already E.164, so this costs nothing when the server is well behaved.
     */
    mutationFn: (phone: string) =>
      auth.sendOtp(toE164(phone), { audience: 'customer', authenticated: true }),
  });
}

export interface ConfirmAccountDeletionInput {
  readonly otp: string;
  /** From `accountDeletionScope`. Held across every retry of one attempt; see `accountApi`. */
  readonly scope: string;
}

/**
 * `DELETE /v1/me`.
 *
 * The local teardown is deliberately NOT `useSignOut`: that revokes the session server-side
 * first, and after a successful deletion there is no session left to revoke — the call would
 * 401 against an account that no longer exists. Everything the server had to kill is already
 * dead by the time this resolves, so the client only has to forget: `session.signOut()` clears
 * SecureStore and the whole query cache, the session machine flips to unauthenticated, and the
 * app shell redirects itself to Login.
 *
 * Unlike sign-out, the teardown is conditional on the call SUCCEEDING: a failed deletion must
 * leave the customer signed in and on the screen, with the reason visible, because signing them
 * out of an account that still exists would read as "it worked". Once the server has confirmed,
 * though, the teardown can no longer fail the mutation — see the best-effort note below.
 */
export function useConfirmAccountDeletion() {
  const { api, session, logger } = useRuntime();
  const account = createAccountApi(api);

  return useMutation<void, Error, ConfirmAccountDeletionInput>({
    async mutationFn({ otp, scope }) {
      const result = await account.deleteAccount(otp, scope);

      /*
       * A 200 that does not say the account is gone is not a success — nothing is torn down and
       * the customer stays signed in rather than being sent to Login on a deletion the server did
       * not confirm. This message is for a developer reading a log: the screen renders the shared
       * "something went wrong" copy for it, because a reply this shape means the CONTRACT moved
       * and there is nothing useful to tell a customer about that.
       */
      if (!result.deleted) {
        throw new Error('DELETE /v1/me returned 200 without confirming the deletion');
      }

      // The intent is finished, so the key retires with it: a later attempt is a NEW intent and
      // must not replay this one's completed record.
      idempotency.release(scope);

      // `signOut` clears SecureStore and the query cache. The two draft stores are outside both
      // — they are in-memory and would not survive a restart, but the customer does not restart:
      // they land on Login in the same running app, where a half-finished booking or address
      // belongs to an account that no longer exists.
      bookingDraftStore.clear();
      addressDraftStore.clear();

      /*
       * Everything past the 200 is BEST EFFORT, and deliberately cannot fail the mutation.
       *
       * The account is already gone and every token is already revoked server-side; the only
       * thing left is for this device to forget. If clearing SecureStore throws, the deletion
       * still happened — reporting it as a failure would tell a customer their account survived
       * when it did not, and invite a retry whose key has already been released. The stale
       * tokens it would leave behind are dead, so the next authenticated call 401s and the
       * global handler signs them out anyway.
       */
      try {
        await session.signOut();
      } catch (error) {
        logger.warn('Local teardown failed after the account was deleted', {
          error: String(error),
        });
      }
    },
  });
}
