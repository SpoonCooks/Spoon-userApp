import * as SecureStore from 'expo-secure-store';

import { readLastPhone, writeLastPhone } from './lastPhoneStore';

describe('lastPhoneStore', () => {
  it('round-trips the last signed-in number', async () => {
    await writeLastPhone('+919876543210');

    await expect(readLastPhone()).resolves.toBe('+919876543210');
  });

  it('returns null when nothing has ever been stored', async () => {
    await SecureStore.deleteItemAsync('spoon.auth.lastPhone');

    await expect(readLastPhone()).resolves.toBeNull();
  });

  it('is not touched by clearing the token keys — sign-out must not forget it', async () => {
    await writeLastPhone('+919876543210');
    await Promise.all([
      SecureStore.deleteItemAsync('spoon.auth.accessToken'),
      SecureStore.deleteItemAsync('spoon.auth.refreshToken'),
      SecureStore.deleteItemAsync('spoon.auth.expiresAt'),
    ]);

    await expect(readLastPhone()).resolves.toBe('+919876543210');
  });
});
