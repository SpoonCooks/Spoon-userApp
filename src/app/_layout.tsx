import {
  Livvic_400Regular,
  Livvic_500Medium,
  Livvic_600SemiBold,
  Livvic_700Bold,
  Livvic_900Black,
  useFonts,
} from '@expo-google-fonts/livvic';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isResolving } from '@core/auth';
import { QueryProvider } from '@core/query';
import { createAppRuntime } from '@core/runtime';
import { useSessionStore } from '@core/store';
import { ErrorBoundary, ThemeProvider } from '@ui';

/**
 * Root layout: providers, session bootstrap, splash hold.
 *
 * The splash holds until BOTH the session resolves (audit §R) and Livvic has loaded, then
 * `src/app/index.tsx` redirects. Holding on the font matters: the design is set in Livvic
 * throughout, and releasing early flashes the platform face and reflows every screen.
 * Tab structure is deliberately NOT committed — no tab bar has been visually confirmed, and
 * ruling R-5 removed the pressure to add one (active bookings live on Home).
 */

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const runtime = useMemo(() => createAppRuntime(), []);
  const status = useSessionStore((state) => state.status);

  // Every weight the design uses. RN cannot synthesise these — see tokens/primitives.ts.
  const [fontsLoaded, fontError] = useFonts({
    Livvic_400Regular,
    Livvic_500Medium,
    Livvic_600SemiBold,
    Livvic_700Bold,
    Livvic_900Black,
  });

  useEffect(() => {
    void runtime.session.bootstrap();
  }, [runtime]);

  useEffect(() => {
    // A font failure must not strand the user on the splash — fall through to the system face.
    if (!isResolving(status) && (fontsLoaded || fontError !== null)) {
      void SplashScreen.hideAsync();
    }
  }, [status, fontsLoaded, fontError]);

  if (!fontsLoaded && fontError === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider client={runtime.queryClient}>
          <ThemeProvider>
            <ErrorBoundary scope="root">
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
              </Stack>
            </ErrorBoundary>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
