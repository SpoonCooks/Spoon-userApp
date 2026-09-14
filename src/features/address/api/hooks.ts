import { useMutation, useQueryClient } from '@tanstack/react-query';

import { idempotency } from '@core/api';
import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { createAddressApi } from './addressApi';
import { addressKeys } from './keys';
import type {
  AddressDto,
  AddressWriteInput,
  AddressWriteResponse,
  ServiceabilityDto,
} from './schemas';

/**
 * Address queries and mutations.
 *
 * Every write invalidates the list rather than patching the cache. The server owns the default
 * flag, the archive semantics and the serviceability verdict, and a client-side patch would have
 * to reimplement all three to stay correct — so it refetches instead. The list is one small
 * request; guessing is the expensive option.
 */

export function useAddresses(
  options: { enabled?: boolean } = {},
): ScreenQuery<readonly AddressDto[]> {
  const { api } = useRuntime();
  const addresses = createAddressApi(api);

  return useApiQuery<readonly AddressDto[]>({
    queryKey: addressKeys.list(),
    queryFn: ({ signal }) => addresses.list(signal),
    enabled: options.enabled ?? true,
  });
}

/**
 * `POST /v1/serviceability/check`, as a mutation rather than a query.
 *
 * It is a POST with a body and it is fired by an explicit user action (dropping a pin), not by a
 * screen mounting — so modelling it as a query would mean caching a verdict against a
 * coordinate key that changes on every map pan.
 */
export function useServiceabilityCheck() {
  const { api } = useRuntime();
  const addresses = createAddressApi(api);

  return useMutation<ServiceabilityDto, Error, { latitude: number; longitude: number }>({
    mutationFn: (point) => addresses.check(point),
  });
}

/**
 * Create an address.
 *
 * `scope` names the INTENT — the address draft being saved — so that a retry after an ambiguous
 * network failure reuses the same `Idempotency-Key` and cannot create a duplicate. The scope is
 * released only on success, which is the point at which the intent is genuinely finished.
 */
export function useCreateAddress() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const addresses = createAddressApi(api);

  return useMutation<AddressWriteResponse, Error, { input: AddressWriteInput; scope: string }>({
    mutationFn: ({ input, scope }) => addresses.create(input, scope),
    onSuccess(result, variables) {
      idempotency.release(variables.scope);
      /*
       * Seed the list with the address just created, THEN invalidate.
       *
       * The first-run flow saves an address and replaces to Home, whose `useAddressGate` asks
       * "is there a usable address?" on its very first render. Invalidation alone does not
       * answer that in time: the refetch is still in flight, the gate reads the list it already
       * had — empty, because this is the customer's first address — decides one is still
       * `required`, and sends them straight back to the map they just came from. The save had
       * succeeded; only the read was early. Reproduced on a handset.
       *
       * This is NOT the client-side patch the note above warns against. Every field is either
       * what we just sent or what the server just replied; nothing is computed or guessed.
       * `hub_id` is the one value neither carries, and it is set null because the server owns it
       * and no product code reads it — the gate explicitly does not (see `isAddressUsable`).
       *
       * It is also short-lived by construction: the invalidation immediately below refetches the
       * real list, so this row exists only for the render or two between the save landing and
       * the server's own answer arriving. It bridges that gap; it is not a cache the app lives on.
       */
      const created: AddressDto = {
        id: result.address.id,
        label: result.address.label ?? variables.input.label,
        flat: variables.input.flat ?? null,
        tower: variables.input.tower ?? null,
        society: variables.input.society ?? null,
        street: variables.input.street,
        pincode: variables.input.pincode,
        city: variables.input.city ?? null,
        state: variables.input.state ?? null,
        hub_id: null,
        receiverName: result.address.receiverName,
        receiverPhone: result.address.receiverPhone,
        isDefault: result.address.isDefault,
        latitude: result.address.latitude,
        longitude: result.address.longitude,
        ...(result.address.placeId === undefined ? {} : { placeId: result.address.placeId }),
        serviceability: result.address.serviceability,
      };
      queryClient.setQueryData<readonly AddressDto[]>(addressKeys.list(), (previous) =>
        previous === undefined ? [created] : [...previous, created],
      );
      void queryClient.invalidateQueries({ queryKey: addressKeys.all() });
    },
  });
}

export function useUpdateAddress() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const addresses = createAddressApi(api);

  return useMutation<AddressWriteResponse, Error, { id: string; input: AddressWriteInput }>({
    mutationFn: ({ id, input }) => addresses.update(id, input),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all() });
    },
  });
}

export function useDeleteAddress() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const addresses = createAddressApi(api);

  return useMutation<void, Error, string>({
    mutationFn: (id) => addresses.remove(id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all() });
    },
  });
}
