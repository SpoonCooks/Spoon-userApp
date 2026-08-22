import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { AddressLocationView, useAddressLocationData } from '@features/address';
import { useAddressDraftStore } from '@core/store/addressDraftStore';
import { useAndroidBackHandler, useDeterministicBack } from '@core/navigation';

/**
 * Select service location - Figma `53:31`.
 *
 * The map is REAL: Google Maps through `react-native-maps`, Places (New) behind the search field,
 * and a pin fixed to the middle of the canvas that the customer drags the CITY beneath. Every one
 * of those produces the same thing — a coordinate.
 *
 * ## Selecting is not confirming (task §5, §6)
 *
 * This screen previously ran `POST /v1/serviceability/check` on every point, and navigated away
 * from an `outside_service_area` verdict out of an effect. Two defects came out of that: the
 * customer paid a request for every exploratory tap, and touching the map in the wrong place
 * ejected them from it before they had chosen anything.
 *
 * The order is now the one the product actually has:
 *
 *   search / PAN         ->  the map settles, the coordinate under the pin updates, the address
 *                            preview follows.  NO network decision, NO navigation.
 *   CONFIRM              ->  one serviceability call, and the answer decides where to go.
 *
 * Ruling R-4 said serviceability surfaces inline here and that no separate rejection screen
 * exists. The final file draws one (`215:1472`) and the product decision has now been made:
 *
 *   outside_service_area      -> `215:1472` "Coming soon to your area!"
 *   temporarily_unavailable   -> stays INLINE, because "not right now" is not "not here" and
 *                                sending someone to a coming-soon screen would be wrong
 *   anything else (offline,
 *   a timeout, a 5xx)         -> stays INLINE. A network failure is not a verdict, and throwing
 *                                the customer onto another route for one would be a lie about
 *                                where they live (§7).
 *
 * The client still evaluates no coverage: it reads `status` off the server's response and routes.
 *
 * Confirm carries the coordinates forward in the address draft — the permitted client-owned
 * pre-submit state — because `60:655` is a separate route and the coordinates are what make the
 * address real.
 */
export default function AddressLocationRoute() {
  const router = useRouter();
  /**
   * `onboarding=1` is the FLOW CONTEXT the founder's rule turns on (task §4), set by Home's
   * address gate and carried through every step. `addressId` is present only when the customer
   * walked back here from an EDIT — it keeps the edit addressed to the same record.
   */
  const { onboarding, addressId } = useLocalSearchParams<{
    onboarding?: string;
    addressId?: string;
  }>();
  const firstRun = onboarding === '1';
  const editingId = typeof addressId === 'string' && addressId !== '' ? addressId : null;
  const { state, refetch, location } = useAddressLocationData();
  const setPoint = useAddressDraftStore((store) => store.setPoint);

  /**
   * FIRST-TIME: **no back control at all** (V7 founder comment, task §4/§15).
   *
   * A new account reaches this screen by a `<Redirect>` from Home, itself reached by a
   * `<Redirect>` from `/`. Both replace, so there is genuinely nothing behind it, and the address
   * gate would bounce any escape straight back — a chevron there is a control that cannot work.
   * It is now absent rather than inert.
   *
   * REPEAT / ADD ADDRESS: back goes to `68:214`, the saved-address list this screen was opened
   * from. Deterministic rather than a pop, so the same route cannot show one affordance and
   * perform another.
   */
  const goBackToList = useDeterministicBack('/address');
  const goBack = firstRun ? undefined : goBackToList;

  /**
   * Android back closes the Places prediction list before it touches the stack.
   *
   * The list is drawn inside the sticky search bar rather than in a modal — it has to cover the
   * map without moving the panel the pin is aimed in — so nothing else would dismiss it, and
   * leaving the screen with predictions still open reads as the app having ignored the press.
   */
  useAndroidBackHandler(() => {
    if (location.suggestions.length === 0) return false;
    location.dismissSuggestions();
    return true;
  });

  return (
    <AddressLocationView
      state={state}
      onRetry={refetch}
      onBack={goBack}
      canConfirm={location.canConfirm}
      confirming={location.confirming}
      map={{
        coordinates: location.coordinates,
        onSettle: location.selectPoint,
        query: location.query,
        suggestions: location.suggestions,
        searchState: location.searchState,
        onSearch: location.search,
        onChooseSuggestion: location.chooseSuggestion,
        onDismissSuggestions: location.dismissSuggestions,
      }}
      onConfirm={() => {
        void location.confirm().then((outcome) => {
          /**
           * `blocked` — no point, or a check already in flight, or the map settled somewhere new
           * while this one was out. Nothing happened and nothing should move.
           *
           * `error` — the hook has already put a retry message in the helper pill. The customer
           * keeps their map, their pin and their resolved row, and presses Confirm again.
           */
          if (outcome.kind === 'blocked' || outcome.kind === 'error') return;

          if (outcome.kind === 'refused') {
            // `215:1472` is reached the same way in both flows; the parameters that describe
            // WHICH address is being placed travel with it so "Choose another location" returns
            // to a map that still knows.
            const query = [
              firstRun ? 'onboarding=1' : null,
              editingId === null ? null : `addressId=${encodeURIComponent(editingId)}`,
            ]
              .filter((part): part is string => part !== null)
              .join('&');
            /**
             * PUSH, not replace. Replacing unmounts this screen, so "Choose another location"
             * would land on a FRESH map that re-runs the device fix and loses the point the
             * customer spent time framing. Pushing keeps this screen alive underneath: coming
             * back returns them to exactly the point they were looking at, with Confirm live
             * again so they can pan somewhere else and try once more.
             */
            if (outcome.status === 'outside_service_area') {
              router.push(
                (query === ''
                  ? '/address/out-of-service'
                  : `/address/out-of-service?${query}`) as Href,
              );
            }
            // `temporarily_unavailable` is already in the helper pill. It is not a place-based
            // refusal, so it gets no screen — the customer waits, or picks somewhere else.
            return;
          }

          /**
           * Serviceable. The coordinates the SERVER approved are the ones carried forward — read
           * off the OUTCOME, never off `location.coordinates`.
           *
           * The pin no longer moves; the map does, and it commits a new coordinate every time it
           * comes to rest. This closure was built by a render, so `location.coordinates` can be
           * one settle behind what `confirm()` actually checked. Taking the point from the outcome
           * is what guarantees the address is saved at the coordinate the server approved.
           */
          setPoint({
            latitude: outcome.coordinates.latitude,
            longitude: outcome.coordinates.longitude,
            placeId: outcome.geocoded?.placeId ?? null,
            serviceable: true,
            street: outcome.geocoded?.street ?? null,
            city: outcome.geocoded?.city ?? null,
            state: outcome.geocoded?.region ?? null,
            pincode: outcome.geocoded?.pincode ?? null,
          });
          /**
           * `60:655`, carrying the SAME context this screen was entered with.
           *
           * `addressId` is what stops an edit that walked back to the map from being saved as a
           * NEW address on the way forward again (task §5, §28): the record's identity survives
           * the round trip, so Save is still a `PUT` on the address the customer opened.
           */
          const forward = [
            firstRun ? 'onboarding=1' : null,
            editingId === null ? null : `addressId=${encodeURIComponent(editingId)}`,
          ]
            .filter((part): part is string => part !== null)
            .join('&');

          router.push(
            (forward === '' ? '/address/details' : `/address/details?${forward}`) as Href,
          );
        });
      }}
    />
  );
}
