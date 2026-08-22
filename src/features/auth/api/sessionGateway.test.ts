import { createLogger, noopSink } from '@core/logging';
import type { ApiClient } from '@core/api';

import { createSessionGateway } from './sessionGateway';

/**
 * The refresh gateway's one job: decide when a session is genuinely unrecoverable.
 *
 * Returning `null` makes the controller destroy the session — SecureStore, the query cache, the
 * session machine. Getting that wrong in the permissive direction leaves a dead session in place;
 * getting it wrong in the destructive direction logs a user out because their train entered a
 * tunnel. These tests pin both directions.
 */

const logger = createLogger({ level: 'silent', sink: noopSink });

function gatewayWith(request: ApiClient['request']) {
  return createSessionGateway({ api: { request } as ApiClient, logger });
}

describe('session gateway', () => {
  it('returns the ROTATED refresh token, not the one it spent', async () => {
    const gateway = gatewayWith((async () => ({
      accessToken: 'access-2',
      accessTokenExpiresAt: '2026-08-18T04:00:00.000Z',
      refreshToken: 'refresh-2',
    })) as ApiClient['request']);

    const tokens = await gateway.refreshSession('refresh-1');

    // Storing the spent token would make the NEXT refresh look like a reuse, and the backend
    // kills the whole family when it detects one.
    expect(tokens).toEqual({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      expiresAt: Date.parse('2026-08-18T04:00:00.000Z'),
    });
  });

  it('reports the session unrecoverable when the server REJECTS the token', async () => {
    const gateway = gatewayWith((async () => {
      throw { kind: 'auth', status: 401, message: 'no', code: 'UNAUTHENTICATED' };
    }) as ApiClient['request']);

    expect(await gateway.refreshSession('spent')).toBeNull();
  });

  it('treats a 4xx validation refusal as unrecoverable too', async () => {
    const gateway = gatewayWith((async () => {
      throw { kind: 'validation', status: 400, message: 'bad', code: 'INVALID_REQUEST' };
    }) as ApiClient['request']);

    expect(await gateway.refreshSession('malformed')).toBeNull();
  });

  it.each([
    ['network', { kind: 'network', message: 'offline' }],
    ['timeout', { kind: 'timeout', timeoutMs: 1000, message: 'slow' }],
    ['server', { kind: 'server', status: 503, message: 'down' }],
  ])('RETHROWS a transient %s failure instead of destroying the session', async (_name, error) => {
    const gateway = gatewayWith((async () => {
      throw error;
    }) as ApiClient['request']);

    // The session may be perfectly valid. Logging the user out here is the classic refresh bug.
    await expect(gateway.refreshSession('valid')).rejects.toMatchObject(error);
  });
});
