import { getUserMessage, isAppError, normalizeError } from '@core/errors';

/**
 * What a failed deletion should say, and in which of the OTP screen's two slots.
 *
 * The split matters. `INVALID_REQUEST` means the code was wrong, expired or already spent — the
 * customer's own input, so it belongs in the red slot that also tints the digit boxes.
 * `ACCOUNT_DELETION_BLOCKED` means the code was FINE and the account simply cannot go yet; it is
 * temporary, it is not the customer's mistake, and tinting the boxes red for it would tell them
 * they mistyped something they did not.
 */

export type DeletionBlockTarget = 'bookings' | 'refunds' | 'support';

export interface DeletionBlockedNotice {
  readonly message: string;
  readonly actionLabel?: string;
  readonly target?: DeletionBlockTarget;
}

export interface DeletionFailureView {
  /** The rejected-code slot: red text, red digit boxes. */
  readonly errorMessage?: string;
  /** The neutral slot: nothing is wrong with the code. */
  readonly notice?: DeletionBlockedNotice;
}

/** `275:4467` — the frame's own wording for a code the server would not take. */
const INCORRECT_OTP = 'Incorrect OTP. Please try again';

/**
 * What the server says when it will not name the blocker.
 *
 * Its own copy is customer-facing and already lists all three causes, so it is preferred over
 * anything written here — duplicating it client-side is how the two drift apart. This stands in
 * only when the response carried no message of its own.
 */
const BLOCKED_FALLBACK =
  'This account cannot be deleted right now because of an active booking, refund or recovery case.';

/**
 * `details.reason` — added to the 409 by the backend so the customer can be sent somewhere useful
 * instead of being told to go and find the problem themselves.
 *
 * The wire values are UPPER_SNAKE_CASE. They were first described to us in lower_snake_case and
 * corrected later, which is exactly the kind of drift that fails SILENTLY here: a miss produces
 * no error, it just quietly degrades to the generic sentence and drops the link. So the lookup
 * normalises case rather than trusting either spelling.
 *
 * An unrecognised reason still falls through to the server's own sentence with no action — a
 * reason this build has never heard of is not grounds for sending someone to the wrong screen.
 * Only the FIRST blocker is ever reported; the server short-circuits.
 */
const BLOCKED_BY_REASON: Readonly<Record<string, DeletionBlockedNotice>> = {
  ACTIVE_BOOKING: {
    message:
      'You have a booking in progress. Finish or cancel it, then you can delete your account.',
    actionLabel: 'View my bookings',
    target: 'bookings',
  },
  PENDING_REFUND: {
    message: 'A refund is still being processed. Once it completes you can delete your account.',
    actionLabel: 'View my refunds',
    target: 'refunds',
  },
  OPEN_RECOVERY_CASE: {
    message:
      'There is an open support case on your account. Our team has to close it before the account can be deleted.',
    actionLabel: 'Message support',
    target: 'support',
  },
};

export function deletionFailureView(error: unknown): DeletionFailureView | null {
  if (error === null || error === undefined) return null;

  const appError = isAppError(error) ? error : normalizeError(error);

  if (appError.code === 'ACCOUNT_DELETION_BLOCKED') {
    const reason = appError.details?.reason;
    const known = reason === undefined ? undefined : BLOCKED_BY_REASON[reason.toUpperCase()];
    if (known !== undefined) return { notice: known };

    return { notice: { message: serverMessageOr(appError.message, BLOCKED_FALLBACK) } };
  }

  // The one place this screen knows more than the shared error copy does: on an OTP screen,
  // `INVALID_REQUEST` can only be the code, so it says so rather than "check the details".
  if (appError.code === 'INVALID_REQUEST') {
    return { errorMessage: INCORRECT_OTP };
  }

  return { errorMessage: getUserMessage(appError) };
}

/**
 * `fromStatus` synthesises `Request failed with status N` when a response carried no message of
 * its own, which is a developer's sentence rather than a customer's. It is recognised and dropped
 * rather than shown.
 */
function serverMessageOr(message: string, fallback: string): string {
  return message.startsWith('Request failed with status') ? fallback : message;
}
