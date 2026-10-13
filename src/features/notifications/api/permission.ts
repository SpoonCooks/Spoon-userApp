import * as Notifications from 'expo-notifications';
import type { NotificationPermissionsStatus } from 'expo-notifications';

/**
 * Whether this phone will actually SHOW a notification from the app right now.
 *
 * Sent as `notificationsEnabled` with every push-token registration, so the backend can fall back
 * to SMS (for the "Spoon is now live in your area" notice) instead of a push nobody sees.
 *
 * iOS `provisional` (delivered quietly to Notification Centre) and `ephemeral` (App Clips) both
 * deliver, so both count as enabled. `denied` and `undetermined` do not: an undetermined customer
 * has never seen a notification from us and will not until they answer the prompt.
 */
export function isNotificationsEnabled(permissions: NotificationPermissionsStatus): boolean {
  if (permissions.granted) return true;
  const iosStatus = permissions.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

/**
 * READS the current permission. Never requests it: the one prompt stays where it always was, in
 * the token provider, at sign-in.
 *
 * A read that throws (no native module) is treated as "not enabled" — the conservative answer,
 * since it only ever makes the backend choose SMS over a push.
 */
export async function readNotificationsEnabled(): Promise<boolean> {
  try {
    return isNotificationsEnabled(await Notifications.getPermissionsAsync());
  } catch {
    return false;
  }
}
