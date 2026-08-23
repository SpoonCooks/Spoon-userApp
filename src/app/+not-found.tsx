import { Redirect } from 'expo-router';

import { canAccessApp, isResolving } from '@core/auth';
import { useSessionStore } from '@core/store';
import { SplashLoading } from '@features/loading';

/**
 * Unknown route (task §20).
 *
 * Any `spoon://` link this build does not recognise lands here — a stale deep link from an older
 * release, a malformed notification, a typo in a share. It used to render `RouteScaffold`, a
 * development stub reading "FOUNDATION PLACEHOLDER · Not found" with no control on it at all:
 * a genuine dead end, and in a release build, developer text shown to a customer.
 *
 * It now does what §20 asks — sends them to a safe root — and picks that root the SAME way `/`
 * does, off the session machine, so an unknown link received while signed out opens Login rather
 * than bouncing off an authenticated route it cannot render.
 *
 * A redirect rather than a screen: there is nothing to say. The customer followed a link, and the
 * useful outcome is the app, not an apology for it.
 */
export default function NotFoundRoute() {
  const status = useSessionStore((state) => state.status);

  // The session has not resolved yet, so neither destination is knowable. Holding on the designed
  // splash is the same wait `/` performs, and it cannot strand anyone: `status` always settles.
  if (isResolving(status)) {
    return <SplashLoading />;
  }

  return <Redirect href={canAccessApp(status) ? '/home' : '/login'} />;
}
