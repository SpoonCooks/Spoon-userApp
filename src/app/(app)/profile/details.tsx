import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { QueryBoundary } from '@ui';
import { getUserMessage, normalizeError } from '@core/errors';
import { useAndroidBackHandler, useDeterministicBack } from '@core/navigation';
import { useAddressGate } from '@features/address';
import {
  ProfileDetailsView,
  useProfileDetailsData,
  useSaveProfileDetails,
} from '@features/profile';

/**
 * User profile details — Figma `338:4508` ("Page 17- profile"), wired to `PUT /v1/me/profile`.
 *
 * ## Two entry contexts, one screen (task §10)
 *
 * `FIRST_TIME_ONBOARDING` — reached from the boot gate at `/` after OTP, before any address
 *   exists. NON-SKIPPABLE: no back disc, and Android's hardware back is swallowed. Confirm saves
 *   and then opens `53:31` (Address 18a).
 *
 * `EDIT_EXISTING_PROFILE` — reached from `6:663`'s completion card, in either of its states.
 *   Opens PREFILLED, has a back control, and Confirm returns to `6:663`. It does NOT push the
 *   customer into the address flow: editing a preference is not onboarding.
 *
 * The context is an explicit parameter rather than something inferred from `profileComplete` or
 * from whether the stack can pop. Both of those would be wrong at the exact moment it matters: a
 * customer who saves their name becomes "complete" mid-flow, and a deep link into either context
 * has an empty stack.
 *
 * ## Why the save must land before the navigation
 *
 * `onSuccess` is the ONLY path that moves. A first-run customer whose `PUT` failed but who was
 * advanced anyway would reach Home with no profile at all and no way back to the page that
 * collects it — the screen is unreachable once onboarding is behind you. So a rejection keeps
 * them here with every answer intact and the reason on screen (task §7: no fake local success).
 */

/** The two contexts, spelled out so a typo in a link is a missing prefill, not a wrong flow. */
const ONBOARDING = 'onboarding';

export default function ProfileDetailsRoute() {
  const router = useRouter();
  const { context } = useLocalSearchParams<{ context?: string }>();
  const onboarding = context === ONBOARDING;

  const { state, refetch } = useProfileDetailsData();
  const save = useSaveProfileDetails();

  /**
   * Where a first-run Confirm actually lands.
   *
   * The founder's sequence is Profile details -> Address, but "-> Address" is not unconditional:
   * a customer can owe the profile page while ALREADY having a saved address. That is not
   * hypothetical — the boot gate opens this page whenever the server reports the profile
   * incomplete, and the day the completeness rule widens to V8's three starred fields, every
   * existing account with an address becomes exactly that case. Sending them into `53:31` would
   * drop them on a first-run map with NO back control, asking for an address they already have.
   *
   * So the address gate is asked here too, and it is the same gate `/` and Home read. Onboarding
   * continues to `53:31` only while there is genuinely no address; otherwise it finishes at Home.
   */
  const addressGate = useAddressGate();

  /**
   * Edit returns to `6:663` deterministically — the founder's "back → Page 16", and correct for a
   * deep link too, where there is nothing to pop.
   */
  const goBack = useDeterministicBack('/profile');

  /**
   * FIRST RUN: hardware back is swallowed.
   *
   * `true` means "handled", so the navigator never sees it and the OS never finishes the activity.
   * Without this, Android's back on a screen that is the only stack entry would close the app —
   * which is not "skipping" onboarding, but it does leave a customer who taps back staring at
   * their launcher mid-signup. On the EDIT context the handler returns `false` and back behaves
   * normally.
   *
   * Nothing else on this screen owns dismissible state, so this is the whole handler.
   */
  useAndroidBackHandler(() => onboarding);

  /**
   * A rejected save must ALWAYS produce a visible reason.
   *
   * `normalizeError` rather than an `isAppError` guard: the guard silently dropped anything the
   * transport had not already classified, and "the CTA spun and then nothing happened" is the
   * worst possible outcome on a page the customer cannot leave. Normalising means an unclassified
   * failure still lands in the taxonomy and still gets a sentence.
   */
  const error = save.error === null ? undefined : getUserMessage(normalizeError(save.error));

  return (
    <QueryBoundary state={state} onRetry={refetch} loadingVariant="screen">
      {(data) => (
        <ProfileDetailsView
          // PREFILLED from `GET /v1/me`. Only `name` can be restored today — see
          // `detailsData.ts` and `docs/FRONTEND_BACKEND_PENDING.md` for the six that cannot.
          initialValues={data.values}
          // Absent on first run: the page is the one step onboarding cannot skip, so a back
          // control there is either inert or an escape from it.
          onBack={onboarding ? undefined : goBack}
          submitting={save.isPending}
          {...(error === undefined ? {} : { errorMessage: error })}
          onSubmit={(values) => {
            save.save(values, {
              onSuccess() {
                if (onboarding) {
                  /*
                   * `replace`, so back cannot return to a page that has already been answered and
                   * saved. `onboarding=1` is the FLOW CONTEXT `53:31` turns on: it is what draws
                   * no back control there and what makes the flow end at Home rather than at the
                   * saved-address list. Omitting it would give a first-run customer a chevron
                   * back into a profile page they have finished.
                   */
                  router.replace(
                    (addressGate === 'required'
                      ? '/address/location?onboarding=1'
                      : '/home') as Href,
                  );
                  return;
                }
                // Page 16 re-reads `auth.me`, which the mutation has just invalidated, so the
                // completion card is already correct when it renders (task §12).
                goBack();
              },
            });
          }}
        />
      )}
    </QueryBoundary>
  );
}
