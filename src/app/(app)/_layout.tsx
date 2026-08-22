import { Redirect, Stack } from 'expo-router';

import { canAccessApp, isResolving } from '@core/auth';
import { useSessionStore } from '@core/store';
import { usePushNotifications } from '@features/notifications';
import { ErrorBoundary } from '@ui';

/**
 * Authenticated shell.
 *
 * A single stack, deliberately. Whether a bottom tab bar exists is unconfirmed — no tab bar
 * appears on any of the 50 audited frames — and ruling R-5 (active bookings live on Home)
 * removes the need to guess. Committing to tabs now would risk the wrong shell.
 *
 * Push lives HERE rather than at the root: registration and the permission prompt belong to an
 * authenticated customer (§45), and mounting it in the root layout would run it on the login
 * screen, where the prompt has nothing to explain itself with and the token has no account to
 * attach to.
 *
 * ## Why the shell watches the session
 *
 * The boot gate at `/` decides where a LAUNCH lands. It cannot decide anything about a session
 * that dies while the customer is already inside the app — a refresh token revoked server-side,
 * a family killed by reuse detection, a token that simply ran out — because `/` is not mounted
 * any more. Before this, an expiry mid-session left the customer on a live-looking Home whose
 * every read 401s, with no route out.
 *
 * So the shell asks the same question `/` asks, continuously: may these routes render at all?
 * `canAccessApp` covers `authenticated` and `refreshing`, so an in-flight single-flight refresh
 * does NOT evict anyone — only a session that has actually failed does. `isResolving` holds
 * during bootstrap so a cold start into a deep link is not bounced before its tokens are read.
 *
 * The redirect targets `/login`, which lives in the `(auth)` group and therefore outside this
 * layout, so the two cannot ping-pong. Signing in again dispatches `SIGNED_IN`, which now moves
 * `expired` back to `authenticated` (see `sessionMachine`), and the customer re-enters here.
 */
export default function AppLayout() {
  const status = useSessionStore((state) => state.status);
  usePushNotifications();

  if (!isResolving(status) && !canAccessApp(status)) {
    return <Redirect href="/login" />;
  }

  return (
    <ErrorBoundary scope="app-shell">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
