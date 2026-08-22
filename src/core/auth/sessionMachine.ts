/**
 * Headless session state machine. (FRONTEND_FOUNDATION_PLAN.md §8)
 *
 * These are CLIENT states describing what the app knows about its own credentials. They are not
 * backend statuses and must never be confused with booking or account state, which the backend
 * owns exclusively.
 *
 * bootstrapping -> unauthenticated | authenticated
 * authenticated -> refreshing -> authenticated | expired
 * expired -> unauthenticated (after teardown)
 * expired -> authenticated (the customer signed in again without restarting the app)
 */

export type SessionStatus =
  'bootstrapping' | 'unauthenticated' | 'authenticated' | 'refreshing' | 'expired';

export type SessionEvent =
  | { type: 'BOOTSTRAP_FOUND_SESSION' }
  | { type: 'BOOTSTRAP_NO_SESSION' }
  | { type: 'SIGNED_IN' }
  | { type: 'REFRESH_STARTED' }
  | { type: 'REFRESH_SUCCEEDED' }
  | { type: 'REFRESH_FAILED' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SIGNED_OUT' };

export const INITIAL_SESSION_STATUS: SessionStatus = 'bootstrapping';

export function sessionReducer(status: SessionStatus, event: SessionEvent): SessionStatus {
  switch (status) {
    case 'bootstrapping':
      switch (event.type) {
        case 'BOOTSTRAP_FOUND_SESSION':
          return 'authenticated';
        case 'BOOTSTRAP_NO_SESSION':
          return 'unauthenticated';
        default:
          return status;
      }

    case 'unauthenticated':
      return event.type === 'SIGNED_IN' ? 'authenticated' : status;

    case 'authenticated':
      switch (event.type) {
        case 'REFRESH_STARTED':
          return 'refreshing';
        case 'SESSION_EXPIRED':
          return 'expired';
        case 'SIGNED_OUT':
          return 'unauthenticated';
        default:
          return status;
      }

    case 'refreshing':
      switch (event.type) {
        case 'REFRESH_SUCCEEDED':
          return 'authenticated';
        case 'REFRESH_FAILED':
        case 'SESSION_EXPIRED':
          return 'expired';
        case 'SIGNED_OUT':
          return 'unauthenticated';
        default:
          return status;
      }

    case 'expired':
      switch (event.type) {
        /**
         * The RECOVERY edge.
         *
         * An expired session sends the customer to `/login`, they complete the OTP flow, and
         * `sessionController.signIn` writes fresh tokens and dispatches this. Without the
         * transition the machine stayed `expired` forever: `canAccessApp` kept returning false,
         * the boot gate kept redirecting back to `/login`, and the only escape was killing the
         * app. Credentials that have just been written are exactly as good as ones found at
         * bootstrap, so `expired` accepts a sign-in for the same reason `unauthenticated` does.
         */
        case 'SIGNED_IN':
          return 'authenticated';
        case 'SIGNED_OUT':
        case 'BOOTSTRAP_NO_SESSION':
          return 'unauthenticated';
        default:
          return status;
      }
  }
}

/** Splash holds while this is true (audit §R: splash holds until the session resolves). */
export function isResolving(status: SessionStatus): boolean {
  return status === 'bootstrapping';
}

/** Whether the app shell (authenticated routes) may render. */
export function canAccessApp(status: SessionStatus): boolean {
  return status === 'authenticated' || status === 'refreshing';
}
