import { useMutation } from '@tanstack/react-query';

/**
 * Account deletion, confirmed by an OTP step that reuses the Login OTP screen (`@features/auth`).
 *
 * BACKEND_GAP (`docs/FRONTEND_BACKEND_PENDING.md`): no endpoint exists for either half of this —
 * there is no `DELETE /v1/me` (or equivalent), and there is no way to send a deletion-confirmation
 * code that isn't the login flow's `POST /v1/auth/otp/send` / `verify`. Those two are inseparable
 * from session sign-in: `useVerifyOtp` (`@features/auth`) rotates the session's tokens on success,
 * so reusing it here would silently re-authenticate the customer as a side effect of confirming a
 * deletion, rather than gating one. Reusing them was rejected for that reason.
 *
 * `useRequestAccountDeletionOtp` resolves LOCALLY, with no network call, purely so the OTP screen
 * can be reached and exercised end to end. That is a deliberately small thing to fake — no data
 * changes and nothing customer-facing is misrepresented as done. `useConfirmAccountDeletion` is
 * the customer-facing gate that actually matters, and it fails closed: nothing here can tell the
 * customer their account was deleted when it was not.
 */
export class AccountDeletionUnavailableError extends Error {
  constructor() {
    super("Deleting your account isn't available yet. Please contact support.");
    this.name = 'AccountDeletionUnavailableError';
  }
}

export interface AccountDeletionOtpRequest {
  readonly retryAfterSeconds: number;
}

/** Stands in for `POST /v1/auth/otp/send` until a deletion-specific endpoint exists. */
export function useRequestAccountDeletionOtp() {
  return useMutation<AccountDeletionOtpRequest, Error, void>({
    async mutationFn() {
      return { retryAfterSeconds: 30 };
    },
  });
}

/** Stands in for `POST /v1/auth/otp/verify` + `DELETE /v1/me` until both exist. */
export function useConfirmAccountDeletion() {
  return useMutation<void, AccountDeletionUnavailableError, string>({
    async mutationFn(_otp) {
      throw new AccountDeletionUnavailableError();
    },
  });
}
