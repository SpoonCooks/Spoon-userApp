import { Redirect } from 'expo-router';

import { canAccessApp, isResolving } from '@core/auth';
import { useSessionStore } from '@core/store';
import { SplashLoading } from '@features/loading';

/**
 * Session gate. Holds on the DESIGNED splash (`73:1036`) until the session resolves, then routes
 * to the app shell or to auth. No product decision is made here.
 *
 * The splash's zoom is decorative: this component redirects when `status` changes, never when the
 * animation ends, so a slow session can never be "finished" by a timer (task §6).
 */
export default function Index() {
  const status = useSessionStore((state) => state.status);

  if (isResolving(status)) {
    return <SplashLoading />;
  }

  return <Redirect href={canAccessApp(status) ? '/home' : '/login'} />;
}
