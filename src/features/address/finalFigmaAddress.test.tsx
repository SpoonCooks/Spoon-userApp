import { screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createStubApi, createTestRuntime, renderWithRuntime } from '@/test/renderWithRuntime';
import { useAddressDetailsData, useAddressGate } from './data';

/**
 * §4 (first-run routing) and §5 (edit prefill), asserted at the seam that decides both.
 *
 * These are the two behaviours the task singled out on the address flow, and both are decisions
 * about REAL saved data rather than about drawing — so they are tested here, on the hook, rather
 * than through a screen that would only be re-asserting `AddressDetailsForm`'s `useState`.
 */

const SAVED = {
  id: 'addr-7',
  label: 'Parents',
  flat: 'B-402',
  tower: null,
  society: 'Green Meadows',
  street: 'Indiranagar 100ft Road',
  pincode: '560038',
  city: 'Bengaluru',
  state: 'KA',
  hub_id: 'hub-1',
  receiverName: 'Asha',
  receiverPhone: '9876543210',
  isDefault: true,
  latitude: 12.97,
  longitude: 77.64,
  serviceability: {
    status: 'serviceable',
    reason: 'AVAILABLE',
    hub: { id: 'hub-1', name: 'Bengaluru Hub' },
  },
};

function runtimeWith(addresses: readonly unknown[]) {
  return createTestRuntime({
    api: createStubApi({ 'GET /v1/me/addresses': () => addresses }),
  });
}

/* --------------------------------------------------------------------------- §4 the gate */

function GateProbe() {
  return <Text testID="gate">{useAddressGate()}</Text>;
}

describe('useAddressGate — first-run routing (§4)', () => {
  it('requires onboarding when the customer has no address at all', async () => {
    renderWithRuntime(<GateProbe />, { runtime: runtimeWith([]) });

    await waitFor(() => expect(screen.getByTestId('gate').props.children).toBe('required'));
  });

  it('is satisfied once one exists', async () => {
    renderWithRuntime(<GateProbe />, { runtime: runtimeWith([SAVED]) });

    await waitFor(() => expect(screen.getByTestId('gate').props.children).toBe('satisfied'));
  });

  it('FAILS OPEN when the read errors — a network fault must not trap anyone in onboarding', async () => {
    const runtime = createTestRuntime({
      api: createStubApi({
        'GET /v1/me/addresses': () => {
          throw new Error('offline');
        },
      }),
    });
    renderWithRuntime(<GateProbe />, { runtime });

    await waitFor(() => expect(screen.getByTestId('gate').props.children).toBe('satisfied'));
  });
});

/* ------------------------------------------------------------------------ §5 edit prefill */

function DetailsProbe({ addressId }: { readonly addressId: string | null }) {
  const { state, savedPoint } = useAddressDetailsData(addressId);
  if (state.status !== 'ready') return <Text testID="status">{state.status}</Text>;

  return (
    <>
      <Text testID="flat">{state.data.flatValue ?? ''}</Text>
      <Text testID="building">{state.data.buildingValue ?? ''}</Text>
      <Text testID="receiver">{state.data.receiverName ?? ''}</Text>
      <Text testID="phone">{state.data.receiverPhone ?? ''}</Text>
      <Text testID="saveAs">{state.data.saveAsValue ?? ''}</Text>
      <Text testID="point">{savedPoint === null ? 'none' : `${savedPoint.latitude}`}</Text>
    </>
  );
}

describe('useAddressDetailsData — editing opens PREFILLED (§5)', () => {
  it('fills the form from the saved record, and carries its point for the update', async () => {
    renderWithRuntime(<DetailsProbe addressId="addr-7" />, { runtime: runtimeWith([SAVED]) });

    await waitFor(() => expect(screen.getByTestId('flat').props.children).toBe('B-402'));
    expect(screen.getByTestId('building').props.children).toBe('Green Meadows');
    expect(screen.getByTestId('receiver').props.children).toBe('Asha');
    expect(screen.getByTestId('phone').props.children).toBe('9876543210');
    // `PUT /v1/me/addresses/:id` requires a point; an edit that never revisits the map sends the
    // address's OWN point rather than a stale draft, which would silently relocate it.
    expect(screen.getByTestId('point').props.children).toBe('12.97');
  });

  it('adds with EMPTY fields — an add is not a half-filled edit', async () => {
    renderWithRuntime(<DetailsProbe addressId={null} />, { runtime: runtimeWith([SAVED]) });

    await waitFor(() => expect(screen.getByTestId('point').props.children).toBe('none'));
    expect(screen.getByTestId('flat').props.children).toBe('');
    expect(screen.getByTestId('building').props.children).toBe('');
    expect(screen.getByTestId('receiver').props.children).toBe('');
  });

  it('puts a label that is not one of the drawn chips into "Save as", not onto a wrong chip', async () => {
    renderWithRuntime(<DetailsProbe addressId="addr-9" />, {
      runtime: runtimeWith([{ ...SAVED, id: 'addr-9', label: "Simran's pg" }]),
    });

    await waitFor(() => expect(screen.getByTestId('saveAs').props.children).toBe("Simran's pg"));
  });
});
