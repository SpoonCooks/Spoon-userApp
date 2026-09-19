import { useMutation, useQueryClient } from '@tanstack/react-query';

import { idempotency } from '@core/api';
import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { addressWriteInputFrom } from './adapters';
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

/**
 * Make one saved address the account default — the address every booking then uses.
 *
 * ## Why a full PUT, and why it reads the cache
 *
 * There is no endpoint that flips one field. `PUT /v1/me/addresses/:id` is a full replace, so the
 * stored record has to be replayed whole with `isDefault: true` beside it — which is why this
 * takes an id and then reads the row out of the list cache rather than taking a body from the
 * caller. The list is the same query the screen is already rendering from, so the body sent is
 * the server's own last answer, not a screen's idea of it.
 *
 * The backend does the rest in one transaction: `setDefaultAddress` demotes the previous default
 * before promoting this one, and the `addresses_one_default_per_user` partial unique index is
 * what actually guarantees "at most one" against two concurrent taps.
 *
 * ## Why the server owns this and the client does not
 *
 * The default is ACCOUNT-level (owner decision, 2026-08-17): it survives logout, reinstall and a
 * change of device. A device-local selection would not, and it would be a second source of truth
 * for a value `GET /v1/me/addresses` already publishes and already sorts by.
 *
 * ## The serviceability refusal is correct, not a bug to swallow
 *
 * That PUT clears `hub_id` and re-resolves it, and answers `ADDRESS_NOT_SERVICEABLE` when the
 * address no longer sits in a live hub. So an address saved while a hub was active can refuse to
 * become the default once that hub is paused — which is the right answer, because an address the
 * platform cannot serve must not silently become the one every booking uses. The caller shows it.
 */
export function useSetDefaultAddress() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const addresses = createAddressApi(api);

  return useMutation<AddressWriteResponse, Error, string>({
    mutationFn: (addressId) => {
      const list = queryClient.getQueryData<readonly AddressDto[]>(addressKeys.list());
      const saved = list?.find((address) => address.id === addressId);
      /*
       * Fails closed. Without the stored row there is no body to send, and a PUT assembled from
       * anything less would replace the address with a thinner version of itself — losing the
       * receiver, the building, or the point — to set one boolean. A row that has vanished from
       * the cache has been archived or refetched away, and the list below is about to say so.
       */
      if (saved === undefined) {
        return Promise.reject(new Error('That address is no longer available.'));
      }
      return addresses.update(addressId, { ...addressWriteInputFrom(saved), isDefault: true });
    },
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
