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

  /**
   * The recovery edge, and the reason this test exists.
   *
   * An expired session routes the customer to `/login`. They complete the OTP flow,
   * `sessionController.signIn` writes fresh tokens and dispatches `SIGNED_IN` — and the machine
   * used to ignore it, because `expired` accepted only `SIGNED_OUT` and `BOOTSTRAP_NO_SESSION`.
   * `canAccessApp('expired')` is false, so the boot gate bounced them straight back to `/login`,
   * and the only escape was force-quitting the app.
   */
  it('recovers to authenticated when the customer signs in again', () => {
    expect(sessionReducer('expired', { type: 'SIGNED_IN' })).toBe('authenticated');
    expect(canAccessApp(sessionReducer('expired', { type: 'SIGNED_IN' }))).toBe(true);
  });

  /** The whole round trip, one event at a time: live -> expired -> signed in -> live again. */
  it('survives an expiry and a re-authentication without a restart', () => {
    const expired = sessionReducer('authenticated', { type: 'SESSION_EXPIRED' });
    expect(expired).toBe('expired');
    expect(canAccessApp(expired)).toBe(false);

    const recovered = sessionReducer(expired, { type: 'SIGNED_IN' });
    expect(recovered).toBe('authenticated');
    expect(canAccessApp(recovered)).toBe(true);
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
