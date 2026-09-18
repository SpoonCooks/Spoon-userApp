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
 * ## Why the reason is REPORTED even though the token is not
 *
 * "No token" has three unrelated causes — a declined prompt, a build with no Firebase config, and
 * a device that cannot produce one — and the app's behaviour is identical in all three: stay
 * quiet. That is right for the customer and useless for diagnosis, which is why push failing was
 * indistinguishable from push being switched off. `report` names the cause for the log without
 * changing what the customer sees.
 *
 * ## Android configuration — RESOLVED, verified 2026-09-18
 *
 * `google-services.json` is a FILE-type secret in the EAS `production` environment, so cloud
 * builds bake in Firebase project `august-dev-3b4bf` and a real token is returned. Verified on a
 * device: `notifications.register { registered: true }`.
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

/** Why no token came back. Each is a different thing to go and fix. */
export type PushTokenUnavailable =
  /** The customer declined, or the OS will no longer let us ask. Nothing to fix. */
  | 'permission-denied'
  /** Permission granted and the platform still returned nothing. */
  | 'empty-token'
  /** Threw: no Firebase config in the build, no Play Services, or no native module. */
  | 'native-unavailable';

/**
 * The real provider, with a channel for saying why it came back empty.
 *
 * `report` is called instead of throwing, and never with the token itself — a device token
 * identifies a handset and does not belong in a log line.
 */
export function createExpoPushTokenProvider(
  report: (reason: PushTokenUnavailable, error?: unknown) => void = () => {},
): PushTokenProvider {
  return {
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
        if (!granted) {
          report('permission-denied');
          return null;
        }

        const token = await Notifications.getDevicePushTokenAsync();
        if (typeof token.data === 'string' && token.data.length > 0) return token.data;

        report('empty-token');
        return null;
      } catch (error: unknown) {
        // No Firebase config, no Play Services, or no native module. All "no token".
        report('native-unavailable', error);
        return null;
      }
    },
  };
}

/** The silent default, for callers with no logger to hand. */
export const expoPushTokenProvider: PushTokenProvider = createExpoPushTokenProvider();
