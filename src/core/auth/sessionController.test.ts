import { createLogger, noopSink } from '@core/logging';

import { createSessionController } from './sessionController';
import type { SessionGateway } from './sessionGateway';
import type { SessionEvent } from './sessionMachine';
import type { SessionTokens, TokenStore } from './tokenStore';

const logger = createLogger({ level: 'silent', sink: noopSink });

const NOW = 1_000_000;
const FRESH: SessionTokens = { accessToken: 'a1', refreshToken: 'r1', expiresAt: NOW + 600_000 };
const STALE: SessionTokens = { accessToken: 'a0', refreshToken: 'r1', expiresAt: NOW - 1 };
const REFRESHED: SessionTokens = {
  accessToken: 'a2',
  refreshToken: 'r2',
  expiresAt: NOW + 600_000,
};

function createMemoryTokenStore(initial: SessionTokens | null = null): TokenStore {
  let tokens = initial;
  return {
    read: jest.fn(async () => tokens),
    write: jest.fn(async (next: SessionTokens) => {
      tokens = next;
    }),
    clear: jest.fn(async () => {
      tokens = null;
    }),
  };
}

function setup(options: { tokens?: SessionTokens | null; gateway?: SessionGateway }) {
  const events: SessionEvent[] = [];
  const tokenStore = createMemoryTokenStore(options.tokens ?? null);
  const onSessionCleared = jest.fn();

  const controller = createSessionController({
    tokenStore,
    gateway: options.gateway ?? { refreshSession: jest.fn(async () => REFRESHED) },
    logger,
    dispatch: (event) => events.push(event),
    onSessionCleared,
    now: () => NOW,
  });

  return { controller, tokenStore, events, onSessionCleared };
}

describe('sessionController.bootstrap', () => {
  it('reports no session when storage is empty', async () => {
    const { controller, events } = setup({ tokens: null });

    await controller.bootstrap();

    expect(events).toEqual([{ type: 'BOOTSTRAP_NO_SESSION' }]);
  });

  it('reports a found session and leaves a fresh token alone', async () => {
    const { controller, events } = setup({ tokens: FRESH });

    await controller.bootstrap();

    expect(events).toEqual([{ type: 'BOOTSTRAP_FOUND_SESSION' }]);
  });

  it('refreshes immediately when the stored token is already expired', async () => {
    const { controller, events, tokenStore } = setup({ tokens: STALE });

    await controller.bootstrap();

    expect(events.map((event) => event.type)).toEqual([
      'BOOTSTRAP_FOUND_SESSION',
      'REFRESH_STARTED',
      'REFRESH_SUCCEEDED',
    ]);
    expect(tokenStore.write).toHaveBeenCalledWith(REFRESHED);
  });
});

describe('sessionController tokens', () => {
  it('returns the stored access token while it is valid', async () => {
    const { controller } = setup({ tokens: FRESH });

    await expect(controller.getAccessToken()).resolves.toBe('a1');
  });

  it('refreshes transparently when the token has expired', async () => {
    const { controller } = setup({ tokens: STALE });

    await expect(controller.getAccessToken()).resolves.toBe('a2');
  });

  it('collapses concurrent refreshes into one gateway call', async () => {
    const refreshSession = jest.fn(async () => REFRESHED);
    const { controller } = setup({ tokens: STALE, gateway: { refreshSession } });

    await Promise.all([
      controller.refreshAccessToken(),
      controller.refreshAccessToken(),
      controller.refreshAccessToken(),
    ]);

    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('clears the session when the gateway rejects the refresh token', async () => {
    const { controller, tokenStore, onSessionCleared, events } = setup({
      tokens: STALE,
      gateway: { refreshSession: jest.fn(async () => null) },
    });

    await expect(controller.refreshAccessToken()).resolves.toBeNull();

    expect(events.map((event) => event.type)).toContain('REFRESH_FAILED');
    expect(tokenStore.clear).toHaveBeenCalled();
    expect(onSessionCleared).toHaveBeenCalled();
  });

  it('clears the session when the gateway throws', async () => {
    const { controller, onSessionCleared } = setup({
      tokens: STALE,
      gateway: {
        refreshSession: jest.fn(async () => {
          throw new Error('network down');
        }),
      },
    });

    await expect(controller.refreshAccessToken()).resolves.toBeNull();
    expect(onSessionCleared).toHaveBeenCalled();
  });

  it('does not call the gateway when there is nothing to refresh', async () => {
    const refreshSession = jest.fn(async () => REFRESHED);
    const { controller } = setup({ tokens: null, gateway: { refreshSession } });

    await expect(controller.refreshAccessToken()).resolves.toBeNull();
    expect(refreshSession).not.toHaveBeenCalled();
  });
});

describe('sessionController teardown', () => {
  it('clears storage AND the query cache on sign-out', async () => {
    const { controller, tokenStore, onSessionCleared, events } = setup({ tokens: FRESH });

    await controller.signOut();

    expect(tokenStore.clear).toHaveBeenCalled();
    // Missing this leaks the previous user's bookings into the next session.
    expect(onSessionCleared).toHaveBeenCalled();
    expect(events).toContainEqual({ type: 'SIGNED_OUT' });
  });

  it('tears down on an unrecoverable 401 from the transport', async () => {
    const { controller, events, onSessionCleared } = setup({ tokens: FRESH });

    controller.onSessionExpired();
    await Promise.resolve();

    expect(events).toContainEqual({ type: 'SESSION_EXPIRED' });
    expect(onSessionCleared).toHaveBeenCalled();
  });

  it('persists tokens on sign-in', async () => {
    const { controller, tokenStore, events } = setup({ tokens: null });

    await controller.signIn(FRESH);

    expect(tokenStore.write).toHaveBeenCalledWith(FRESH);
    expect(events).toContainEqual({ type: 'SIGNED_IN' });
  });
});
