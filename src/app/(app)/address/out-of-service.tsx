import { useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { NotServiceableScreen, useNotServiceableStore } from '@features/address';
import { useSafeBack } from '@core/navigation';

/**
 * Address · Not serviceable — Figma `2214:4260`, dev note `2214:4364`.
 *
 * Reached from the map when the SERVER answers `outside_service_area` for the point the customer
 * CONFIRMED; the address details step is skipped and nothing is saved as an address. The server
 * remembered the place as demand when it answered, so this screen only reads what the map step
 * handed over (`useNotServiceableStore`).
 *
 * Back and "Try a different location" return to the map, which was PUSHED under this screen and
 * still holds the pin (cc8c36b). The 3s redirect and "Go to home now" leave the flow for Home.
 */
export default function AddressNotServiceableRoute() {
  const router = useRouter();
  const { onboarding, addressId, from, resume } = useLocalSearchParams<{
    onboarding?: string;
    addressId?: string;
    from?: string;
    resume?: string;
  }>();
  const place = useNotServiceableStore((store) => store.place);
  const left = useRef(false);

  /**
   * A genuine pop in every reachable case. The fallback covers only a deep link straight here,
   * and it goes to the MAP, carrying the flow's context, because "Try a different location" has
   * to lead somewhere a location can be chosen.
   */
  const backToMap = useSafeBack(
    [
      onboarding === '1' ? 'onboarding=1' : null,
      typeof addressId === 'string' && addressId !== ''
        ? `addressId=${encodeURIComponent(addressId)}`
        : null,
      from === undefined ? null : `from=${from}`,
      resume === undefined ? null : `resume=${resume}`,
    ]
      .filter((part): part is string => part !== null)
      .reduce<string>(
        (href, part, index) => `${href}${index === 0 ? '?' : '&'}${part}`,
        '/address/location',
      ) as Href,
  );

  // Once only: the timer and a tap can land together.
  const leave = useCallback((go: () => void) => {
    if (left.current) return;
    left.current = true;
    go();
  }, []);
  const goHome = useCallback(
    () =>
      leave(() => {
        if (router.canDismiss()) router.dismissAll();
        router.replace('/home');
      }),
    [leave, router],
  );

  return (
    <NotServiceableScreen
      place={
        place ?? {
          title: 'Selected location',
          line: '',
          locality: null,
          liveAreas: [],
          neighbours: 0,
        }
      }
      onBack={() => leave(backToMap)}
      onGoHome={goHome}
      onTimeout={goHome}
    />
  );
}
