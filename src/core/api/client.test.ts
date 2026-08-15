import { createLogger, noopSink } from '@core/logging';

import { createApiClient } from './client';
import { CORRELATION_HEADER } from './correlation';
import type { AuthTokenProvider } from './types';

/**
 * Transport behaviour only. There are no endpoints here — `/ping` is an arbitrary path, not a
 * real route, and no payload shape is asserted beyond what the injected parser declares.
 */

const logger = createLogger({ level: 'silent', sink: noopSink });

function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

function createAuth(overrides: Partial<AuthTokenProvider> = {}): AuthTokenProvider {
  return {
    getAccessToken: jest.fn(async () => 'token-1'),
    refreshAccessToken: jest.fn(async () => 'token-2'),
    onSessionExpired: jest.fn(),
    ...overrides,
  };
}

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit?]>;

function createFetchMock(
  implementation?: (url: string, init?: RequestInit) => Promise<Response>,
): FetchMock {
  return implementation === undefined ? jest.fn() : (jest.fn(implementation) as FetchMock);
}

/** Reads the request init of a given call, failing loudly rather than using `!`. */
function initOf(fetchImpl: FetchMock, callIndex: number): RequestInit {
  const init = fetchImpl.mock.calls[callIndex]?.[1];
  if (init === undefined) {
    throw new Error(`fetch call ${callIndex} had no init`);
  }
  return init;
}

function headersOf(fetchImpl: FetchMock, callIndex: number): Record<string, string> {
  return initOf(fetchImpl, callIndex).headers as Record<string, string>;
}

function build(fetchImpl: FetchMock, auth: AuthTokenProvider = createAuth()) {
  return {
    auth,
    client: createApiClient({
      baseUrl: 'https://api.test.invalid/v1',
      timeoutMs: 1000,
      logger,
      auth,
      appVersion: '0.1.0',
      platform: 'ios',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }),
  };
}

const parseEcho = (data: unknown): { ok: boolean } => data as { ok: boolean };

describe('api client', () => {
  it('joins base url and path without duplicating slashes', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(200, { ok: true }));
    const { client } = build(fetchImpl);

    await client.request('/ping', { parse: parseEcho });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://api.test.invalid/v1/ping');
  });

  it('attaches auth, platform, version and a correlation id', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(200, { ok: true }));
    const { client } = build(fetchImpl);

    await client.request('ping', { parse: parseEcho });

    const headers = headersOf(fetchImpl, 0);

    expect(headers.Authorization).toBe('Bearer token-1');
    expect(headers['X-App-Platform']).toBe('ios');
    expect(headers['X-App-Version']).toBe('0.1.0');
    expect(headers[CORRELATION_HEADER]).toEqual(expect.any(String));
  });

  it('omits the auth header when the request opts out', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(200, { ok: true }));
    const { client, auth } = build(fetchImpl);

    await client.request('ping', { parse: parseEcho, authenticated: false });

    expect(headersOf(fetchImpl, 0).Authorization).toBeUndefined();
    expect(auth.getAccessToken).not.toHaveBeenCalled();
  });

  it('runs the boundary parser on the response body', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(200, { value: 41 }));
    const { client } = build(fetchImpl);

    const result = await client.request('ping', {
      parse: (data) => ((data as { value: number }).value + 1) as number,
    });

    expect(result).toBe(42);
  });

  it('normalizes a failing parser instead of leaking it', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(200, { wrong: true }));
    const { client } = build(fetchImpl);

    await expect(
      client.request('ping', {
        parse: () => {
          throw new Error('shape mismatch');
        },
      }),
    ).rejects.toMatchObject({ kind: 'unknown', message: 'shape mismatch' });
  });

  it('maps a non-ok status onto the error taxonomy', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(500, { error: true }));
    const { client } = build(fetchImpl);

    await expect(client.request('ping', { parse: parseEcho })).rejects.toMatchObject({
      kind: 'server',
      status: 500,
    });
  });

  it('normalizes a transport rejection to a network error', async () => {
    const fetchImpl = createFetchMock(async () => {
      throw new TypeError('Network request failed');
    });
    const { client } = build(fetchImpl);

    await expect(client.request('ping', { parse: parseEcho })).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('aborts and reports a timeout error', async () => {
    const fetchImpl = createFetchMock(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );
    const { client } = build(fetchImpl);

    await expect(client.request('ping', { parse: parseEcho, timeoutMs: 10 })).rejects.toMatchObject(
      { kind: 'timeout', timeoutMs: 10 },
    );
  });

  it('refreshes once on 401 and retries the request', async () => {
    const fetchImpl = createFetchMock();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse(401, { error: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const { client, auth } = build(fetchImpl);

    await expect(client.request('ping', { parse: parseEcho })).resolves.toEqual({ ok: true });

    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    expect(headersOf(fetchImpl, 1).Authorization).toBe('Bearer token-2');
  });

  it('terminates the session when refresh is unrecoverable', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(401, { error: 'expired' }));
    const auth = createAuth({ refreshAccessToken: jest.fn(async () => null) });
    const { client } = build(fetchImpl, auth);

    await expect(client.request('ping', { parse: parseEcho })).rejects.toMatchObject({
      kind: 'auth',
      status: 401,
    });

    expect(auth.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('gives up after a single retry still returns 401', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(401, { error: 'expired' }));
    const { client, auth } = build(fetchImpl);

    await expect(client.request('ping', { parse: parseEcho })).rejects.toMatchObject({
      kind: 'auth',
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(auth.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not attempt a refresh for unauthenticated requests', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(401, { error: 'nope' }));
    const { client, auth } = build(fetchImpl);

    await expect(
      client.request('ping', { parse: parseEcho, authenticated: false }),
    ).rejects.toMatchObject({ kind: 'auth' });

    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
  });
});
