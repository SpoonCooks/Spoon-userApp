import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useConfirmAccountDeletion, useRequestAccountDeletionOtp } from './data';

/**
 * The two halves of a deletion, at the seam where they can fail silently.
 *
 * Both hooks are mocked at their API modules rather than at the transport: the request SHAPES are
 * already pinned by `api/accountApi.test.ts` and `@features/auth`'s `authApi.test.ts`. What is
 * asserted here is what those files cannot see — what the hook does to its inputs on the way out,
 * and what it does to this device on the way back.
 */

const mockRequestDeletionOtp = jest.fn();
const mockDeleteAccount = jest.fn();
const mockSignOut = jest.fn();
const mockWarn = jest.fn();

jest.mock('@core/runtimeContext', () => ({
  useRuntime: () => ({
    api: {},
    session: { signOut: () => mockSignOut() },
    logger: { warn: (...args: unknown[]) => mockWarn(...args) },
  }),
}));

jest.mock('./api', () => ({
  createAccountApi: () => ({
    requestDeletionOtp: () => mockRequestDeletionOtp(),
    deleteAccount: (otp: string, scope: string) => mockDeleteAccount(otp, scope),
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequestDeletionOtp.mockResolvedValue({ accepted: true, retryAfterSeconds: 30 });
  mockDeleteAccount.mockResolvedValue({ deleted: true });
  mockSignOut.mockResolvedValue(undefined);
});

describe('requesting the code', () => {
  /**
   * This used to go through `auth.sendOtp` — the endpoint LOGIN uses — whose 30-second cooldown
   * was keyed on the phone alone. Deletion is only reachable while signed in, so login's send
   * always came first and the customer's FIRST press was refused `RATE_LIMITED`. The fix is a
   * different endpoint with its own cooldown, so what this pins is that the hook no longer
   * reaches for auth's.
   */
  it('asks the deletion endpoint, not the one login shares', async () => {
    const { result } = renderHook(() => useRequestAccountDeletionOtp(), { wrapper });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRequestDeletionOtp).toHaveBeenCalledTimes(1);
  });

  /**
   * And sends NOTHING with it. The account is the one holding the session, so a phone read off
   * `GET /v1/me` — whose schema bounds it with nothing — can no longer arrive spaced and fail as
   * INVALID_REQUEST, which on this screen read as "we couldn't send a code" with no way for the
   * customer to ever delete their account. A number never sent cannot be malformed.
   */
  it('sends no phone number with it', async () => {
    const { result } = renderHook(() => useRequestAccountDeletionOtp(), { wrapper });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRequestDeletionOtp).toHaveBeenCalledWith();
  });

  /** The cooldown the delete sheet counts down is the server's, not a client constant. */
  it('carries the server cooldown back to the caller', async () => {
    mockRequestDeletionOtp.mockResolvedValue({ accepted: true, retryAfterSeconds: 45 });
    const { result } = renderHook(() => useRequestAccountDeletionOtp(), { wrapper });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.retryAfterSeconds).toBe(45);
  });
});

describe('confirming the deletion', () => {
  it('forgets this device once the server has confirmed', async () => {
    const { result } = renderHook(() => useConfirmAccountDeletion(), { wrapper });

    result.current.mutate({ otp: '123456', scope: 'account:delete:usr_1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDeleteAccount).toHaveBeenCalledWith('123456', 'account:delete:usr_1');
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  /**
   * Everything past the 200 is best effort. The account is already gone, so a SecureStore failure
   * must not be reported as a deletion failure — that would tell a customer their account
   * survived when it did not, and invite a retry whose idempotency key has already been released.
   */
  it('still reports success when the local teardown fails', async () => {
    mockSignOut.mockRejectedValue(new Error('keystore unavailable'));
    const { result } = renderHook(() => useConfirmAccountDeletion(), { wrapper });

    result.current.mutate({ otp: '123456', scope: 'account:delete:usr_1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockWarn).toHaveBeenCalled();
  });

  /** A reply that does not confirm the deletion is a failure, and nothing is torn down. */
  it('keeps the customer signed in when the server does not confirm', async () => {
    mockDeleteAccount.mockResolvedValue({ deleted: false });
    const { result } = renderHook(() => useConfirmAccountDeletion(), { wrapper });

    result.current.mutate({ otp: '123456', scope: 'account:delete:usr_1' });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('does not sign anyone out when the delete call itself fails', async () => {
    mockDeleteAccount.mockRejectedValue({ kind: 'validation', message: 'bad code' });
    const { result } = renderHook(() => useConfirmAccountDeletion(), { wrapper });

    result.current.mutate({ otp: '000000', scope: 'account:delete:usr_1' });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
