import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { RuntimeProvider } from '@core/runtimeContext';
import type { AppRuntime } from '@core/runtime';
import { useAddressDraftStore } from '@core/store/addressDraftStore';
import { createStubApi, createTestRuntime, DEFAULT_API_STUBS } from '@/test/renderWithRuntime';

import { useAddressDetailsData } from './data';

/**
 * Re-pinning a saved address has to be visible on the form that saves it.
 *
 * Reported from the handset on 2026-09-02: from `Complete address`, press `Change`, move the pin
 * to S-487 Shakarpur, press Confirm — and the Area row still read "Vikas Marg, New Delhi". Every
 * signal said the change had been discarded.
 *
 * It had not been. The save path takes the draft's point whenever there is one, so Confirm would
 * have written the new location; the Area row was the only thing disagreeing, because an edit read
 * its area from the SAVED record unconditionally.
 *
 * That rule guarded something real — a draft left over from an earlier session belongs to whatever
 * was last pinned, which for an edit opened from the list is a different address. The fix is not to
 * drop the guard but to use the same discriminator the save does: a draft carrying a POINT is this
 * session's map step.
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

describe('the Area row shows the point Confirm will save', () => {
  beforeEach(() => {
    useAddressDraftStore.getState().clear();
  });

  afterEach(() => {
    useAddressDraftStore.getState().clear();
  });

  it('shows the SAVED area for an edit that never went near the map', async () => {
    // The guard this rule exists for: an empty draft must not blank the row.
    const runtime = createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) });
    const { result } = renderHook(() => useAddressDetailsData('addr-1'), {
      wrapper: wrapper(runtime),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const view = result.current.state.status === 'ready' ? result.current.state.data : null;
    expect(view?.areaValue).toContain('Silver County Road');
  });

  it('shows the NEW area once the customer has re-pinned', async () => {
    // The reported bug. A draft with a point is this session's map step, whatever is saved.
    useAddressDraftStore.getState().setPoint({
      latitude: 28.6293,
      longitude: 77.2765,
      serviceable: true,
      street: 'Shakarpur',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110092',
    });

    const runtime = createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) });
    const { result } = renderHook(() => useAddressDetailsData('addr-1'), {
      wrapper: wrapper(runtime),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const view = result.current.state.status === 'ready' ? result.current.state.data : null;

    expect(view?.areaValue).toContain('Shakarpur');
    // And it must not still be showing the address the customer just moved away from.
    expect(view?.areaValue).not.toContain('Silver County Road');
  });

  it('keeps the saved area when a stale draft carries no point', async () => {
    // A draft with area text but NO coordinates is not a map step — it cannot have come from
    // Confirm, which always sets the point the server approved.
    useAddressDraftStore.getState().setPoint({ street: 'Somewhere Else', city: 'Nowhere' });

    const runtime = createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) });
    const { result } = renderHook(() => useAddressDetailsData('addr-1'), {
      wrapper: wrapper(runtime),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const view = result.current.state.status === 'ready' ? result.current.state.data : null;
    expect(view?.areaValue).toContain('Silver County Road');
    expect(view?.areaValue).not.toContain('Somewhere Else');
  });
});
