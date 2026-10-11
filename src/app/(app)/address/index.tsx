import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import {
  SavedAddressesScreen,
  savedListFrom,
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@features/address';
import type { AddressToastNotice } from '@features/address';
import { getUserMessage, isAppError } from '@core/errors';
import { useNavigationGuard, useSafeBack } from '@core/navigation';
import { InfoDialog, QueryBoundary } from '@ui';

/**
 * Saved addresses — Figma `1870:2770` with the Remove sheet from `1870:2857` (dev notes
 * `2075:11950`, `2075:11957`).
 *
 * ## Choosing versus browsing
 *
 * Home's address switcher opens this list to CHOOSE the address bookings use (`from=home`): the
 * row is the choice, and the address in use carries "Current selection". The profile opens it to
 * BROWSE (`from=profile`): a row tap does nothing (dev note), and the address of the latest order
 * carries "Last used". Choosing is still `PUT … { isDefault: true }`, the server's own flag — the
 * kebab is the only way into Edit (`d51f326`).
 *
 * ## Removing
 *
 * The server decides: it refuses an address an upcoming booking uses (`ADDRESS_IN_USE`) and, when
 * the removed address was the one in use, promotes the next most recently used. The list is
 * refetched by the mutation either way, so it always shows the server's answer.
 */
export default function SavedAddressesRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const addresses = useAddresses();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const [notice, setNotice] = useState<AddressToastNotice | null>(null);
  const toast = (message: string) =>
    setNotice((previous) => ({ id: (previous?.id ?? 0) + 1, message }));

  const choosing = from === 'home';
  const backTarget: Href = from === 'home' ? '/home' : '/profile';
  const goBack = useSafeBack(backTarget);
  // One screen per tap: a quick double tap must not open the same screen twice.
  const guard = useNavigationGuard();

  const state = useMemo(() => {
    if (addresses.state.status !== 'ready') return addresses.state;
    return {
      status: 'ready' as const,
      data: savedListFrom(addresses.state.data, choosing ? 'choose' : 'browse'),
    };
  }, [addresses.state, choosing]);

  return (
    <>
      <QueryBoundary state={state} onRetry={addresses.refetch} loadingVariant="screen">
        {(list) => (
          <SavedAddressesScreen
            addresses={list}
            onBack={guard(goBack)}
            notice={notice}
            onAdd={guard(() =>
              router.push(
                (from === undefined
                  ? '/address/location'
                  : `/address/location?from=${from}`) as Href,
              ),
            )}
            {...(choosing
              ? {
                  onSelect: (id: string) => {
                    if (setDefault.isPending) return;
                    setDefault.mutateAsync(id).catch((thrown: unknown) => {
                      setError({
                        title: 'Couldn’t switch address',
                        body: isAppError(thrown)
                          ? getUserMessage(thrown)
                          : 'We could not switch to this address.',
                      });
                    });
                  },
                }
              : {})}
            onEdit={guard((id: string) =>
              router.push(
                (from === undefined
                  ? `/address/details?addressId=${id}`
                  : `/address/details?addressId=${id}&from=${from}`) as Href,
              ),
            )}
            onRemove={async (id) => {
              try {
                await remove.mutateAsync(id);
                toast('Address removed');
                return 'removed';
              } catch (thrown: unknown) {
                return isAppError(thrown) && thrown.code === 'ADDRESS_IN_USE' ? 'in_use' : 'failed';
              }
            }}
          />
        )}
      </QueryBoundary>

      <InfoDialog
        visible={error !== null}
        onClose={() => setError(null)}
        title={error?.title ?? ''}
        body={error?.body ?? ''}
        testID="address-action-error"
      />
    </>
  );
}
