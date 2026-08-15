import { useRouter } from 'expo-router';

import { AddressOutOfServiceView, useAddressOutOfServiceData } from '@features/address';

/**
 * Address out of service — Figma `215:1472`, NEW in `1kd1u3WEc00SENkToIPloW`.
 *
 * PRODUCT_DESIGN_CONFLICT with ruling R-4, which said the map step surfaces serviceability inline
 * and that no separate rejection screen exists. The designer has since drawn one. It is built
 * because the new file wins on visuals; the map step's inline message is left in place, and no
 * flow silently switches to this screen — nothing routes here except the `__DEV__` menu until
 * product says which surface is canonical.
 */
export default function AddressOutOfServiceRoute() {
  const router = useRouter();
  const { state, refetch } = useAddressOutOfServiceData();

  return (
    <AddressOutOfServiceView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      onOpenProfile={() => router.push('/profile')}
    />
  );
}
