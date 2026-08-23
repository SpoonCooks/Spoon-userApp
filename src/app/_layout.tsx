import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isResolving } from '@core/auth';
import { QueryProvider, useAppStateFocus } from '@core/query';
import { createAppRuntime } from '@core/runtime';
import { RuntimeProvider } from '@core/runtimeContext';
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

  /**
   * Returning from WhatsApp, from Razorpay checkout or from the permission settings re-reads the
   * server state the screen is showing, and changes nothing about where the customer is (§19).
   * Mounted at the ROOT because it is a property of the app, not of any screen.
   */
  useAppStateFocus();

  // Every weight the design uses. RN cannot synthesise these — see tokens/primitives.ts.
  //
  // The faces are bundled under `assets/fonts/` and registered here under the SAME family names
  // the tokens emit, so `fontFamily: 'Livvic_600SemiBold'` resolves identically on both platforms.
  // They are loaded from the project's own asset directory rather than through
  // `@expo-google-fonts/livvic`, whose TTFs live inside `node_modules` — a path the app must not
  // depend on for shipped design assets (founder requirement §2).
  const [fontsLoaded, fontError] = useFonts({
    Livvic_400Regular: require('../../assets/fonts/Livvic-Regular.ttf'),
    Livvic_500Medium: require('../../assets/fonts/Livvic-Medium.ttf'),
    Livvic_600SemiBold: require('../../assets/fonts/Livvic-SemiBold.ttf'),
    Livvic_700Bold: require('../../assets/fonts/Livvic-Bold.ttf'),
    Livvic_900Black: require('../../assets/fonts/Livvic-Black.ttf'),
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
          <RuntimeProvider runtime={runtime}>
            <ThemeProvider>
              <ErrorBoundary scope="root">
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(app)" />
                </Stack>
              </ErrorBoundary>
            </ThemeProvider>
          </RuntimeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
