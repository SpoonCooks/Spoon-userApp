import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import {
  AddressEditSheet,
  SavedAddressesView,
  useAddressEditData,
  useDeleteAddress,
  useSavedAddressesData,
  useSetDefaultAddress,
} from '@features/address';
import { getUserMessage, isAppError } from '@core/errors';
import { useAndroidBackHandler, useSafeBack } from '@core/navigation';
import { InfoDialog } from '@ui';

/**
 * Saved addresses — Figma `68:214`. A list screen, not a map screen.
 *
 * ## The row and the kebab are two different actions
 *
 * Tapping the ROW makes that address the account default — the one every booking then uses.
 * Tapping the KEBAB raises `228:1801`, the Edit / Delete sheet, for that row and nothing else.
 *
 * They used to be the same handler. Both called `setSelectedId`, so the only thing a row tap
 * could do was open the edit sheet, and there was no way anywhere in the app to change which
 * address a booking would use — the client never sent `isDefault`, and every screen that reads
 * one (`home`, `booking`, `scheduled`) falls back to `list[0]`, which the backend sorts as the
 * OLDEST saved address. The backend has accepted `isDefault` on this PUT since 2026-08-17 and
 * demotes the previous default itself; only the trigger was missing.
 *
 * The id the list hands back is carried through to the sheet, to the edit route and to the
 * delete call, so the three can never disagree about which address is being acted on — the
 * defect §5 was raised against, where Edit opened a blank "add" form unrelated to the row that
 * was tapped.
 *
 * Edit navigates to `60:655` (`18b`) with the address id, and that screen opens PREFILLED with
 * the saved record for review. It is an UPDATE of an existing address, not the creation of an
 * unrelated one — `PUT /v1/me/addresses/:id` preserves identity, which is what keeps a booking's
 * address reference intact.
 */
export default function SavedAddressesRoute() {
  const router = useRouter();
  const { state, refetch } = useSavedAddressesData();
  // `?edit=<id>` opens the sheet directly, so `228:1801` is reachable without a tap in review builds.
  const { edit, from } = useLocalSearchParams<{ edit?: string; from?: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(
    __DEV__ && typeof edit === 'string' && edit !== '' ? edit : null,
  );
  const { edit: editModel } = useAddressEditData(selectedId);
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  /** One dialog serves both failures, so it carries its own title rather than assuming delete. */
  const [error, setError] = useState<{ title: string; body: string } | null>(null);

  /**
   * `68:214` back -> `6:663` PROFILE (V7 founder comment, task §5/§15) — UNLESS `?from=home`,
   * in which case back -> HOME directly. `home.tsx` and `profile/index.tsx` each tag their
   * `push('/address')` with which one they are, so the two entry points keep their own correct
   * destination instead of one entry point silently inheriting the other's.
   *
   * `useSafeBack`, not `useDeterministicBack`: this screen is always pushed directly on top of
   * whichever of the two entries sent it, so `backTarget` is exactly the screen underneath, not a
   * fallback for one — popping to it is correct AND gets the platform's reverse-of-push closing
   * animation (left-to-right, matching Scheduled's), where `dismissAll` + `replace` played no
   * such animation. The fallback path only fires with no history to pop (a bare deep link).
   *
   * `from` also rides along into `onAdd`/`onEdit` below: the add/edit sub-flow (`location.tsx`,
   * `details.tsx`) ends by collapsing itself and REPLACING back onto this route, which discards
   * real history the same way `useDeterministicBack` does — so without carrying `from` through
   * every step, a trip that started at Home and detoured through "add a new address" would land
   * back here with no `from`, and `backTarget` would silently fall to `/profile` again.
   */
  const backTarget: Href = from === 'home' ? '/home' : '/profile';
  const goBack = useSafeBack(backTarget);

  /**
   * The `228:1801` sheet is a native modal and closes itself on Android back. The DELETE FAILURE
   * dialog is one too. Neither is handled here — what is, is the SELECTION behind them: a row
   * whose sheet has just closed must not leave this screen holding an id, or the next back press
   * would look like it did nothing while the sheet re-opened.
   */
  useAndroidBackHandler(() => {
    if (selectedId === null) return false;
    setSelectedId(null);
    return true;
  });

  return (
    <>
      <SavedAddressesView
        state={state}
        onRetry={refetch}
        onBack={goBack}
        // `from` rides along so the add flow's own back controls, and the SAVE that collapses it
        // back to this screen, can still tell which entry point this trip started from — see the
        // matching comment on `goBack` above.
        onAdd={() =>
          router.push(
            (from === undefined ? '/address/location' : `/address/location?from=${from}`) as Href,
          )
        }
        /*
         * The row: make this the account default. Guarded against a second tap while the first
         * is still in flight — two PUTs racing would both demote and re-promote, and the list
         * would settle on whichever answered last rather than whichever was tapped last.
         */
        onSelect={(id) => {
          if (setDefault.isPending) return;
          setDefault.mutateAsync(id).catch((thrown: unknown) => {
            /*
             * `ADDRESS_NOT_SERVICEABLE` reaches here as a real answer, not a transport failure:
             * the PUT re-resolves the hub, so an address saved while a hub was live refuses to
             * become the default once that hub is paused. The server's own message says which,
             * so it is shown rather than replaced with a generic one.
             */
            setError({
              title: 'Couldn’t switch address',
              body: isAppError(thrown)
                ? getUserMessage(thrown)
                : 'We could not switch to this address.',
            });
          });
        }}
        onOpenActions={setSelectedId}
      />

      {/* Rendered only once the row is known: the sheet shows a real address or it does not open. */}
      {editModel === null ? null : (
        <AddressEditSheet
          visible
          edit={editModel}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            const id = selectedId;
            setSelectedId(null);
            router.push(
              (from === undefined
                ? `/address/details?addressId=${id ?? ''}`
                : `/address/details?addressId=${id ?? ''}&from=${from}`) as Href,
            );
          }}
          onDelete={() => {
            if (remove.isPending || selectedId === null) return;

            remove
              .mutateAsync(selectedId)
              .then(() => {
                // The list is invalidated by the mutation; closing is all this screen decides.
                setSelectedId(null);
              })
              .catch((thrown: unknown) => {
                setSelectedId(null);
                setError({
                  title: 'Couldn’t delete address',
                  body: isAppError(thrown)
                    ? getUserMessage(thrown)
                    : 'We could not delete this address.',
                });
              });
          }}
        />
      )}

      {/* FIGMA_PENDING — `228:1801` draws no failure state for either action. */}
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
