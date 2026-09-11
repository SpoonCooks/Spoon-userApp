import { useMutation } from '@tanstack/react-query';

/**
 * Account deletion.
 *
 * BACKEND_GAP (`docs/FRONTEND_BACKEND_PENDING.md`): no endpoint exists for this yet — there is no
 * `DELETE /v1/me` (or equivalent) in the audited contract, and the bundled Privacy Policy copy
 * ("Account deletion requests are processed within 30 days") suggests this may end up being a
 * queued request rather than an immediate delete, which is a product decision this app cannot
 * make on the backend's behalf. Nothing is sent over the network here: a guessed endpoint could
 * 404 silently or, worse, appear to succeed against the wrong resource, either of which would
 * misrepresent whether the customer's account was actually deleted.
 *
 * The UI is built and wired to this hook so that only the `mutationFn` needs to change once the
 * contract exists.
 */
export class AccountDeletionUnavailableError extends Error {
  constructor() {
    super("Deleting your account isn't available yet. Please contact support.");
    this.name = 'AccountDeletionUnavailableError';
  }
}

export function useDeleteAccount() {
  return useMutation<void, AccountDeletionUnavailableError, void>({
    async mutationFn() {
      throw new AccountDeletionUnavailableError();
    },
  });
}
