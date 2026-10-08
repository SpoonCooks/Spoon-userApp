/**
 * Headless session state machine. (FRONTEND_FOUNDATION_PLAN.md §8)
 *
 * These are CLIENT states describing what the app knows about its own credentials. They are not
 * backend statuses and must never be confused with booking or account state, which the backend
 * owns exclusively.
 *
 * bootstrapping -> unauthenticated | authenticated
 * authenticated -> refreshing -> authenticated | expired
 * refreshing -> authenticated (REFRESH_INTERRUPTED: no answer, so the stored session is kept)
 * expired -> unauthenticated (after teardown)
 * expired -> authenticated (the customer signed in again without restarting the app)
 *
 * bootstrapping -> guest (a remembered "Skip" from an earlier launch, iOS only)
 * unauthenticated | expired -> guest (the customer tapped Skip on Login)
 * guest -> authenticated (signed in from a "Sign in to continue" prompt)
 * guest -> unauthenticated (guest mode withdrawn)
 *
 * `guest` holds NO credentials. It is permission to browse Home's static content, nothing more:
 * every per-account read stays off, and `canAccessApp` stays false for it.
 */

export type SessionStatus =
  'bootstrapping' | 'unauthenticated' | 'guest' | 'authenticated' | 'refreshing' | 'expired';

export type SessionEvent =
  | { type: 'BOOTSTRAP_FOUND_SESSION' }
  | { type: 'BOOTSTRAP_NO_SESSION' }
  | { type: 'BOOTSTRAP_GUEST' }
  | { type: 'GUEST_STARTED' }
  | { type: 'SIGNED_IN' }
  | { type: 'REFRESH_STARTED' }
  | { type: 'REFRESH_SUCCEEDED' }
  | { type: 'REFRESH_FAILED' }
  /**
   * The refresh got no answer — a timeout, the network, a 5xx. Nothing says the session is bad,
   * so it stays: the next request refreshes again.
   */
  | { type: 'REFRESH_INTERRUPTED' }
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
        case 'BOOTSTRAP_GUEST':
          return 'guest';
        default:
          return status;
      }

    case 'unauthenticated':
      switch (event.type) {
        case 'SIGNED_IN':
          return 'authenticated';
        case 'GUEST_STARTED':
          return 'guest';
        default:
          return status;
      }

    case 'guest':
      switch (event.type) {
        case 'SIGNED_IN':
          return 'authenticated';
        case 'SIGNED_OUT':
          return 'unauthenticated';
        default:
          return status;
      }

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
        case 'REFRESH_INTERRUPTED':
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
        case 'GUEST_STARTED':
          return 'guest';
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

/** Whether the customer holds credentials — the gate for every per-account read. */
export function canAccessApp(status: SessionStatus): boolean {
  return status === 'authenticated' || status === 'refreshing';
}

/** A customer who skipped Login. Browses Home's static content; everything else asks to sign in. */
export function isGuest(status: SessionStatus): boolean {
  return status === 'guest';
}

/** Whether the app shell may render at all — signed in, or browsing as a guest. */
export function canBrowseApp(status: SessionStatus): boolean {
  return canAccessApp(status) || isGuest(status);
}
