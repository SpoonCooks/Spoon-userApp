import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useUpdateProfile, useVerifyOtp } from './hooks';
import { authKeys } from './keys';
import { bookingKeys } from '@features/booking';

/**
 * The dietary answer drives the assigned-cook card's veg/mixed projection SERVER-SIDE, so a
 * profile save must refetch bookings as well as `/me`. Without the booking invalidation the
 * card keeps rendering the variant of the answer the customer just changed away from, until
 * some unrelated refetch happens to land — the staleness this test exists to forbid.
 */

const mockSignIn = jest.fn();
const mockLoggerWarn = jest.fn();
jest.mock('@core/runtimeContext', () => ({
  useRuntime: () => ({
    api: {},
    authApi: {},
    session: { signIn: (tokens: unknown) => mockSignIn(tokens) },
    logger: { warn: (...args: unknown[]) => mockLoggerWarn(...args) },
  }),
}));

const mockUpdateProfile = jest.fn();
const mockVerifyOtp = jest.fn();
jest.mock('./authApi', () => ({
  createAuthApi: () => ({
    updateProfile: (patch: unknown) => mockUpdateProfile(patch),
    verifyOtp: (input: unknown) => mockVerifyOtp(input),
  }),
}));

const mockGetDeviceId = jest.fn();
const mockWriteLastPhone = jest.fn();
jest.mock('@core/auth', () => ({
  getDeviceId: () => mockGetDeviceId(),
  writeLastPhone: (phone: string) => mockWriteLastPhone(phone),
}));

describe('useUpdateProfile invalidation', () => {
  it('invalidates the profile AND every booking read on success', async () => {
    mockUpdateProfile.mockResolvedValue({ name: 'Aarav', dietaryPreference: 'vegetarian' });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidated = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    result.current.mutate({ name: 'Aarav', dietaryPreference: 'vegetarian' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = invalidated.mock.calls.map(([filters]) => filters?.queryKey);
    expect(keys).toContainEqual(authKeys.me());
    // The booking invalidation is what makes the cook card follow the stored answer: the
    // variant itself stays a server decision, refetched rather than re-derived on-device.
    expect(keys).toContainEqual(bookingKeys.all());
  });
});

/**
 * `useVerifyOtp` is also where the Login prefill (`core/auth/lastPhoneStore`) gets written —
 * right after the session hand-off, same reasoning as storing tokens before resolving (see the
 * hook's own doc comment): the sign-in already succeeded, so remembering the number for next
 * time must never be what turns that success into an error the customer sees.
 */
describe('useVerifyOtp', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };

  beforeEach(() => {
    mockSignIn.mockReset().mockResolvedValue(undefined);
    mockLoggerWarn.mockReset();
    mockGetDeviceId.mockReset().mockResolvedValue('dev-1');
    mockWriteLastPhone.mockReset().mockResolvedValue(undefined);
    mockVerifyOtp.mockReset().mockResolvedValue({
      accessToken: 'access-abc',
      refreshToken: 'refresh-xyz',
      accessTokenExpiresAt: '2030-01-01T00:00:00.000Z',
    });
  });

  it('remembers the verified number for next time, after the session hand-off', async () => {
    const { result } = renderHook(() => useVerifyOtp(), { wrapper });

    result.current.mutate({ phone: '+919876543210', otp: '333333' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSignIn).toHaveBeenCalled();
    expect(mockWriteLastPhone).toHaveBeenCalledWith('+919876543210');
  });

  it('still reports sign-in as successful when remembering the number fails', async () => {
    mockWriteLastPhone.mockRejectedValue(new Error('disk full'));
    const { result } = renderHook(() => useVerifyOtp(), { wrapper });

    result.current.mutate({ phone: '+919876543210', otp: '333333' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockLoggerWarn).toHaveBeenCalled();
  });
});
