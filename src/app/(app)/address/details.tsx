import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import {
  AddressDetailsView,
  addressCreateScope,
  useAddressDetailsData,
  useCreateAddress,
  useUpdateAddress,
} from '@features/address';
import type { AddressFormDraft } from '@features/address';
import { useAddressDraftStore } from '@core/store/addressDraftStore';
import { getUserMessage, isAppError } from '@core/errors';
import { useDeterministicBack } from '@core/navigation';
import { InfoDialog } from '@ui';

/**
 * Address details - Figma `60:655` (`18b`), for BOTH adding and editing.
 *
 * With `?addressId=<id>` this is the edit destination of `228:1801` (`18d`, task section 5):
 * the form opens PREFILLED with the saved record and Save issues `PUT /v1/me/addresses/:id`,
 * so the address keeps its identity and anything referencing it - a live booking's delivery
 * address - still resolves. Without the parameter it is the add flow, unchanged.
 *
 * The distinction is made by the PRESENCE OF AN ID rather than by a mode flag: an id is the
 * only thing that makes an update addressable, so there is no state in which the screen
 * believes it is editing but has nothing to edit.
 *
 * "Check Availability & Save" is now real: `POST /v1/me/addresses` with the coordinates the map
 * step obtained from the device. Serviceability was already checked against those exact
 * coordinates on the previous screen, and the backend checks again — the client asserts nothing
 * about coverage either time.
 *
 * The label chips, the free-text "Save as" and the receiver fields all persist on the address
 * record (B-13), which is why they are sent rather than kept locally.
 */
export default function AddressDetailsRoute() {
  const router = useRouter();
  const { addressId, onboarding } = useLocalSearchParams<{
    addressId?: string;
    onboarding?: string;
  }>();
  const editingId = typeof addressId === 'string' && addressId !== '' ? addressId : null;
  const { state, refetch, savedPoint, savedPlaceId, locationReady } =
    useAddressDetailsData(editingId);
  const draft = useAddressDraftStore((store) => store.draft);
  const clearDraft = useAddressDraftStore((store) => store.clear);
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [error, setError] = useState<string | null>(null);

  /**
   * Back and "Change area" are the SAME action, and both go to `53:31` — including on an EDIT.
   *
   * The founder's V7 routing matrix is explicit and unconditional: "Page 18b Complete address ->
   * Page 18a on back" (task §5, §15, §28). The superseded behaviour sent an edit to `68:214`
   * instead, reasoning that an edit never went through the map; the product decision overrides
   * that, and the chain it produces is coherent —
   *
   *   `68:214` -> `60:655` (prefilled) -> back -> `53:31` -> back -> `68:214`
   *
   * — provided the map step knows which record is in play. `addressId` therefore travels with it,
   * so walking back to the map and forward again is still an UPDATE of the same address and never
   * a second one (task §28, "must not duplicate records").
   */
  const goBack = useDeterministicBack(
    [
      onboarding === '1' ? 'onboarding=1' : null,
      editingId === null ? null : `addressId=${encodeURIComponent(editingId)}`,
    ]
      .filter((part): part is string => part !== null)
      .reduce<string>(
        (href, part, index) => `${href}${index === 0 ? '?' : '&'}${part}`,
        '/address/location',
      ) as Href,
  );

  return (
    <>
      <AddressDetailsView
        state={state}
        onRetry={refetch}
        onBack={goBack}
        onChangeArea={goBack}
        /**
         * The founder's rule, applied at its two ends: `locationReady` is the CONTEXT half of the
         * gate (a confirmed, server-approved point exists) and the form owns the FIELD half. Both
         * have to hold before `275:4485` leaves its grey state.
         *
         * The pending flag is the same one the handler guards on, so the CTA cannot be pressed a
         * second time while the first write is out — one tap, one address.
         */
        locationReady={locationReady}
        submitting={create.isPending || update.isPending}
        onSave={(form: AddressFormDraft) => {
          /**
           * Belt AND braces (task §J). The CTA is already disabled without a point, so this is
           * unreachable through the UI — it exists because a write is not something to leave
           * guarded by a style prop, and because a press can race the state that disabled it.
           */
          if (create.isPending || update.isPending) return;

          /**
           * The POINT this address is saved at, resolved before anything is sent.
           *
           * ADDING: the draft's, which only exists because `53:31` confirmed it and the server
           * approved it. EDITING: the record's own, unless the customer walked back to the map
           * and pinned a new one — re-sending a stale draft would silently MOVE an address they
           * were only renaming.
           *
           * `null` means there is no point, and there is then nothing to save. It used to be
           * `?? 0`, which sends the Gulf of Guinea to the backend as a real coordinate.
           */
          const point =
            draft.latitude !== null && draft.longitude !== null
              ? {
                  latitude: draft.latitude,
                  longitude: draft.longitude,
                  ...(draft.placeId === null ? {} : { placeId: draft.placeId }),
                }
              : savedPoint === null
                ? null
                : {
                    ...savedPoint,
                    ...(savedPlaceId === null ? {} : { placeId: savedPlaceId }),
                  };
          if (point === null) return;

          /**
           * The label the customer chose, as DRAWN.
           *
           * Others carries a free-text name and that name wins; every other chip stores its own
           * word ("Parents", not the `parents` id `68:214` would then have listed). The form
           * refuses to submit Others with an empty name, so the fallback chain never produces the
           * word "others" as a label. Nothing here interprets the string — the backend stores it.
           */
          const label =
            form.saveAs.trim() !== ''
              ? form.saveAs.trim()
              : form.labelText.trim() !== ''
                ? form.labelText.trim()
                : 'Home';

          const fields = {
            label,
            ...(form.flat.trim() === '' ? {} : { flat: form.flat.trim() }),
            ...(form.building.trim() === '' ? {} : { society: form.building.trim() }),
            // The geocoder's street is a prefill for a field the design does not draw, so it
            // is sent as-is; an empty one is sent as empty rather than guessed at.
            street: draft.street ?? form.building.trim(),
            pincode: draft.pincode ?? '',
            ...(draft.city === null ? {} : { city: draft.city }),
            ...(draft.state === null ? {} : { state: draft.state }),
            ...(form.receiverName.trim() === '' ? {} : { receiverName: form.receiverName.trim() }),
            ...(form.receiverPhone.trim() === ''
              ? {}
              : { receiverPhone: form.receiverPhone.trim() }),
          };

          const input = { ...fields, ...point };

          const saved =
            editingId === null
              ? create.mutateAsync({
                  input,
                  /*
                   * Scoped to the WHOLE submission, not to the point.
                   *
                   * A retry of an unchanged form is the same intent and reuses the same
                   * `Idempotency-Key`, which is what lets the backend replay the original result
                   * after an ambiguous timeout instead of creating a second address. Any edit —
                   * flat, building, label, receiver, or the point itself — is a different intent
                   * and mints a new key.
                   *
                   * Scoping to the coordinates alone got that backwards: the pin is the part a
                   * customer is least likely to move between attempts, so a corrected flat number
                   * was retried under the ORIGINAL key with a changed body, which the backend
                   * refuses with `IDEMPOTENCY_CONFLICT` — and the key is only released on success,
                   * so the screen stayed stuck on it. Measured on the handset.
                   *
                   * `addressCreateScope` derives the identity from the same function the request
                   * body is built by, so the two cannot drift.
                   */
                  scope: addressCreateScope(input),
                })
              : update.mutateAsync({
                  id: editingId,
                  input,
                });

          saved
            .then(() => {
              // The server owns the address now (§20). The draft has done its job.
              clearDraft();
              // Collapses the map/details pair the customer walked through, so the screen below is
              // the one they actually return to. Guarded: a deep link straight to this route has
              // nothing to dismiss, and popping an only-child throws the flow off the stack.
              if (router.canDismiss()) router.dismissAll();
              // Section 4: the first-run flow ends at HOME, because the customer came from Home
              // and wanted to book - not to administer a list. Reached from `68:214` instead,
              // the same save returns to that list, which is where they were.
              router.replace(onboarding === '1' ? '/home' : '/address');
            })
            .catch((thrown: unknown) => {
              // The backend refuses an unserviceable point here too; its own message is shown
              // rather than this screen deciding what went wrong.
              setError(
                isAppError(thrown) ? getUserMessage(thrown) : 'We could not save this address.',
              );
            });
        }}
      />

      {/* FIGMA_PENDING — `60:655` draws no failure state for the save. */}
      <InfoDialog
        visible={error !== null}
        onClose={() => setError(null)}
        title="Couldn’t save address"
        body={error ?? ''}
        testID="address-save-error"
      />
    </>
  );
}
