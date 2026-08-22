import { useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';

import { AddressOutOfServiceView, useAddressOutOfServiceData } from '@features/address';
import { useSafeBack } from '@core/navigation';

/**
 * Address out of service — Figma `215:1472`, "Coming soon to your area!".
 *
 * Reached from `53:31` when the SERVER answers `outside_service_area` for the point the customer
 * CONFIRMED. The client never decides this: every string on the screen is copy, and the verdict
 * that brought the customer here came from `POST /v1/serviceability/check`.
 *
 * The frame's own header reads "Choose another location", so back is not an escape from a dead
 * end — it IS the screen's action. The map step arrived here with `push` and is still mounted
 * underneath, so backing out returns to the pin the customer placed rather than to a map that
 * re-acquires the device fix and discards their work (task §8).
 *
 * Nothing re-checks on the way back: serviceability now runs only on Confirm, so there is no
 * effect left that could bounce the customer straight back to this screen.
 */
export default function AddressOutOfServiceRoute() {
  const { onboarding, addressId } = useLocalSearchParams<{
    onboarding?: string;
    addressId?: string;
  }>();
  const { state, refetch } = useAddressOutOfServiceData();

  /**
   * A genuine pop in every reachable case. The fallback covers only the unreachable one — a deep
   * link straight to this route — and it goes to the MAP, because "choose another location" has to
   * lead somewhere a location can be chosen. `onboarding` is preserved so a first-run customer
   * still finishes at Home rather than at the saved-address list.
   */
  const goBack = useSafeBack(
    [
      onboarding === '1' ? 'onboarding=1' : null,
      typeof addressId === 'string' && addressId !== ''
        ? `addressId=${encodeURIComponent(addressId)}`
        : null,
    ]
      .filter((part): part is string => part !== null)
      .reduce<string>(
        (href, part, index) => `${href}${index === 0 ? '?' : '&'}${part}`,
        '/address/location',
      ) as Href,
  );

  return <AddressOutOfServiceView state={state} onRetry={refetch} onBack={goBack} />;
}
