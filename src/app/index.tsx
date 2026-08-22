import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';

import { canAccessApp, isResolving } from '@core/auth';
import { useSessionStore } from '@core/store';
import { useAddressGate } from '@features/address';
import { SplashLoading } from '@features/loading';
import { useProfileGate } from '@features/profile';

/**
 * The BOOT GATE — the app's one decision about where a launch lands (task §14).
 *
 * Holds on the DESIGNED splash (`73:1036`) until every question it asks has an answer, then
 * redirects once. No product rule is invented here; it reads three gates and orders them:
 *
 *   NOT AUTHENTICATED                     -> `/login`
 *   PROFILE INCOMPLETE                    -> `338:4508` Profile details, first-run context
 *   PROFILE COMPLETE, NO ADDRESS          -> `53:31`   Select service location
 *   PROFILE COMPLETE, ADDRESS SAVED       -> `/home`
 *
 * ## Why the gates are read HERE and not on Home
 *
 * The address gate used to live on Home alone: `/` sent every signed-in launch to `/home`, Home
 * mounted, the address list resolved, and Home then redirected into `53:31`. That renders Home —
 * banner, carousel, tiles — for the duration of a network round trip before replacing it, which
 * is exactly the "briefly show Home then redirect" §14 forbids. Asking at `/`, while the splash
 * is still up, makes the whole decision happen behind a surface the customer already expects to
 * wait on.
 *
 * Home KEEPS its own redirect. It is no longer the first answer, it is the standing one: an
 * address can be deleted from `68:214` mid-session, and Home must not become a screen whose
 * booking CTAs can never enable. The two agree because they read the same gate.
 *
 * ## Ordering
 *
 * Profile is asked BEFORE address, because the founder's first-run sequence is
 * Login -> OTP -> Profile details -> Address -> Home. A customer with neither owes the profile
 * page first, and reaches the address flow through `338:4558` Confirm rather than from here.
 *
 * ## This is the ONLY full-screen loading surface (task §13 / §25)
 *
 * Both gates report `resolving` while their reads are in flight, and the splash is held for that.
 * It is the same wait the session bootstrap already owned — the app is still opening. Nothing
 * downstream of this screen shows a full-screen loader again.
 *
 * ## Failure
 *
 * Both gates fail OPEN: an errored read reports `satisfied`, so a launch with no network lands on
 * Home with Home's own error state rather than being pinned to a mandatory form it cannot submit
 * or a map it cannot check. See `useProfileGate` for why that is the safer direction.
 */
export default function Index() {
  const status = useSessionStore((state) => state.status);
  const authenticated = canAccessApp(status);

  // Neither read is fired until the session is proved: a `/me` or `/me/addresses` sent while
  // signed out 401s and burns a refresh against the token family.
  const profileGate = useProfileGate({ enabled: authenticated });
  const addressGate = useAddressGate({ enabled: authenticated });

  if (isResolving(status)) {
    return <SplashLoading />;
  }

  if (!authenticated) {
    return <Redirect href="/login" />;
  }

  // Still opening. Holding here is what stops the flicker: every downstream destination is a
  // `Redirect`, so the first screen the customer sees is the right one.
  if (profileGate === 'resolving' || addressGate === 'resolving') {
    return <SplashLoading />;
  }

  if (profileGate === 'required') {
    return <Redirect href={'/profile/details?context=onboarding' as Href} />;
  }

  if (addressGate === 'required') {
    // `onboarding=1` is what tells `53:31` to draw no back control and to end at Home.
    return <Redirect href={'/address/location?onboarding=1' as Href} />;
  }

  return <Redirect href="/home" />;
}
