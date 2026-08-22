import { getUserMessage, isAppError } from '@core/errors';
import type { AppError } from '@core/errors';
import { createLogger, noopSink } from '@core/logging';

import { createApiClient } from './client';
import { CORRELATION_HEADER } from './correlation';
import type { AuthTokenProvider } from './types';

/**
 * Transport behaviour only. There are no endpoints here — `/ping` is an arbitrary path, not a
 * real route, and no payload shape is asserted beyond what the injected parser declares.
 */

const logger = createLogger({ level: 'silent', sink: noopSink });

function rawResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

/**
 * A success body in the backend's envelope.
 *
 * Every 2xx the API returns is `{ "data": ... }` and the transport unwraps it centrally, so a
 * test that returned a bare body would be asserting a shape the server never sends.
 */
function jsonResponse(status: number, body: unknown): Response {
  return rawResponse(status, body === undefined ? undefined : { data: body });
}

/** A failure body in the backend's error envelope. */
function errorResponse(status: number, code: string, requestId = 'req-1'): Response {
  return rawResponse(status, { error: { code, message: 'Public message.', requestId } });
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

/**
 * The Spoon transport contract: one envelope in, one taxonomy out.
 *
 * These are the tests that stop a regression from silently re-flattening every 4xx into
 * "something went wrong" — the failure mode the designed error states exist to avoid.
 */
describe('api client — response envelope and backend error codes', () => {
  const parseEcho = (data: unknown) => data;

  it('unwraps the data envelope before the boundary parser sees it', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(200, { id: 'booking-1' }));
    const { client } = build(fetchImpl);

    // Not `{ data: { id } }` — the parser receives the payload itself.
    await expect(client.request('ping', { parse: parseEcho })).resolves.toEqual({
      id: 'booking-1',
    });
  });

  it('passes a null payload through, because null is a legitimate value', async () => {
    // The catalogue publishes `extension: null` when no pricing policy is resolvable, so a
    // presence check on the KEY is required — a truthiness check would reject it.
    const fetchImpl = createFetchMock(async () => jsonResponse(200, null));
    const { client } = build(fetchImpl);

    await expect(client.request('ping', { parse: parseEcho })).resolves.toBeNull();
  });

  it('rejects a success body that is not enveloped', async () => {
    const fetchImpl = createFetchMock(async () => rawResponse(200, { id: 'unwrapped' }));
    const { client } = build(fetchImpl);

    await expect(client.request('ping', { parse: parseEcho })).rejects.toMatchObject({
      kind: 'unknown',
    });
  });

  it('preserves the backend error code and requestId on a domain failure', async () => {
    const fetchImpl = createFetchMock(async () =>
      errorResponse(422, 'ADDRESS_NOT_SERVICEABLE', 'req-abc'),
    );
    const { client } = build(fetchImpl);

    await expect(
      client.request('ping', { parse: parseEcho, authenticated: false }),
    ).rejects.toMatchObject({
      kind: 'validation',
      code: 'ADDRESS_NOT_SERVICEABLE',
      requestId: 'req-abc',
      message: 'Public message.',
    });
  });

  it('distinguishes two codes that share a transport category', async () => {
    // Both are plain 4xx. Only the code tells the booking screen which designed state to show.
    const serviceable = createFetchMock(async () => errorResponse(422, 'ADDRESS_NOT_SERVICEABLE'));
    const slot = createFetchMock(async () => errorResponse(409, 'SLOT_UNAVAILABLE'));

    await expect(
      build(serviceable).client.request('a', { parse: parseEcho, authenticated: false }),
    ).rejects.toMatchObject({ code: 'ADDRESS_NOT_SERVICEABLE' });
    await expect(
      build(slot).client.request('b', { parse: parseEcho, authenticated: false }),
    ).rejects.toMatchObject({ code: 'SLOT_UNAVAILABLE' });
  });

  it('still normalizes a failure that carries no error envelope', async () => {
    const fetchImpl = createFetchMock(async () => rawResponse(500, 'gateway exploded'));
    const { client } = build(fetchImpl);

    const error = await client
      .request('ping', { parse: parseEcho, authenticated: false })
      .catch((thrown: unknown) => thrown);

    expect(error).toMatchObject({ kind: 'server' });
    // The key is absent rather than present-and-undefined, so nothing downstream can read a
    // code that was never sent.
    expect(error).not.toHaveProperty('code');
  });

  it('sends an Idempotency-Key when the caller supplies one', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(200, { ok: true }));
    const { client } = build(fetchImpl);

    await client.request('bookings', {
      method: 'POST',
      body: { a: 1 },
      headers: { 'Idempotency-Key': 'key-1' },
      parse: parseEcho,
    });

    expect(headersOf(fetchImpl, 0)['Idempotency-Key']).toBe('key-1');
  });
});

/**
 * FE-5 regression — a transport failure must read as `network`, not `unknown`.
 *
 * These are not hypothetical strings. The first is the EXACT rejection captured from a physical
 * Android device (Pixel-class, Hermes + Fabric) on 2026-08-18, when the app's configured host did
 * not resolve. Before the fix, `normalizeError` classified it by `cause instanceof TypeError` —
 * true in a browser and in Node's undici, false in React Native — so a genuinely unreachable
 * network produced `kind: 'unknown'` and the screen rendered "Something went wrong. Please try
 * again." instead of telling the customer their connection was the problem.
 *
 * The transport now classifies structurally: `fetch` rejected and nothing aborted it, so no
 * response exists, and that IS the network kind whatever the platform called the exception.
 */
describe('transport failure classification', () => {
  const REACT_NATIVE_ANDROID_DNS_FAILURE = new Error(
    'fetch failed: java.net.UnknownHostException: Unable to resolve host "api.spoon.invalid": ' +
      'No address associated with hostname',
  );

  function clientThatFailsWith(cause: unknown) {
    return createApiClient({
      baseUrl: 'https://api.test.invalid',
      timeoutMs: 5_000,
      logger: createLogger({ level: 'silent', sink: noopSink }),
      auth: {
        getAccessToken: async () => null,
        refreshAccessToken: async () => null,
        onSessionExpired: () => undefined,
      },
      appVersion: 'test',
      platform: 'android',
      fetchImpl: () => Promise.reject(cause),
    });
  }

  it('classifies the React Native Android DNS failure as network, not unknown', async () => {
    const client = clientThatFailsWith(REACT_NATIVE_ANDROID_DNS_FAILURE);

    const error = await client
      .request('/v1/auth/otp/send', {
        method: 'POST',
        body: { phone: '+919876543210' },
        parse: (d) => d,
      })
      .then(
        () => null,
        (caught: unknown) => caught,
      );

    expect(isAppError(error)).toBe(true);
    expect((error as AppError).kind).toBe('network');
    // The cause is kept: a support conversation needs the platform's own words.
    expect((error as AppError).cause).toBe(REACT_NATIVE_ANDROID_DNS_FAILURE);
  });

  it('gives the customer the network message rather than the generic one', async () => {
    const client = clientThatFailsWith(REACT_NATIVE_ANDROID_DNS_FAILURE);

    const error = (await client
      .request('/v1/auth/otp/send', {
        method: 'POST',
        body: { phone: '+919876543210' },
        parse: (d) => d,
      })
      .catch((caught: unknown) => caught)) as AppError;

    expect(getUserMessage(error)).toBe('No internet connection. Check your network and try again.');
    expect(getUserMessage(error)).not.toBe('Something went wrong. Please try again.');
  });

  it('still classifies the browser/undici TypeError as network', async () => {
    // The platform this always worked on must keep working.
    const client = clientThatFailsWith(new TypeError('Network request failed'));

    const error = (await client
      .request('/v1/me', { parse: (d) => d })
      .catch((caught: unknown) => caught)) as AppError;

    expect(error.kind).toBe('network');
  });

  it('does not swallow an abort into the network kind', async () => {
    // An aborted request is a timeout, and the two have different designed presentations.
    const client = createApiClient({
      baseUrl: 'https://api.test.invalid',
      timeoutMs: 10,
      logger: createLogger({ level: 'silent', sink: noopSink }),
      auth: {
        getAccessToken: async () => null,
        refreshAccessToken: async () => null,
        onSessionExpired: () => undefined,
      },
      appVersion: 'test',
      platform: 'android',
      fetchImpl: (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as { signal?: AbortSignal } | undefined)?.signal;
          signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    });

    const error = (await client
      .request('/v1/me', { parse: (d) => d })
      .catch((caught: unknown) => caught)) as AppError;

    expect(error.kind).toBe('timeout');
  });
});
