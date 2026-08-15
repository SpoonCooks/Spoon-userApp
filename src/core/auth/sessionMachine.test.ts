import {
  canAccessApp,
  INITIAL_SESSION_STATUS,
  isResolving,
  sessionReducer,
} from './sessionMachine';
import type { SessionStatus } from './sessionMachine';

describe('sessionReducer', () => {
  it('starts by bootstrapping and holds the splash', () => {
    expect(INITIAL_SESSION_STATUS).toBe('bootstrapping');
    expect(isResolving(INITIAL_SESSION_STATUS)).toBe(true);
  });

  it('resolves bootstrap in both directions', () => {
    expect(sessionReducer('bootstrapping', { type: 'BOOTSTRAP_FOUND_SESSION' })).toBe(
      'authenticated',
    );
    expect(sessionReducer('bootstrapping', { type: 'BOOTSTRAP_NO_SESSION' })).toBe(
      'unauthenticated',
    );
  });

  it('runs the refresh cycle back to authenticated', () => {
    const refreshing = sessionReducer('authenticated', { type: 'REFRESH_STARTED' });
    expect(refreshing).toBe('refreshing');
    expect(sessionReducer(refreshing, { type: 'REFRESH_SUCCEEDED' })).toBe('authenticated');
  });

  it('expires when a refresh fails', () => {
    expect(sessionReducer('refreshing', { type: 'REFRESH_FAILED' })).toBe('expired');
  });

  it('returns to unauthenticated only after teardown', () => {
    expect(sessionReducer('expired', { type: 'SIGNED_OUT' })).toBe('unauthenticated');
    expect(sessionReducer('expired', { type: 'REFRESH_SUCCEEDED' })).toBe('expired');
  });

  it('ignores events that do not apply to the current state', () => {
    expect(sessionReducer('unauthenticated', { type: 'REFRESH_STARTED' })).toBe('unauthenticated');
    expect(sessionReducer('bootstrapping', { type: 'SIGNED_IN' })).toBe('bootstrapping');
  });

  it('allows the app shell while authenticated or refreshing only', () => {
    const allowed: SessionStatus[] = ['authenticated', 'refreshing'];
    const denied: SessionStatus[] = ['bootstrapping', 'unauthenticated', 'expired'];

    allowed.forEach((status) => expect(canAccessApp(status)).toBe(true));
    denied.forEach((status) => expect(canAccessApp(status)).toBe(false));
  });
});
