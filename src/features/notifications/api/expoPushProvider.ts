import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PushTokenProvider } from './pushApi';

/**
 * The real push-token provider — `expo-notifications`, filling the `PushTokenProvider` seam.
 *
 * ## Why the DEVICE token, not the Expo token
 *
 * The backend sends through FCM directly (its worker owns the outbox and the send), so what it
 * needs is the FCM registration token — which is what `getDevicePushTokenAsync` returns on
 * Android. `getExpoPushTokenAsync` would return a token only Expo's own relay can deliver to,
 * and the backend does not use that relay. Registering one would look like success and deliver
 * nothing.
 *
 * ## Why every failure is `null`, never a throw and never a placeholder
 *
 * A device with no Firebase configuration, a customer who declined the prompt, and an emulator
 * with no Play Services all reach this code, and none of them is an error the customer should
 * see: push is an enhancement, and the app works without it. What must NOT happen is a
 * fabricated token reaching `PUT /v1/me/push-token`, because the backend would then hold a
 * token that silently fails forever — so the seam returns "no token" and registration is
 * skipped.
 *
 * ## CONFIGURATION_GAP
 *
 * Android FCM needs a `google-services.json` for this app's package, and there is none in the
 * repo. Until it exists, `getDevicePushTokenAsync` cannot return a token on Android and this
 * provider returns null every time — correctly, and without pretending otherwise.
 */

/**
 * Android requires a channel before anything can be shown, and one created at send time gets the
 * OS defaults. Created here so the app's notifications are grouped and sound as intended.
 *
 * `default` is deliberately the only channel: the design does not distinguish notification
 * types, and channels are customer-visible settings, so inventing categories nobody asked for
 * would leave permanent clutter in the system UI.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Booking updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // A channel that cannot be created is not worth failing a launch over.
  }
}

export const expoPushTokenProvider: PushTokenProvider = {
  async getToken(): Promise<string | null> {
    try {
      await ensureAndroidChannel();

      const existing = await Notifications.getPermissionsAsync();
      let granted = existing.granted;

      // Asked only when the OS still allows asking. Re-prompting a customer who has already
      // declined does nothing on both platforms and is why `canAskAgain` is checked first.
      if (!granted && existing.canAskAgain) {
        const requested = await Notifications.requestPermissionsAsync();
        granted = requested.granted;
      }
      if (!granted) return null;

      const token = await Notifications.getDevicePushTokenAsync();
      return typeof token.data === 'string' && token.data.length > 0 ? token.data : null;
    } catch {
      // No Firebase config, no Play Services, or no native module. All "no token".
      return null;
    }
  },
};
