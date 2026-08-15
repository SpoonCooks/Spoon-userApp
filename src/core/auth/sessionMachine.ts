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
      return event.type === 'SIGNED_OUT' || event.type === 'BOOTSTRAP_NO_SESSION'
        ? 'unauthenticated'
        : status;
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
