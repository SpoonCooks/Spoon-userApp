import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import {
  DEMO_ADDRESS_DETAILS,
  DEMO_ADDRESS_LIST,
  DEMO_ADDRESS_LOCATION,
  DEMO_ADDRESS_OUT_OF_SERVICE,
} from '@/demo/fixtures/screens';
import type {
  AddressDetailsViewModel,
  AddressListViewModel,
  AddressLocationViewModel,
  AddressOutOfServiceViewModel,
} from './types';

/** TODO(backend-contract): address endpoints and the serviceability response do not exist yet. */
export function useSavedAddressesData(): ScreenQuery<AddressListViewModel> {
  return useDevFixture(DEMO_ADDRESS_LIST);
}

export function useAddressLocationData(): ScreenQuery<AddressLocationViewModel> {
  return useDevFixture(DEMO_ADDRESS_LOCATION);
}

export function useAddressDetailsData(): ScreenQuery<AddressDetailsViewModel> {
  return useDevFixture(DEMO_ADDRESS_DETAILS);
}

/**
 * `215:1472`. The screen renders a server verdict — the client never decides that an address is
 * unserviceable, so this hook has no input and computes nothing.
 */
export function useAddressOutOfServiceData(): ScreenQuery<AddressOutOfServiceViewModel> {
  return useDevFixture(DEMO_ADDRESS_OUT_OF_SERVICE);
}
