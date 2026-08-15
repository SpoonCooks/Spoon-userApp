import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AddressEditSheet, SavedAddressesView, useSavedAddressesData } from '@features/address';
import { DEMO_ADDRESS_EDIT } from '@/demo/fixtures/screens';

/**
 * Saved addresses — Figma `68:214`. A list screen, not a map screen.
 *
 * Tapping a saved row raises `228:1801`, the NEW Edit / Delete sheet. Nothing beyond opening and
 * closing it is decided here: whether an address may be deleted, and what deleting does to a live
 * booking, are backend rules with no contract yet.
 */
export default function SavedAddressesRoute() {
  const router = useRouter();
  const { state, refetch } = useSavedAddressesData();
  // `?edit=1` opens the sheet directly, so `228:1801` is reachable without a tap in review builds.
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [editing, setEditing] = useState(__DEV__ && edit === '1');

  return (
    <>
      <SavedAddressesView
        state={state}
        onRetry={refetch}
        onBack={() => router.back()}
        onAdd={() => router.push('/address/location')}
        onSelect={() => setEditing(true)}
        onOpenActions={() => setEditing(true)}
      />

      <AddressEditSheet
        visible={editing}
        edit={DEMO_ADDRESS_EDIT}
        onClose={() => setEditing(false)}
        onEdit={() => {
          setEditing(false);
          router.push('/address/details');
        }}
        onDelete={() => {
          // TODO(backend-contract): no delete endpoint exists, and the frame draws no
          // confirmation step. Deleting is not simulated.
          setEditing(false);
        }}
      />
    </>
  );
}
