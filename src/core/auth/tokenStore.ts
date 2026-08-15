import * as SecureStore from 'expo-secure-store';

/**
 * The ONLY module permitted to touch SecureStore (enforced by eslint no-restricted-imports).
 * Tokens never reach AsyncStorage, Zustand or React Query. (FRONTEND_FOUNDATION_PLAN.md §9)
 *
 * SecureStore values have a practical ~2KB limit, so only the minimum is stored: access token,
 * refresh token, expiry. Never a serialized user profile.
 */

const ACCESS_TOKEN_KEY = 'spoon.auth.accessToken';
const REFRESH_TOKEN_KEY = 'spoon.auth.refreshToken';
const EXPIRES_AT_KEY = 'spoon.auth.expiresAt';

/**
 * Client-side storage shape — NOT a backend payload shape.
 * TODO(backend-contract): the mapping from the auth response to these three values is unknown;
 * token lifetimes and refresh semantics are backend-contract items.
 */
export interface SessionTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Epoch milliseconds. */
  readonly expiresAt: number;
}

export interface TokenStore {
  read(): Promise<SessionTokens | null>;
  write(tokens: SessionTokens): Promise<void>;
  clear(): Promise<void>;
}

/** Narrow surface so the implementation is swappable and mockable. */
export const secureTokenStore: TokenStore = {
  async read() {
    const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(EXPIRES_AT_KEY),
    ]);

    if (accessToken === null || refreshToken === null || expiresAtRaw === null) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt)) {
      return null;
    }

    return { accessToken, refreshToken, expiresAt };
  },

  async write(tokens) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt)),
    ]);
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
    ]);
  },
};

/** Treats a token as expired slightly early so a request does not race the boundary. */
export function isExpired(tokens: SessionTokens, now: number, skewMs = 30_000): boolean {
  return tokens.expiresAt - skewMs <= now;
}
