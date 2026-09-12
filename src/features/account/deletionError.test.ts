import { fromStatus } from '@core/errors';

import { deletionFailureView } from './deletionError';

/**
 * Which slot a failed deletion lands in.
 *
 * The screen has two, and they say different things about whose fault it is. The red slot also
 * tints the six digit boxes, so putting a server-side block in it would tell a customer they
 * mistyped a code the server actually accepted.
 */

describe('a rejected code', () => {
  it('goes in the red slot, in the frame’s own words', () => {
    const view = deletionFailureView(fromStatus(400, { code: 'INVALID_REQUEST' }));

    expect(view?.errorMessage).toBe('Incorrect OTP. Please try again');
    expect(view?.notice).toBeUndefined();
  });
});

describe('a blocked account', () => {
  /** The server names all three causes when it will not say which one fired. */
  it('shows the server’s own sentence, neutrally, with nowhere to send them', () => {
    const view = deletionFailureView(
      fromStatus(409, {
        code: 'ACCOUNT_DELETION_BLOCKED',
        message:
          'This account cannot be deleted right now because of an active booking, refund or recovery case.',
      }),
    );

    expect(view?.errorMessage).toBeUndefined();
    expect(view?.notice?.message).toBe(
      'This account cannot be deleted right now because of an active booking, refund or recovery case.',
    );
    expect(view?.notice?.target).toBeUndefined();
  });

  /** `details.reason` — each one names its own cause and offers the way out of it. */
  it.each([
    ['active_booking', 'bookings'],
    ['pending_refund', 'refunds'],
    ['open_recovery_case', 'support'],
  ] as const)('routes %s to the %s screen', (reason, target) => {
    const view = deletionFailureView(
      fromStatus(409, { code: 'ACCOUNT_DELETION_BLOCKED', details: { reason } }),
    );

    expect(view?.notice?.target).toBe(target);
    expect(view?.notice?.actionLabel).toBeDefined();
    expect(view?.errorMessage).toBeUndefined();
  });

  /**
   * A reason this build has never seen is not grounds for sending someone to the wrong screen,
   * so it degrades to the server's sentence with no action rather than guessing.
   */
  it('degrades to the server’s sentence for a reason it does not recognise', () => {
    const view = deletionFailureView(
      fromStatus(409, {
        code: 'ACCOUNT_DELETION_BLOCKED',
        message: 'Something new is blocking this.',
        details: { reason: 'a_reason_shipped_after_this_build' },
      }),
    );

    expect(view?.notice?.message).toBe('Something new is blocking this.');
    expect(view?.notice?.target).toBeUndefined();
  });

  /** `fromStatus` synthesises a developer's sentence when a response carried no message. */
  it('never shows the transport’s own placeholder message', () => {
    const view = deletionFailureView(fromStatus(409, { code: 'ACCOUNT_DELETION_BLOCKED' }));

    expect(view?.notice?.message).not.toMatch(/Request failed with status/);
    expect(view?.notice?.message).toContain('cannot be deleted right now');
  });
});

describe('everything else', () => {
  it.each([
    ['RATE_LIMITED', 429],
    ['IDEMPOTENCY_CONFLICT', 409],
  ] as const)('falls back to the shared copy for %s', (code, status) => {
    const view = deletionFailureView(fromStatus(status, { code }));

    expect(view?.errorMessage).toBeTruthy();
    expect(view?.notice).toBeUndefined();
  });

  it('has nothing to say when nothing failed', () => {
    expect(deletionFailureView(null)).toBeNull();
  });
});
