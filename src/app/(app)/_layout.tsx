import { Stack } from 'expo-router';

import { ErrorBoundary } from '@ui';

/**
 * Authenticated shell.
 *
 * A single stack, deliberately. Whether a bottom tab bar exists is unconfirmed — no tab bar
 * appears on any of the 50 audited frames — and ruling R-5 (active bookings live on Home)
 * removes the need to guess. Committing to tabs now would risk the wrong shell.
 */
export default function AppLayout() {
  return (
    <ErrorBoundary scope="app-shell">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
