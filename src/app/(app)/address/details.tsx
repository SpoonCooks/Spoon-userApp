import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import {
  AddressDetailsView,
  addressCreateScope,
  resolveAddressSavePoint,
  useAddressDetailsData,
  useCreateAddress,
  useUpdateAddress,
} from '@features/address';
import type { AddressFormDraft } from '@features/address';
import { useAddressDraftStore } from '@core/store/addressDraftStore';
import { getUserMessage, isAppError } from '@core/errors';
import { useSafeBack } from '@core/navigation';
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
  const { addressId, onboarding, from } = useLocalSearchParams<{
    addressId?: string;
    onboarding?: string;
    from?: string;
  }>();
  const editingId = typeof addressId === 'string' && addressId !== '' ? addressId : null;
  const { state, refetch, savedPoint, savedPlaceId, savedArea, locationReady } =
    useAddressDetailsData(editingId);
  const draft = useAddressDraftStore((store) => store.draft);
  const clearDraft = useAddressDraftStore((store) => store.clear);
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [error, setError] = useState<string | null>(null);

  /**
   * BACK and "Change area" are NO LONGER the same action (product decision reversed — see
   * below); the two are now separate handlers with separate reasoning.
   *
   * `onChangeArea`'s job never changes: it is a deliberate DIGRESSION to `53:31`, unconditional
   * regardless of how this screen was reached — an edit that never went through the map still
   * needs to be able to.
   *
   * PUSH, not the old `dismissAll` + `replace`: replacing destroyed THIS screen outright, so
   * there was nothing left to return to — back landed on the list instead of resuming the form,
   * and Confirm on the map pushed a SECOND, blank Details rather than the one being edited. A
   * push keeps this exact screen (with whatever the customer had already typed) alive
   * underneath, and `resume=1` tells the map's Confirm handler to pop back to it directly
   * instead of pushing a new one — see `location.tsx`. `addressId` still travels with it so the
   * round trip stays an UPDATE of the same address rather than a second one (task §28).
   */
  const goToLocation = () => {
    router.push(
      [
        'resume=1',
        onboarding === '1' ? 'onboarding=1' : null,
        editingId === null ? null : `addressId=${encodeURIComponent(editingId)}`,
        from === undefined ? null : `from=${from}`,
      ]
        .filter((part): part is string => part !== null)
        .reduce<string>(
          (href, part, index) => `${href}${index === 0 ? '?' : '&'}${part}`,
          '/address/location',
        ) as Href,
    );
  };

  /**
   * BACK — reverses the founder's V7 ruling that forced it through `53:31` even on an edit
   * (explicit product decision; the prior ruling is quoted in `goToLocation`'s sibling comment
   * for history). Product now wants an edit's back to return to `68:214` directly, the way it
   * did before that ruling.
   *
   * `useSafeBack`, not a fixed target: this screen has TWO genuinely different predecessors —
   * `location.tsx`'s confirm (add flow, or a "Change area" digression) really does sit under it,
   * while `address/index.tsx`'s "Edit" pushes here DIRECTLY, skipping the map. A plain pop
   * resolves to whichever one is actually true each time, which is exactly what's wanted now —
   * and, as a side effect, fixes the same "opening" animation defect fixed elsewhere on this
   * branch, since a real pop was never possible under the old unconditional replace.
   */
  const goBack = useSafeBack((from === undefined ? '/address' : `/address?from=${from}`) as Href);

  return (
    <>
      <AddressDetailsView
        state={state}
        onRetry={refetch}
        onBack={goBack}
        onChangeArea={goToLocation}
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
           * were only renaming. `resolveAddressSavePoint` is the single place that rule lives —
           * see its own comment in `features/address/validation.ts` for why.
           *
           * `null` means there is no point, and there is then nothing to save. It used to be
           * `?? 0`, which sends the Gulf of Guinea to the backend as a real coordinate.
           */
          const point = resolveAddressSavePoint(draft, editingId, savedPoint, savedPlaceId);
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
            /*
             * AREA: the draft's, then the address's own, then the form.
             *
             * The draft only carries an area when the customer went through the map step. An
             * EDIT that never did — renaming, or fixing a flat number — has an empty draft, and
             * reading `pincode` straight off it sent `''`. `PUT /v1/me/addresses/:id` requires a
             * pincode, so the backend refused the whole request with a 400 and the screen showed
             * "Couldn't save address" with no way through. Reproduced on the handset.
             *
             * `savedArea` is the same idea as `savedPoint` one field over: when there is no fresh
             * draft, an edit resends what the address already holds rather than blanking it.
             */
            street: draft.street ?? savedArea?.street ?? form.building.trim(),
            pincode: draft.pincode ?? savedArea?.pincode ?? '',
            ...(() => {
              const city = draft.city ?? savedArea?.city ?? null;
              return city === null ? {} : { city };
            })(),
            ...(() => {
              const state = draft.state ?? savedArea?.state ?? null;
              return state === null ? {} : { state };
            })(),
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
              // the same save returns to that list, which is where they were — carrying `from`
              // forward so THAT screen's own back control still knows which entry point this
              // whole trip started from, rather than losing it the moment this REPLACE fires.
              router.replace(
                (onboarding === '1'
                  ? '/home'
                  : from === undefined
                    ? '/address'
                    : `/address?from=${from}`) as Href,
              );
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
