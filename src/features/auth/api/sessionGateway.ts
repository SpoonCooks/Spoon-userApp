import type { ApiClient } from '@core/api';
import type { SessionGateway, SessionTokens } from '@core/auth';
import { isAppError } from '@core/errors';
import type { Logger } from '@core/logging';

import { createAuthApi } from './authApi';

/**
 * The real `SessionGateway`, backed by `POST /v1/auth/refresh`.
 *
 * ## Why "null" is the whole contract
 *
 * `SessionController` treats `null` as "this session is unrecoverable" and tears everything
 * down — SecureStore, the query cache, the session machine. That is a destructive answer, so it
 * is given ONLY when the server has actually rejected the refresh token:
 *
 *   - a 4xx (UNAUTHENTICATED / INVALID_REQUEST) means the token is spent, revoked, or a reuse
 *     was detected and the family was killed. The session is genuinely gone -> null.
 *   - a network failure, a timeout, or a 5xx means we do not KNOW. Logging the user out because
 *     their train went into a tunnel is a bug. Those RETHROW, so the caller sees a transient
 *     error and the stored session survives.
 *
 * Getting this backwards is the classic refresh bug, so it is the one thing this file exists to
 * get right.
 */
export function createSessionGateway(options: {
  readonly api: ApiClient;
  readonly logger: Logger;
}): SessionGateway {
  const auth = createAuthApi(options.api);

  return {
    async refreshSession(refreshToken: string): Promise<SessionTokens | null> {
      try {
        const dto = await auth.refresh(refreshToken);
        return {
          accessToken: dto.accessToken,
          // Rotating: the NEW refresh token replaces the spent one. Storing the old one would
          // make the next refresh look like a reuse and kill the family.
          refreshToken: dto.refreshToken,
          expiresAt: Date.parse(dto.accessTokenExpiresAt),
        };
      } catch (error) {
        if (isAppError(error) && (error.kind === 'auth' || error.kind === 'validation')) {
          options.logger.info('Refresh rejected by server; session is unrecoverable', {
            ...(error.code === undefined ? {} : { code: error.code }),
          });
          return null;
        }
        // Transient. The session may still be perfectly valid — do not destroy it.
        throw error;
      }
    },
  };
}
