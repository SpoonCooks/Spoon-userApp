import { useRouter } from 'expo-router';

import { AddressDetailsView, useAddressDetailsData } from '@features/address';

/** Add address details - Figma `60:655`. */
export default function AddressDetailsRoute() {
  const router = useRouter();
  const { state, refetch } = useAddressDetailsData();

  return (
    <AddressDetailsView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      onChangeArea={() => router.back()}
      onSave={() => {
        // TODO(backend-contract): "Check Availability & Save" implies a serviceability call that
        // can reject the address. No endpoint exists, so nothing is submitted here.
        router.back();
      }}
    />
  );
}
