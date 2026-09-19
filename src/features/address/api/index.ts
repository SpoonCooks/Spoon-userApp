export { ADDRESS_PATHS, addressCreateScope, createAddressApi } from './addressApi';
export type { AddressApi } from './addressApi';
export {
  addressLineOf,
  addressListFrom,
  addressWriteInputFrom,
  isServiceable,
  savedAddressFrom,
  serviceabilityMessageFor,
} from './adapters';
export {
  useAddresses,
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
  AddressWriteInput,
  AddressWriteResponse,
  ServiceabilityDto,
  ServiceabilityStatus,
} from './schemas';
