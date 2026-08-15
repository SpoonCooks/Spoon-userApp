import * as SecureStore from 'expo-secure-store';

import { isExpired, secureTokenStore } from './tokenStore';
import type { SessionTokens } from './tokenStore';

const TOKENS: SessionTokens = {
  accessToken: 'access-abc',
  refreshToken: 'refresh-xyz',
  expiresAt: 1_700_000_000_000,
};

describe('secureTokenStore', () => {
  it('round-trips the minimum token set', async () => {
    await secureTokenStore.write(TOKENS);

    await expect(secureTokenStore.read()).resolves.toEqual(TOKENS);
  });

  it('returns null when nothing is stored', async () => {
    await secureTokenStore.clear();

    await expect(secureTokenStore.read()).resolves.toBeNull();
  });

  it('returns null when the stored set is incomplete', async () => {
    await secureTokenStore.write(TOKENS);
    await SecureStore.deleteItemAsync('spoon.auth.refreshToken');

    await expect(secureTokenStore.read()).resolves.toBeNull();
  });

  it('returns null when the stored expiry is not a number', async () => {
    await secureTokenStore.write(TOKENS);
    await SecureStore.setItemAsync('spoon.auth.expiresAt', 'not-a-number');

    await expect(secureTokenStore.read()).resolves.toBeNull();
  });

  it('clears every key on sign-out', async () => {
    await secureTokenStore.write(TOKENS);
    await secureTokenStore.clear();

    await expect(SecureStore.getItemAsync('spoon.auth.accessToken')).resolves.toBeNull();
    await expect(SecureStore.getItemAsync('spoon.auth.refreshToken')).resolves.toBeNull();
    await expect(SecureStore.getItemAsync('spoon.auth.expiresAt')).resolves.toBeNull();
  });
});

describe('isExpired', () => {
  const now = 1_000_000;

  it('is false well before expiry', () => {
    expect(isExpired({ ...TOKENS, expiresAt: now + 120_000 }, now)).toBe(false);
  });

  it('is true after expiry', () => {
    expect(isExpired({ ...TOKENS, expiresAt: now - 1 }, now)).toBe(true);
  });

  it('treats the skew window as already expired so a request does not race the boundary', () => {
    expect(isExpired({ ...TOKENS, expiresAt: now + 10_000 }, now)).toBe(true);
  });
});
