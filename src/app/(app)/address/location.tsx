import { useRouter } from 'expo-router';

import { AddressLocationView, useAddressLocationData } from '@features/address';

/**
 * Select service location - Figma `53:31`.
 *
 * Ruling R-4: if the pinned area is outside the serviceable area, that result surfaces HERE.
 * The client never evaluates serviceability, and there is no separate rejection flow.
 */
export default function AddressLocationRoute() {
  const router = useRouter();
  const { state, refetch } = useAddressLocationData();

  return (
    <AddressLocationView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      onConfirm={() => router.push('/address/details')}
    />
  );
}
