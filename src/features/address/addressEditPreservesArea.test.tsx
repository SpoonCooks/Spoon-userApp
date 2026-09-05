import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { RuntimeProvider } from '@core/runtimeContext';
import type { AppRuntime } from '@core/runtime';
import { createStubApi, createTestRuntime, DEFAULT_API_STUBS } from '@/test/renderWithRuntime';

import { useAddressDetailsData } from './data';

/**
 * Editing a saved address must keep the address it is saved AT.
 *
 * A customer opened a saved address from the list, changed only its label, pressed Confirm and
 * got "Couldn't save address" — reproduced by the founder on 2026-09-01.
 *
 * `PUT /v1/me/addresses/:id` requires `street` and `pincode` alongside the point, and the form
 * took them from the map DRAFT. An edit opened from the list never goes through the map, so the
 * draft is empty: the request carried `pincode: ''`, the endpoint refuses that (`minLength: 5`),
 * and the screen showed its generic failure. The quieter half is worse — `street` fell back to
 * the BUILDING name, so a save that got past the pincode would have overwritten the street of an
 * address the customer was only relabelling.
 *
 * `savedPoint` already existed for exactly this reason. These cases pin the rest of the record
 * travelling with it.
 */

function wrapper(runtime: AppRuntime) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RuntimeProvider runtime={runtime}>
        <QueryClientProvider client={runtime.queryClient}>{children}</QueryClientProvider>
      </RuntimeProvider>
    );
  };
}

describe('an edit carries the saved address area, not an empty draft', () => {
  it('exposes the saved street, pincode, city and state for the address being edited', async () => {
    const runtime = createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) });
    const { result } = renderHook(() => useAddressDetailsData('addr-1'), {
      wrapper: wrapper(runtime),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    // The values the stub's saved address holds — the ones the endpoint requires back.
    expect(result.current.savedArea).toEqual({
      street: 'Silver County Road',
      pincode: '560102',
      city: 'Bengaluru',
      state: 'Karnataka',
    });
    // The point was always carried; the area now travels with it.
    expect(result.current.savedPoint).not.toBeNull();
  });

  it('has no saved area when adding, because there is no record to take one from', async () => {
    const runtime = createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) });
    const { result } = renderHook(() => useAddressDetailsData(null), {
      wrapper: wrapper(runtime),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(result.current.savedArea).toBeNull();
  });

  it('never yields an empty pincode for a saved address', async () => {
    // The precise shape the endpoint rejected. `''` is not a pincode, and a save built from this
    // hook must not be able to produce one for a record that has a real one stored.
    const runtime = createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) });
    const { result } = renderHook(() => useAddressDetailsData('addr-1'), {
      wrapper: wrapper(runtime),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(result.current.savedArea?.pincode).not.toBe('');
    expect((result.current.savedArea?.pincode ?? '').length).toBeGreaterThanOrEqual(5);
  });
});
