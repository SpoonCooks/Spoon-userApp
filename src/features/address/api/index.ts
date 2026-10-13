export { ADDRESS_PATHS, addressCreateScope, createAddressApi } from './addressApi';
export type { AddressApi, ServiceabilityCheckInput } from './addressApi';
export {
  addressLineOf,
  addressListFrom,
  addressWriteInputFrom,
  currentAddressOf,
  isServiceable,
  savedAddressFrom,
  serviceabilityMessageFor,
} from './adapters';
export {
  useAddresses,
  usePrefetchAddresses,
  useCreateAddress,
  useDeleteAddress,
  useServiceabilityCheck,
  useSetDefaultAddress,
  useUpdateAddress,
} from './hooks';
export { addressKeys } from './keys';
export {
  addressListSchema,
  addressSchema,
  addressServiceabilitySchema,
  addressWriteResponseSchema,
  serviceabilitySchema,
  serviceabilityStatusSchema,
} from './schemas';
export type {
  AddressServiceabilityDto,
  AddressDto,
  AddressPropertyType,
  AddressWriteInput,
  AddressWriteResponse,
  ServiceabilityDto,
  ServiceabilityStatus,
} from './schemas';
