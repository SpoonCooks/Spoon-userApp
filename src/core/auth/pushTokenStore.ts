import * as SecureStore from 'expo-secure-store';

/**
 * The push token this install last registered with `PUT /v1/me/push-token`.
 *
 * The notifications feature owns what it means; this module only stores the string, like
 * `lastPhoneStore` and `triedPlaceStore`, because SecureStore is reachable only from here.
 *
 * Why it is kept at all: a customer who switches notifications off in phone Settings and then
 * relaunches produces no fresh token (the provider returns null without permission), yet the
 * backend still holds the old one marked enabled — and would keep sending a silent push instead of
 * the SMS fallback. Re-sending this value with `notificationsEnabled: false` is what corrects it.
 *
 * Deliberately NOT cleared on sign-out: the token belongs to the handset, not the account, and
 * re-sending it under the next account is exactly what moves it there.
 */
const LAST_PUSH_TOKEN_KEY = 'spoon.notifications.lastPushToken';

export async function readLastPushToken(): Promise<string | null> {
  const value = await SecureStore.getItemAsync(LAST_PUSH_TOKEN_KEY);
  return value !== null && value.length > 0 ? value : null;
}

export async function writeLastPushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(LAST_PUSH_TOKEN_KEY, token);
}
