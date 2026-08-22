import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * Bridges React Native's `AppState` to React Query's focus manager (task §19).
 *
 * ## The defect this closes
 *
 * `createQueryClient` sets `refetchOnWindowFocus: true`, and on React Native that setting did
 * NOTHING. Focus is a DOM concept; React Query's default focus source listens for `visibilitychange`
 * on `document`, which does not exist here, so the app was never told it had come back.
 *
 * That matters precisely where §19 says it does. The customer leaves the app to pay in Razorpay,
 * to message Spoon on WhatsApp, or to grant a location permission in Settings, and comes back to
 * whatever the cache held when they left — a booking still showing "on hold" after it was paid,
 * an en-route card frozen at the ETA from five minutes ago. The screen looks broken, and the only
 * fix available to the customer is to kill the app.
 *
 * ## What it does NOT do
 *
 * It does not navigate. Returning to the app leaves the customer exactly where they were, which is
 * the other half of §19 — a foreground event is a reason to re-read data, never a reason to reset
 * someone to Home. It also does not force anything: `staleTime` still applies, so a screen read
 * two seconds before the customer switched apps does not re-fetch when they switch back.
 *
 * `active` is the only state treated as focused. Android's `inactive` does not occur, and on iOS
 * it covers the transitional moments — the app switcher, a system prompt over the app — where the
 * customer can see the screen but has not returned to it.
 */
export function useAppStateFocus(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      // Web has a real `visibilitychange`, and letting both sources drive the manager would make
      // them fight. Native is the only place this bridge is needed.
      if (Platform.OS === 'web') return;
      focusManager.setFocused(status === 'active');
    });

    return () => subscription.remove();
  }, []);
}
