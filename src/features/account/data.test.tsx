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

const mockSendOtp = jest.fn();
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

/*
 * `toE164` is the REAL one — it is the thing under test in the first two cases below. It is taken
 * from its own module rather than through `jest.requireActual` on the barrel: that barrel reaches
 * auth -> booking -> address -> auth, and pulling the whole cycle into a mock factory deadlocks
 * the require graph. `authApi.ts` itself imports only the transport.
 */
jest.mock('@features/auth', () => ({
  toE164: jest.requireActual('../auth/api/authApi').toE164,
  createAuthApi: () => ({
    sendOtp: (phone: string, options: unknown) => mockSendOtp(phone, options),
  }),
}));

jest.mock('./api', () => ({
  createAccountApi: () => ({
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
  mockSendOtp.mockResolvedValue({ accepted: true, retryAfterSeconds: 30 });
  mockDeleteAccount.mockResolvedValue({ deleted: true });
  mockSignOut.mockResolvedValue(undefined);
});

describe('requesting the code', () => {
  /**
   * The number comes from `GET /v1/me`, whose schema bounds it with nothing, and goes to
   * `otp/send`, which bounds it with `^\+[1-9][0-9]{7,14}$`. A number that ever arrives spaced
   * would fail as INVALID_REQUEST — and on this screen that reads as "we couldn't send a code",
   * with no way for the customer to ever delete their account.
   */
  it('normalises a spaced number the server handed back', async () => {
    const { result } = renderHook(() => useRequestAccountDeletionOtp(), { wrapper });

    result.current.mutate('+91 98765 43210');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSendOtp).toHaveBeenCalledWith('+919876543210', {
      audience: 'customer',
      authenticated: true,
    });
  });

  it('leaves an already-E.164 number untouched', async () => {
    const { result } = renderHook(() => useRequestAccountDeletionOtp(), { wrapper });

    result.current.mutate('+919876543210');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSendOtp.mock.calls[0]?.[0]).toBe('+919876543210');
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
