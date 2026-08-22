import { useMemo } from 'react';

import { ready } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useMe, useUpdateProfile } from '@features/auth';
import type { MeResponse, ProfileUpdateRequest } from '@features/auth';

import { EMPTY_PROFILE_DETAILS } from './validation';
import type { ProfileDetailsValues } from './validation';

/**
 * `338:4508` - the profile-details data layer.
 *
 * ## What persists
 *
 * All eight answers. `user_profiles` carries a column for each, `PUT /v1/me/profile` accepts
 * them and `GET /v1/me` projects them back inlined beside the identity, so the page prefills on
 * edit and survives a reinstall.
 *
 * This module is where the form's shape and the wire's shape are reconciled, in both directions
 * and in one place. Two of the eight need reconciling at all; the other six are already the same
 * value on both sides, because the canonical option ids in `fields.ts` were adopted verbatim by
 * the contract and no translation layer was ever needed.
 *
 * ## The two that differ, and why the difference is not symmetrical
 *
 * `pressingIssue` is `string` on the form and `string | null` on the wire. The screen's
 * `TextInput` has no third state - an untouched box and an emptied one are both `''` - while the
 * contract treats a blank string as `null` anyway ("a cleared text box and an unanswered
 * question are one fact"). So the collapse is done HERE, explicitly, rather than relied on from
 * the server: what is sent says exactly what is meant.
 *
 * `grownUpEating` is `readonly string[]` on the form and `string[] | null` on the wire, where
 * `null` (never answered, or cleared) and `[]` (answered, then emptied) are DIFFERENT facts the
 * contract keeps apart. The form genuinely cannot draw that difference - no chips is no chips -
 * so `null` is collapsed to `[]` for DISPLAY, and `[]` is sent as `[]`. The collapse is one-way
 * on purpose: sending `null` for an empty chip row would claim the customer never answered,
 * which is a claim the screen has no evidence for.
 *
 * ## Why the whole form is submitted rather than a diff
 *
 * `PUT /v1/me/profile` is a PATCH - an omitted key preserves its stored answer - so a diff is
 * expressible. It is not what happens. The page opens PREFILLED from `/me`, so an untouched
 * field already holds its own saved value and round-trips it unchanged; and a field the customer
 * deliberately deselected holds `null`, which the contract reads as the clear it is. Submitting
 * everything makes "what the screen shows" and "what is stored" the same object, and removes the
 * class of bug where a diff computed against a stale prefill silently drops an answer.
 *
 * ## Completeness is the SERVER's answer
 *
 * `profileComplete` is read verbatim and never recomputed here (task S9). The server's rule is
 * `name` AND `mealStructure` AND `dietaryPreference` - the same three starred fields
 * `canSubmitProfileDetails` gates the CTA on, and the exact inverse of the `onboardingRequired`
 * that `/auth/otp/verify` reports. The two agree today; if they ever diverge the server wins,
 * because a client-side copy of the rule would disagree with every other surface.
 */

/**
 * `GET /v1/me` -> the form's starting values.
 *
 * Every answer is restored. `EMPTY_PROFILE_DETAILS` remains the base so a field the contract has
 * not yet grown still opens blank rather than `undefined` - the form's shape is owned by
 * `validation.ts`, not by whatever the wire happened to carry.
 */
export function profileDetailsFromMe(me: MeResponse): ProfileDetailsValues {
  return {
    ...EMPTY_PROFILE_DETAILS,
    name: me.name ?? '',
    householdStructure: me.householdStructure,
    mealStructure: me.mealStructure,
    // `null` and `''` are the same unanswered box to a `TextInput`.
    pressingIssue: me.pressingIssue ?? '',
    dietaryPreference: me.dietaryPreference,
    // Display-only collapse. See the module note: it is deliberately not reversed on the way out.
    grownUpEating: me.grownUpEating ?? [],
    regionPreference: me.regionPreference,
    genderPreference: me.genderPreference,
  };
}

/**
 * The form -> `PUT /v1/me/profile`.
 *
 * Text is TRIMMED, so what cleared the CTA gate is exactly what is stored, and a name of `'   '`
 * can neither pass the gate nor be written as blank. An emptied pressing-issue box becomes an
 * explicit `null`: the customer cleared it, and the contract has a value for that.
 *
 * The single-selects pass their `null` through untouched - that is a deselection, and the
 * contract clears on `null`. Nothing here decides whether a `null` is allowed; the CTA gate
 * already refused to submit while a REQUIRED field held one.
 */
export function profileUpdateFrom(values: ProfileDetailsValues): ProfileUpdateRequest {
  const pressingIssue = values.pressingIssue.trim();

  return {
    name: values.name.trim(),
    householdStructure: values.householdStructure,
    mealStructure: values.mealStructure,
    pressingIssue: pressingIssue === '' ? null : pressingIssue,
    dietaryPreference: values.dietaryPreference,
    grownUpEating: [...values.grownUpEating],
    regionPreference: values.regionPreference,
    genderPreference: values.genderPreference,
  };
}

export interface ProfileDetailsData {
  readonly values: ProfileDetailsValues;
  /** The server's verdict, read verbatim. */
  readonly profileComplete: boolean;
}

/** Prefill for both entry contexts. The screen mounts only once this is `ready`. */
export function useProfileDetailsData(): ScreenQuery<ProfileDetailsData> {
  const me = useMe();

  const state = useMemo(() => {
    if (me.state.status !== 'ready') return me.state;
    return ready({
      values: profileDetailsFromMe(me.state.data),
      profileComplete: me.state.data.profileComplete,
    });
  }, [me.state]);

  return { state, refetch: me.refetch };
}

/**
 * Save.
 *
 * Wraps `useUpdateProfile` - `PUT /v1/me/profile` - which merges the committed reply into
 * `auth.me` and then invalidates it. That is what makes task §12 work: Page 16 reads the same
 * key, so the completion card flips from "incomplete" to "completed" as soon as the write lands,
 * with no restart and no stale read.
 *
 * The caller hands over the whole form and the whole form is what goes out. This function's one
 * remaining job is the shape conversion, which is `profileUpdateFrom`'s.
 */
export function useSaveProfileDetails() {
  const update = useUpdateProfile();

  return {
    ...update,
    save(values: ProfileDetailsValues, options?: { onSuccess?: () => void }) {
      update.mutate(profileUpdateFrom(values), {
        ...(options?.onSuccess === undefined ? {} : { onSuccess: options.onSuccess }),
      });
    },
  };
}

/**
 * The BOOT question: does this customer still owe profile onboarding?
 *
 * Shaped exactly like `useAddressGate`, including its fail-open: an ERRORED `/me` reports
 * `satisfied`. That is deliberate and it is the safer failure. A customer who opens the app on a
 * train would otherwise be pinned to a mandatory form they cannot submit, with no back control
 * (the page is non-skippable) and no way to reach Home — the read failed, so the app does not
 * know they owe anything, and it must not act as if it does. The prompt on `6:663` catches them
 * the moment the read succeeds.
 *
 * `enabled` is for the gate at `/`, which asks before the session is proved: a `GET /v1/me` fired
 * while signed out 401s and burns a refresh.
 */
export type ProfileGate = 'resolving' | 'required' | 'satisfied';

export function useProfileGate(options: { enabled?: boolean } = {}): ProfileGate {
  const me = useMe({ enabled: options.enabled ?? true });

  if (options.enabled === false) return 'resolving';
  if (me.state.status === 'loading') return 'resolving';
  if (me.state.status !== 'ready') return 'satisfied';
  return me.state.data.profileComplete ? 'satisfied' : 'required';
}
