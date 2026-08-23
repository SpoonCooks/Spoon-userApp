/**
 * Feature: address.
 *
 * Screens: `68:214` Saved addresses (list) → `53:31` map/pin step → `60:655` address details.
 *
 * NEW in `1kd1u3WEc00SENkToIPloW`: `228:1801` the Edit/Delete sheet over the list, and `215:1472`
 * a full "Address out of service" screen.
 *
 * Boundary: serviceability is a BACKEND decision. The client never evaluates coverage, distance
 * or geofences. Ruling R-4 said the map step surfaces the result and that there is no separate
 * rejection flow; `215:1472` now draws exactly such a screen, so the ruling and the file
 * disagree — flagged PRODUCT_DESIGN_CONFLICT. Both surfaces exist in code and neither is chosen
 * by the client.
 *
 * The address endpoints, their payloads and the serviceability response all exist and are wired:
 * `GET/POST /v1/me/addresses`, `PUT/DELETE /v1/me/addresses/:id` and `POST /v1/serviceability/check`,
 * plus the per-address `serviceability` verdict every saved row now carries.
 * TODO(product B-13): whether `receiver { name, phone }` is per-address (as drawn) or
 * overridable per booking is unanswered.
 */

export {
  isAddressUsable,
  useAddressGate,
  useAddressDetailsData,
  useAddressEditData,
  useAddressLocationData,
  useAddressOutOfServiceData,
  useSavedAddressesData,
} from './data';
export {
  AddressDetailsView,
  AddressEditSheet,
  AddressLocationView,
  AddressOutOfServiceView,
  SavedAddressesView,
} from './screens/AddressScreens';
export type {
  AddressDetailsViewProps,
  AddressDraft as AddressFormDraft,
  AddressLocationViewProps,
} from './screens/AddressScreens';
export type { AddressGate, AddressDetailsData } from './data';
export {
  canSubmitAddress,
  isAddressFormComplete,
  isOthersSelected,
  missingAddressFields,
  othersLabelIdOf,
} from './validation';
export type {
  AddressFormShape,
  AddressFormValues,
  AddressRequiredField,
  AddressSubmitGate,
} from './validation';
export type * from './types';
export * from './api';
export { useAddressLocation } from './location/useAddressLocation';
export type { AddressLocationState } from './location/useAddressLocation';
export { getCurrentCoordinates, reverseGeocode } from './location/deviceLocation';
export type {
  DeviceCoordinates,
  DeviceLocationFailure,
  DeviceLocationResult,
  ReverseGeocodedAddress,
} from './location/deviceLocation';
