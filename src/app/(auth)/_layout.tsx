import { Stack } from 'expo-router';

import { ErrorBoundary } from '@ui';

export default function AuthLayout() {
  return (
    <ErrorBoundary scope="auth">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
