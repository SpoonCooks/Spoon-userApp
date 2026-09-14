import { destinationForPayment } from './data';

/**
 * Where an unpaid booking is allowed to send the customer.
 *
 * `created` — which is what every booking is until the SERVER verifies a payment — renders the
 * CONFIRMATION view, headed "Booking confirmed!". So `/booking/:id` is not a neutral destination
 * for an unpaid hold; it is an assertion that a cook is coming. Observed on device: backing out
 * of Razorpay landed there and told the customer their booking was confirmed.
 *
 * Only `verified` may reach a screen that claims anything. Everything else either says "not paid"
 * (Payment Failed) or says nothing at all.
 */
describe('destinationForPayment', () => {
  const BOOKING = 'bk-1';

  it('sends a verified payment to Page 21 to wait for the server', () => {
    expect(destinationForPayment('verified', BOOKING)).toBe('/booking/confirming?id=bk-1');
  });

  /** The ONE outcome that has earned that screen: checkout ran, and the payment failed. */
  it('sends a failed payment to the screen that offers a retry', () => {
    expect(destinationForPayment('failed', BOOKING)).toBe('/booking/payment-failed?id=bk-1');
  });

  it('sends a dismissed checkout nowhere — the customer stays where they were', () => {
    expect(destinationForPayment('cancelled', BOOKING)).toBeNull();
  });

  /**
   * Both of these mean checkout NEVER OPENED. They briefly routed to Payment Failed, which told
   * customers their payment had failed when the app had not got as far as asking them for one —
   * and offered to retry a payment that never happened.
   */
  it('keeps an order that was never ready off the Payment Failed screen', () => {
    expect(destinationForPayment('processing', BOOKING)).toBeNull();
  });

  it('keeps a checkout that could not be started off it too', () => {
    expect(destinationForPayment('unavailable', BOOKING)).toBeNull();
  });

  it('reserves "your payment failed" for a payment that was actually attempted', () => {
    const failedOnly = (['verified', 'cancelled', 'failed', 'processing', 'unavailable'] as const)
      .filter((outcome) => destinationForPayment(outcome, BOOKING)?.includes('payment-failed'))
      .map((outcome) => outcome);

    expect(failedOnly).toEqual(['failed']);
  });

  /** The regression itself, stated once: nothing unpaid may reach the lifecycle host. */
  it('never routes an unpaid outcome to the booking screen', () => {
    for (const outcome of ['failed', 'processing', 'cancelled', 'unavailable'] as const) {
      expect(destinationForPayment(outcome, BOOKING)).not.toBe(`/booking/${BOOKING}`);
    }
  });
});
