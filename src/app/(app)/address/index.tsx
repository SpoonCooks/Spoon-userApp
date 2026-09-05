import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  AddressEditSheet,
  SavedAddressesView,
  useAddressEditData,
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
  useSavedAddressesData,
} from '@features/address';
import { getUserMessage, isAppError } from '@core/errors';
import { useAndroidBackHandler, useDeterministicBack } from '@core/navigation';
import { InfoDialog } from '@ui';

/**
 * Saved addresses — Figma `68:214`. A list screen, not a map screen.
 *
 * Tapping a saved row raises `228:1801`, the Edit / Delete sheet, FOR THAT ROW. The id the list
 * hands back is carried through to the sheet, to the edit route and to the delete call, so the
 * three can never disagree about which address is being acted on — the defect §5 was raised
 * against, where Edit opened a blank "add" form unrelated to the row that was tapped.
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
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(
    __DEV__ && typeof edit === 'string' && edit !== '' ? edit : null,
  );
  const { edit: editModel } = useAddressEditData(selectedId);
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  // The raw rows, because switching address replays the whole saved address (the API has no
  // partial update) and the list view model carries only what the list DRAWS.
  const addresses = useAddresses();
  const addressRows = addresses.state.status === 'ready' ? addresses.state.data : [];
  const [error, setError] = useState<string | null>(null);

  /**
   * `68:214` back -> `6:663` PROFILE (V7 founder comment, task §5/§15).
   *
   * Deterministic, so the destination is the one the routing matrix names rather than whichever
   * screen happens to sit underneath. This list is also reachable from Home's serving-at banner;
   * that entry now returns to Profile too, which is the founder's stated mapping and one tap from
   * Home either way.
   */
  const goBack = useDeterministicBack('/profile');

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
        onAdd={() => router.push('/address/location')}
        /**
         * `68:214` — a tap on a ROW switches the booking address and returns to Home.
         *
         * It used to call `setSelectedId`, which is what the `...` overflow does: both gestures
         * opened the edit sheet, so the list could rename addresses but never choose between
         * them. Every downstream read (header ETA, quote, availability) resolves `isDefault`, so
         * with nothing able to move that flag a second saved address was unreachable.
         *
         * Home is the destination rather than `goBack` because switching address is a decision
         * ABOUT booking, and Home is where booking starts — and its header is the confirmation
         * that the switch took effect. The list is invalidated by the mutation, so Home re-reads
         * rather than being handed a value from here.
         */
        onSelect={(id) => {
          if (setDefault.isPending) return;
          const chosen = addressRows.find((address) => address.id === id);
          if (chosen === undefined || chosen.isDefault) {
            router.replace('/home');
            return;
          }
          setDefault
            .mutateAsync(chosen)
            .then(() => router.replace('/home'))
            .catch((thrown: unknown) => {
              setError(
                isAppError(thrown)
                  ? getUserMessage(thrown)
                  : 'We could not switch to this address.',
              );
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
            router.push(`/address/details?addressId=${id ?? ''}`);
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
                setError(
                  isAppError(thrown) ? getUserMessage(thrown) : 'We could not delete this address.',
                );
              });
          }}
        />
      )}

      {/* FIGMA_PENDING — `228:1801` draws no failure state for either action. */}
      <InfoDialog
        visible={error !== null}
        onClose={() => setError(null)}
        title="Couldn’t delete address"
        body={error ?? ''}
        testID="address-delete-error"
      />
    </>
  );
}
