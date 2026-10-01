import * as SecureStore from 'expo-secure-store';

/**
 * The E.164 number from this install's last successful sign-in.
 *
 * Login never autofills on its own — the server-side session is gone the moment sign-out or a
 * reinstall happens — so repeating a ten-digit number by hand every time is friction nothing
 * else here removes. This is what `LoginScreen`'s `initialPhone` prop reads from.
 *
 * Lives in SecureStore, not AsyncStorage, for one specific reason: Keychain items survive app
 * deletion on iOS by default, so a customer who deletes and reinstalls still sees their own
 * number on Login. SecureStore's Android implementation (Keystore-backed) does NOT survive an
 * uninstall — Android has no equivalent of Keychain's persistence, and nothing in this module
 * can change that; the prefill still works there after a plain sign-out, just not a reinstall.
 *
 * Sign-out deliberately never clears this key. `tokenStore.clear()` removes only the three keys
 * it owns (see `sessionController.ts`), so a signed-out customer still gets their own number
 * prefilled next time — that is the point of the feature, not an oversight.
 */

const LAST_PHONE_KEY = 'spoon.auth.lastPhone';

export async function readLastPhone(): Promise<string | null> {
  return SecureStore.getItemAsync(LAST_PHONE_KEY);
}

export async function writeLastPhone(phoneE164: string): Promise<void> {
  await SecureStore.setItemAsync(LAST_PHONE_KEY, phoneE164);
}
