import { paymentErrorMessage } from './checkoutMessage';
import { CheckoutCancelledError, CheckoutFailedError } from './razorpayLauncher';

/**
 * The one rule worth pinning down: a customer who closed checkout is not told their payment
 * failed. It has already been got wrong once on the booking flow, on a full screen, so it is
 * asserted here rather than left to each surface to remember.
 */
describe('paymentErrorMessage', () => {
  it('says nothing when the customer dismissed checkout', () => {
    expect(paymentErrorMessage(new CheckoutCancelledError())).toBeNull();
  });

  it('says nothing when there is no error at all', () => {
    expect(paymentErrorMessage(null)).toBeNull();
    expect(paymentErrorMessage(undefined)).toBeNull();
  });

  it('reports a genuine checkout failure in the customer’s words', () => {
    const message = paymentErrorMessage(new CheckoutFailedError(1, 'Your card was declined'));

    expect(message).not.toBeNull();
    // The taxonomy's wording, never the provider's raw description handed straight through.
    expect(message).not.toContain('Your card was declined');
  });

  it('reports an ordinary transport failure too', () => {
    expect(paymentErrorMessage(new Error('network down'))).not.toBeNull();
  });
});
