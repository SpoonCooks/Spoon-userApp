import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useUpdateProfile } from './hooks';
import { authKeys } from './keys';
import { bookingKeys } from '@features/booking';

/**
 * The dietary answer drives the assigned-cook card's veg/mixed projection SERVER-SIDE, so a
 * profile save must refetch bookings as well as `/me`. Without the booking invalidation the
 * card keeps rendering the variant of the answer the customer just changed away from, until
 * some unrelated refetch happens to land — the staleness this test exists to forbid.
 */

jest.mock('@core/runtimeContext', () => ({
  useRuntime: () => ({ api: {} }),
}));

const mockUpdateProfile = jest.fn();
jest.mock('./authApi', () => ({
  createAuthApi: () => ({ updateProfile: (patch: unknown) => mockUpdateProfile(patch) }),
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
