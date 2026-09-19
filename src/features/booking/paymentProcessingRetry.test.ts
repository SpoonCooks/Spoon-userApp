import { payRetryingOnceWhileProcessing } from './data';
import type { PaymentOutcome } from './data';

/**
 * `processing` is the server saying "ask again", not a refusal.
 *
 * A provider timeout leaves an unresolved order attempt; the worker adopts the provider's order
 * on its next pass. Before this, the customer had to know that and press Book now a second time
 * — so a recovery that existed was one nobody reached. One retry does it for them.
 */
describe('paying retries once while the server is still resolving the attempt', () => {
  /** No real timer: the delay is injected so the behaviour is asserted, not the clock. */
  const noWait = () => Promise.resolve();

  it('retries once and reports what the second attempt found', async () => {
    const outcomes: PaymentOutcome[] = ['processing', 'verified'];
    const attempt = jest.fn(() => Promise.resolve(outcomes.shift() as PaymentOutcome));

    await expect(payRetryingOnceWhileProcessing(attempt, noWait)).resolves.toBe('verified');
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('waits before asking again, rather than hammering the same unresolved attempt', async () => {
    const sleep = jest.fn(() => Promise.resolve());
    const outcomes: PaymentOutcome[] = ['processing', 'verified'];

    await payRetryingOnceWhileProcessing(
      () => Promise.resolve(outcomes.shift() as PaymentOutcome),
      sleep,
      1_234,
    );

    expect(sleep).toHaveBeenCalledWith(1_234);
  });

  /** One retry, never a loop: a still-unresolved attempt is reported, not asked a third time. */
  it('gives up after one retry and returns processing', async () => {
    const attempt = jest.fn(() => Promise.resolve<PaymentOutcome>('processing'));

    await expect(payRetryingOnceWhileProcessing(attempt, noWait)).resolves.toBe('processing');
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  /**
   * Every other outcome is an ANSWER. A dismissal, a decline and a checkout that never opened are
   * all decided; retrying them would be guessing, and would reopen a sheet the customer closed.
   */
  it.each<PaymentOutcome>(['verified', 'cancelled', 'failed', 'unavailable'])(
    'does not retry a settled outcome (%s)',
    async (outcome) => {
      const attempt = jest.fn(() => Promise.resolve(outcome));

      await expect(payRetryingOnceWhileProcessing(attempt, noWait)).resolves.toBe(outcome);
      expect(attempt).toHaveBeenCalledTimes(1);
    },
  );
});
