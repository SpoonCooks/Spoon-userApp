import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';

import type { PushTokenProvider } from './pushApi';

/**
 * The real push-token provider — `expo-notifications`, filling the `PushTokenProvider` seam.
 *
 * ## Why the FCM token, and why iOS gets it from somewhere else
 *
 * The backend sends through FCM directly (its worker owns the outbox and the send) and has no
 * APNs path anywhere in it, so what it needs is an FCM registration token on BOTH platforms.
 *
 * On Android `getDevicePushTokenAsync` returns exactly that, and nothing here changes it.
 *
 * On iOS it returns a raw APNs device token — a different identifier for a different service,
 * which FCM's `messages:send` rejects. That is why iOS push had never worked: tokens registered
 * successfully, the backend stored them, and every send failed on a token it could not address.
 * So iOS asks the Firebase SDK instead, which mints a real FCM token from the APNs one behind the
 * scenes. That needs `GoogleService-Info.plist` in the build and an APNs auth key uploaded to the
 * Firebase console; without either, this reports `native-unavailable` rather than inventing one.
 *
 * `getExpoPushTokenAsync` is not used on either platform: it returns a token only Expo's relay
 * can deliver to, and the backend does not use that relay.
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

/**
 * An FCM registration token, from whichever SDK produces one on this platform.
 *
 * Android's comes from `expo-notifications`, which is already an FCM token there and is left
 * exactly as it was -- that path works and is not worth disturbing to unify a code shape.
 *
 * iOS asks Firebase. `registerDeviceForRemoteMessages` is the APNs registration the SDK needs
 * before it can exchange an APNs token for an FCM one; it is checked rather than called blindly
 * because calling it when already registered is wasted work on every cold start.
 *
 * Returns null rather than throwing on an empty string, so the caller reports `empty-token`
 * instead of `native-unavailable` -- they are different faults and the log should say which.
 */
async function fcmTokenFor(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    const messaging = getMessaging();
    if (!isDeviceRegisteredForRemoteMessages(messaging)) {
      await registerDeviceForRemoteMessages(messaging);
    }

    const token = await getToken(messaging);
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  return typeof token.data === 'string' && token.data.length > 0 ? token.data : null;
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

        const token = await fcmTokenFor();
        if (token !== null) return token;

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
