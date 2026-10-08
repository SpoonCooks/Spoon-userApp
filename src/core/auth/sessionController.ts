import type { Logger } from '@core/logging';

import type { SessionGateway } from './sessionGateway';
import { singleFlight } from './singleFlight';
import type { SessionTokens, TokenStore } from './tokenStore';
import { isExpired } from './tokenStore';
import type { AuthTokenProvider } from '../api/types';
import type { SessionEvent } from './sessionMachine';

/**
 * Wires the session machine, secure token storage and the refresh gateway together, and exposes
 * the `AuthTokenProvider` the transport layer consumes. (FRONTEND_FOUNDATION_PLAN.md §5, §8)
 *
 * Logout clears all three: SecureStore, the query cache and session status. Missing the cache
 * reset leaks the previous user's bookings into the next session.
 */

export interface SessionControllerOptions {
  readonly tokenStore: TokenStore;
  readonly gateway: SessionGateway;
  readonly logger: Logger;
  readonly dispatch: (event: SessionEvent) => void;
  /** Clears the React Query cache. Injected so core/auth does not depend on core/query. */
  readonly onSessionCleared: () => void;
  readonly now?: () => number;
}

export interface SessionController extends AuthTokenProvider {
  /** Resolves stored credentials at app start. The splash holds until this settles. */
  bootstrap(): Promise<void>;
  /** Called once a sign-in flow has produced tokens. DESIGN_PENDING: no OTP screen exists yet. */
  signIn(tokens: SessionTokens): Promise<void>;
  signOut(): Promise<void>;
}

export function createSessionController(options: SessionControllerOptions): SessionController {
  const { tokenStore, gateway, logger, dispatch, onSessionCleared } = options;
  const now = options.now ?? (() => Date.now());

  async function clearSession(): Promise<void> {
    await tokenStore.clear();
    onSessionCleared();
  }

  const refresh = singleFlight(async (): Promise<string | null> => {
    const stored = await tokenStore.read();
    if (stored === null) {
      return null;
    }

    dispatch({ type: 'REFRESH_STARTED' });

    try {
      const next = await gateway.refreshSession(stored.refreshToken);

      if (next === null) {
        logger.warn('Refresh rejected, session unrecoverable');
        dispatch({ type: 'REFRESH_FAILED' });
        await clearSession();
        return null;
      }

      await tokenStore.write(next);
      dispatch({ type: 'REFRESH_SUCCEEDED' });
      return next.accessToken;
    } catch (cause) {
      /*
       * The gateway answers `null` for a refresh the server REJECTED, and throws only when there
       * was no answer — a timeout, the network, a 5xx (`features/auth/api/sessionGateway.ts`).
       * No answer says nothing about the session, so it is kept. Clearing it here used to sign
       * the customer out whenever a refresh was slow: on staging, the first call after 15 idle
       * minutes is a refresh (the access token's lifetime) that lands on a server still waking
       * up (~40s against a 15s timeout).
       *
       * Rethrown, not `null`: the API client reads a `null` refresh as "session expired" and
       * tears the session down itself. A rethrow fails just this request as a network error the
       * screen can retry, and the next request refreshes again.
       */
      logger.warn('Refresh got no answer; keeping the session', { cause });
      dispatch({ type: 'REFRESH_INTERRUPTED' });
      throw cause;
    }
  });

  return {
    async bootstrap() {
      const stored = await tokenStore.read();

      if (stored === null) {
        dispatch({ type: 'BOOTSTRAP_NO_SESSION' });
        return;
      }

      dispatch({ type: 'BOOTSTRAP_FOUND_SESSION' });

      if (isExpired(stored, now())) {
        // A refresh with no answer keeps the session (see `refresh`); the app opens signed in
        // and its first request refreshes again.
        await refresh().catch(() => undefined);
      }
    },

    async signIn(tokens) {
      await tokenStore.write(tokens);
      dispatch({ type: 'SIGNED_IN' });
    },

    async signOut() {
      await clearSession();
      dispatch({ type: 'SIGNED_OUT' });
    },

    async getAccessToken() {
      const stored = await tokenStore.read();
      if (stored === null) return null;

      if (isExpired(stored, now())) {
        return refresh();
      }
      return stored.accessToken;
    },

    refreshAccessToken() {
      return refresh();
    },

    onSessionExpired() {
      dispatch({ type: 'SESSION_EXPIRED' });
      void clearSession();
    },
  };
}
