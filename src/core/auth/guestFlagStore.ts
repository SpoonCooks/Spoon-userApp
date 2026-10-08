import * as SecureStore from 'expo-secure-store';

/**
 * Whether this install last chose "Skip" on Login — the one fact that lets a relaunch land a
 * guest straight on Home instead of making them skip again every time.
 *
 * It is a preference, not a credential: it carries no token and opens no per-account read. It
 * lives beside the token keys only because this directory is the one place SecureStore may be
 * touched (eslint `SECURE_STORE`). Like `lastPhoneStore`, a Keychain item survives deleting the
 * app on iOS, so a reinstalled guest lands back on Home as a guest — harmless, since there is no
 * account behind it.
 *
 * Signing in and signing out both clear it (`sessionController`), so a customer who leaves guest
 * mode is never dropped back into it by a stale flag.
 */

const GUEST_KEY = 'spoon.auth.guest';

export interface GuestFlagStore {
  read(): Promise<boolean>;
  write(): Promise<void>;
  clear(): Promise<void>;
}

export async function readGuestFlag(): Promise<boolean> {
  return (await SecureStore.getItemAsync(GUEST_KEY)) === '1';
}

export async function writeGuestFlag(): Promise<void> {
  await SecureStore.setItemAsync(GUEST_KEY, '1');
}

export async function clearGuestFlag(): Promise<void> {
  await SecureStore.deleteItemAsync(GUEST_KEY);
}

export const secureGuestFlagStore: GuestFlagStore = {
  read: readGuestFlag,
  write: writeGuestFlag,
  clear: clearGuestFlag,
};
