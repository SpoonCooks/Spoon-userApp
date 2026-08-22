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
    onSuccess(_result, variables) {
      idempotency.release(variables.scope);
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
