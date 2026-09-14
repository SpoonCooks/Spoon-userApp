import { Text } from 'react-native';
import { waitFor } from '@testing-library/react-native';

import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';

import { useAddressDraftStore } from '@core/store/addressDraftStore';

import { useAddressDetailsData } from './data';
import {
  canSubmitAddress,
  isAddressFormComplete,
  isOthersSelected,
  missingAddressFields,
  othersLabelIdOf,
  resolveAddressSavePoint,
} from './validation';
import type { AddressFormShape, AddressFormValues } from './validation';

/**
 * `60:655` "Complete address" — the CTA gate, at both of its ends.
 *
 * The FIELD half is a pure function and is asserted as one. The CONTEXT half comes out of
 * `useAddressDetailsData`, and the thing worth proving there is what it REFUSES: a point nobody
 * checked, and a point the server refused, are both "no location" as far as Confirm is concerned.
 */

const CHIPS = [
  { id: 'home', label: 'Home' },
  { id: 'parents', label: 'Parents' },
  { id: 'friends', label: 'Friends' },
  { id: 'others', label: 'Others' },
];

const SHAPE: AddressFormShape = { othersLabelId: 'others', saveAsOffered: true };

const COMPLETE: AddressFormValues = {
  flat: 'B-402',
  building: 'Green Meadows',
  labelId: 'home',
  saveAs: '',
};

describe('address form validation (60:655)', () => {
  it('finds the Others chip by id and by its drawn word', () => {
    expect(othersLabelIdOf(CHIPS)).toBe('others');
    expect(othersLabelIdOf([{ id: 'custom-4', label: ' OTHERS ' }])).toBe('custom-4');
    // A chip set with no Others chip simply never puts "Save as" in play.
    expect(othersLabelIdOf([{ id: 'home', label: 'Home' }])).toBeNull();
  });

  it('accepts a complete address', () => {
    expect(missingAddressFields(COMPLETE, SHAPE)).toEqual([]);
    expect(isAddressFormComplete(COMPLETE, SHAPE)).toBe(true);
  });

  it('names every requirement that is not met, in the order the fields are drawn', () => {
    expect(
      missingAddressFields({ flat: '', building: '', labelId: null, saveAs: '' }, SHAPE),
    ).toEqual(['flat', 'building', 'label']);
  });

  it.each([
    ['flat', { ...COMPLETE, flat: '' }],
    ['whitespace-only flat', { ...COMPLETE, flat: '   ' }],
    ['building', { ...COMPLETE, building: '' }],
    ['whitespace-only building', { ...COMPLETE, building: '\t \n' }],
    ['label', { ...COMPLETE, labelId: null }],
  ])('refuses a missing %s', (_name, values) => {
    expect(isAddressFormComplete(values, SHAPE)).toBe(false);
  });

  describe('"Save as" is conditional on Others', () => {
    it('is required under Others', () => {
      const others = { ...COMPLETE, labelId: 'others' };
      expect(isOthersSelected('others', SHAPE)).toBe(true);
      expect(missingAddressFields(others, SHAPE)).toEqual(['saveAs']);
      expect(isAddressFormComplete({ ...others, saveAs: 'Simran pg' }, SHAPE)).toBe(true);
      // Whitespace is not a name.
      expect(isAddressFormComplete({ ...others, saveAs: '  ' }, SHAPE)).toBe(false);
    });

    it('is not required — and a stale value is harmless — under a named chip', () => {
      expect(isAddressFormComplete({ ...COMPLETE, labelId: 'home', saveAs: '' }, SHAPE)).toBe(true);
      expect(isAddressFormComplete({ ...COMPLETE, labelId: 'home', saveAs: 'Studio' }, SHAPE)).toBe(
        true,
      );
    });

    it('is out of play entirely when the copy offers no such field', () => {
      const noField: AddressFormShape = { othersLabelId: 'others', saveAsOffered: false };
      expect(isAddressFormComplete({ ...COMPLETE, labelId: 'others', saveAs: '' }, noField)).toBe(
        true,
      );
    });
  });

  it('ANDs the form with the confirmed location and the write in flight', () => {
    const gate = { values: COMPLETE, shape: SHAPE, locationReady: true, submitting: false };

    expect(canSubmitAddress(gate)).toBe(true);
    expect(canSubmitAddress({ ...gate, locationReady: false })).toBe(false);
    expect(canSubmitAddress({ ...gate, submitting: true })).toBe(false);
    expect(canSubmitAddress({ ...gate, values: { ...COMPLETE, flat: ' ' } })).toBe(false);
  });
});

/**
 * `resolveAddressSavePoint` — the fix for a real (pre-existing) bug: the draft store persists
 * until a save succeeds, so an abandoned add, or a "Change area" on a DIFFERENT address, can
 * leave an unrelated point sitting in it. Saving an edit that never revisited the map must never
 * pick that up and silently relocate an address the customer only meant to rename.
 */
describe('resolveAddressSavePoint (60:655) — which coordinates a save actually submits', () => {
  const NO_DRAFT = { editingId: null, latitude: null, longitude: null, placeId: null };
  const SAVED_POINT = { latitude: 12.97, longitude: 77.64 };

  it('adding: uses the draft, tagged for no address (null)', () => {
    const draft = { editingId: null, latitude: 12.9, longitude: 77.6, placeId: 'place-1' };

    expect(resolveAddressSavePoint(draft, null, null, null)).toEqual({
      latitude: 12.9,
      longitude: 77.6,
      placeId: 'place-1',
    });
  });

  it('editing with no draft: uses the address’s own saved point', () => {
    expect(resolveAddressSavePoint(NO_DRAFT, 'addr-7', SAVED_POINT, 'place-saved')).toEqual({
      latitude: 12.97,
      longitude: 77.64,
      placeId: 'place-saved',
    });
  });

  it('editing after "Change area" on THIS address: uses the fresh draft, not the stale saved point', () => {
    const draft = { editingId: 'addr-7', latitude: 12.9, longitude: 77.6, placeId: null };

    expect(resolveAddressSavePoint(draft, 'addr-7', SAVED_POINT, 'place-saved')).toEqual({
      latitude: 12.9,
      longitude: 77.6,
    });
  });

  /** The defect this closes: a leftover draft from an unrelated attempt must never win. */
  it('editing with a leftover draft tagged for a DIFFERENT address: uses the saved point, not the leftover', () => {
    const staleDraft = { editingId: 'addr-9', latitude: 12.9, longitude: 77.6, placeId: null };

    expect(resolveAddressSavePoint(staleDraft, 'addr-7', SAVED_POINT, 'place-saved')).toEqual({
      latitude: 12.97,
      longitude: 77.64,
      placeId: 'place-saved',
    });
  });

  /** Adding with a leftover EDIT draft is the same defect from the other side. */
  it('adding with a leftover draft tagged for an EDIT: finds no usable point at all', () => {
    const staleDraft = { editingId: 'addr-9', latitude: 12.9, longitude: 77.6, placeId: null };

    expect(resolveAddressSavePoint(staleDraft, null, null, null)).toBeNull();
  });

  it('is null when adding with no point pinned yet', () => {
    expect(resolveAddressSavePoint(NO_DRAFT, null, null, null)).toBeNull();
  });
});

function Harness({ addressId }: { addressId?: string | null }) {
  const details = useAddressDetailsData(addressId);
  return (
    <>
      <Text testID="location-ready">{String(details.locationReady)}</Text>
      <Text testID="status">{details.state.status}</Text>
      <Text testID="area">
        {details.state.status === 'ready' ? details.state.data.areaValue : ''}
      </Text>
    </>
  );
}

function renderDetails(addressId?: string | null) {
  return renderWithRuntime(<Harness {...(addressId === undefined ? {} : { addressId })} />, {
    runtime: createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) }),
  });
}

describe('useAddressDetailsData — the confirmed-location half of the gate', () => {
  beforeEach(() => {
    useAddressDraftStore.getState().clear();
  });

  it('reports no location while the draft is empty', async () => {
    const { getByTestId } = renderDetails();

    await waitFor(() => expect(getByTestId('location-ready')).toHaveTextContent('false'));
  });

  /** `null` is "never asked". A point nobody checked is not a point this form may save against. */
  it('reports no location for a point that was never checked', async () => {
    useAddressDraftStore.getState().setPoint({ latitude: 12.9, longitude: 77.6 });
    const { getByTestId } = renderDetails();

    await waitFor(() => expect(getByTestId('location-ready')).toHaveTextContent('false'));
  });

  it('reports no location for a point the server REFUSED', async () => {
    useAddressDraftStore
      .getState()
      .setPoint({ latitude: 12.9, longitude: 77.6, serviceable: false });
    const { getByTestId } = renderDetails();

    await waitFor(() => expect(getByTestId('location-ready')).toHaveTextContent('false'));
  });

  it('reports a location once the server approved the confirmed point', async () => {
    useAddressDraftStore
      .getState()
      .setPoint({ latitude: 12.9, longitude: 77.6, serviceable: true });
    const { getByTestId } = renderDetails();

    await waitFor(() => expect(getByTestId('location-ready')).toHaveTextContent('true'));
  });

  /**
   * The store persists until a save succeeds, so a leftover point from editing (or abandoning)
   * a DIFFERENT address can still be sitting there. It must not make a fresh add's CTA look live
   * — that would be a button that appears enabled but has no point of its own to save.
   */
  it('reports no location while adding, for a leftover draft tagged for a different edit', async () => {
    useAddressDraftStore.getState().setPoint({
      latitude: 12.9,
      longitude: 77.6,
      serviceable: true,
      editingId: 'addr-1',
    });
    const { getByTestId } = renderDetails(null);

    await waitFor(() => expect(getByTestId('location-ready')).toHaveTextContent('false'));
  });

  /** An edit already has a point the backend accepted, so Confirm may be live on arrival. */
  it('reports a location for an edit, from the record itself', async () => {
    const { getByTestId } = renderDetails('addr-1');

    await waitFor(() => expect(getByTestId('location-ready')).toHaveTextContent('true'));
  });

  /** The form is local state seeded once; mounting it before the record lands loses the prefill. */
  it('does not render the form for an edit until the record has arrived', async () => {
    const { getByTestId } = renderDetails('addr-1');

    expect(getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() => expect(getByTestId('status')).toHaveTextContent('ready'));
  });

  /**
   * The fixture's "Street name, Area 124, subarea xyz, city" is artboard copy. Drawn beside a real
   * pin it reads as the customer's own address for a place they have never been.
   */
  it('never shows the fixture area line for a point the geocoder could not name', async () => {
    useAddressDraftStore
      .getState()
      .setPoint({ latitude: 12.9, longitude: 77.6, serviceable: true });
    const { getByTestId } = renderDetails();

    await waitFor(() => expect(getByTestId('location-ready')).toHaveTextContent('true'));
    expect(getByTestId('area')).not.toHaveTextContent('Street name, Area 124, subarea xyz, city');
  });

  it('shows the geocoded area when there is one', async () => {
    useAddressDraftStore.getState().setPoint({
      latitude: 12.9,
      longitude: 77.6,
      serviceable: true,
      street: 'Silver County Road',
      city: 'Bengaluru',
    });
    const { getByTestId } = renderDetails();

    await waitFor(() =>
      expect(getByTestId('area')).toHaveTextContent('Silver County Road, Bengaluru'),
    );
  });
});
