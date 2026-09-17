import {
  CheckoutCancelledError,
  CheckoutFailedError,
  CheckoutSdkMissingError,
  razorpayCheckoutLauncher,
} from './razorpayLauncher';

/**
 * The checkout launcher.
 *
 * What is worth testing here is not that the SDK gets called — it is that NOTHING this file
 * returns can be mistaken for a payment the customer did not make. Every case below is either
 * "forward exactly what the SDK gave" or "refuse", and there is deliberately no third option.
 *
 * The module is required lazily, so each test controls what that require resolves to.
 */

// `mock`-prefixed so the factory below may close over it — jest hoists `jest.mock` above the
// declarations, and only that prefix is exempt from the out-of-scope guard.
const mockOpen = jest.fn();

jest.mock('react-native-razorpay', () => ({ __esModule: true, default: { open: mockOpen } }), {
  virtual: true,
});

const ORDER = {
  keyId: 'rzp_test_publishable',
  providerOrderId: 'order_ABC123',
  amountPaise: 19800,
  currency: 'INR',
  description: 'Spoon cooking service',
} as const;

beforeEach(() => {
  mockOpen.mockReset();
});

describe('razorpayCheckoutLauncher', () => {
  it('forwards the payment id and signature exactly as the SDK gave them', async () => {
    mockOpen.mockResolvedValue({
      razorpay_payment_id: 'pay_XYZ789',
      razorpay_order_id: 'order_ABC123',
      razorpay_signature: 'a-signature-only-the-backend-can-check',
    });

    const result = await razorpayCheckoutLauncher.open(ORDER);

    expect(result).toEqual({
      providerPaymentId: 'pay_XYZ789',
      signature: 'a-signature-only-the-backend-can-check',
    });
  });

  it('sends the order id and the amount the BACKEND priced, in paise, untouched', async () => {
    mockOpen.mockResolvedValue({ razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' });

    await razorpayCheckoutLauncher.open(ORDER);

    // Razorpay's `amount` is the smallest currency unit, which is the unit the order already
    // carries. A conversion here would charge the customer 100× or 1/100 of the real price.
    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'rzp_test_publishable',
        order_id: 'order_ABC123',
        amount: 19800,
        currency: 'INR',
      }),
    );
  });

  it('reports a dismissed sheet as a cancellation, not as a failure', async () => {
    // `0` is `Checkout.PAYMENT_CANCELED` in the bundled SDK — see the constant's own comment.
    mockOpen.mockRejectedValue({ code: 0, description: 'Payment processing cancelled by user' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  /**
   * A dismissal was observed reaching this launcher classified as a FAILURE — a customer who
   * changed their mind was shown "Your payment failed" instead of being left alone. The numeric
   * code Android's SDK sends is not the only signal this app can see, so it no longer has to be
   * the only one that counts.
   */
  it('still reports a cancellation when the numeric code does not match Android’s constant', async () => {
    mockOpen.mockRejectedValue({ code: 99, description: 'Payment Cancelled' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  it('recognises a cancellation worded only in `reason`, with no matching code', async () => {
    mockOpen.mockRejectedValue({
      code: 100,
      description: 'Payment failed',
      reason: 'payment_cancelled',
    });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  /**
   * Captured from a device: Razorpay nests `reason` inside `details`, not at the top level its
   * own published type shows. Read only at the top level it was always null, so this fallback
   * existed without ever being able to fire.
   */
  it('finds `reason` where Razorpay actually puts it — nested under `details`', async () => {
    mockOpen.mockRejectedValue({
      code: 400,
      description: 'Payment failed',
      details: { reason: 'payment_cancelled', source: 'customer', step: 'payment_authentication' },
    });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  it('still treats a nested reason that is NOT a cancellation as a failure', async () => {
    mockOpen.mockRejectedValue({
      code: 400,
      description: 'Your payment was declined by the bank',
      details: { reason: 'payment_failed', source: 'bank', step: 'payment_authorization' },
    });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(CheckoutFailedError);
  });

  it('finds `reason` under `error` too — the OTHER shape a device has sent', async () => {
    mockOpen.mockRejectedValue({
      code: 0,
      description: 'irrelevant',
      error: { reason: 'payment_cancelled', source: 'customer', step: 'payment_authentication' },
    });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  /**
   * The rejection a Galaxy S21 actually produced when the customer tapped "Yes, exit" — captured
   * verbatim, `error` and all. It is pinned here for one reason: it is the shape that made
   * `readReason` log `reason: null`, because the nested body arrived under `error` while only
   * `details` was being read.
   *
   * It used to classify as a FAILURE, and that was accepted on the grounds that Razorpay words
   * this one `payment_error` with `description: "undefined"` and so says nothing a wording
   * heuristic can find. True — but it does say something: the OUTER numeric `code` is `0`,
   * which is `Checkout.PAYMENT_CANCELED` in the bundled SDK. The constant was being compared
   * against `2` (NETWORK_ERROR), so the one honest signal in this payload was thrown away and
   * every dismissal on Android landed the customer on "Your payment failed".
   *
   * Pinned verbatim, `error` and all, because it is the exact shape that has to classify as a
   * cancellation for a customer who exits on purpose to be left where they were.
   */
  it('classifies a real device dismissal as a cancellation, on the code Razorpay does send', async () => {
    const body = {
      code: 'BAD_REQUEST_ERROR',
      description: 'undefined',
      source: 'customer',
      step: 'payment_authentication',
      reason: 'payment_error',
      metadata: {},
    };
    mockOpen.mockRejectedValue({
      code: 0,
      description: JSON.stringify({ error: body }),
      error: body,
    });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  /** NETWORK_ERROR is 2, and it is not a dismissal — the exact confusion this constant had. */
  it('does not read a network error as a dismissal', async () => {
    mockOpen.mockRejectedValue({ code: 2, description: 'Network error' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(CheckoutFailedError);
  });

  it('recognises a dismissal worded that way instead of "cancel"', async () => {
    mockOpen.mockRejectedValue({ code: 99, description: 'Checkout form dismissed' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  it('reports any other provider rejection as a failure, keeping its reason for logs', async () => {
    mockOpen.mockRejectedValue({ code: 5, description: 'Your card was declined' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toMatchObject({
      name: 'CheckoutFailedError',
      providerCode: 5,
      providerDescription: 'Your card was declined',
    });
  });

  it('survives a rejection that is not shaped like the SDK contract', async () => {
    mockOpen.mockRejectedValue('something entirely unexpected');

    const error = await razorpayCheckoutLauncher.open(ORDER).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(CheckoutFailedError);
    expect((error as CheckoutFailedError).providerCode).toBeNull();
  });

  it('REFUSES a success that carries no signature, rather than sending an empty one', async () => {
    // The backend verifies the signature; a result it cannot check is not a payment. Passing an
    // empty string through would turn a contract violation into a rejected verify and a booking
    // stuck on hold with no explanation.
    mockOpen.mockResolvedValue({ razorpay_payment_id: 'pay_NOSIG' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(CheckoutFailedError);
  });

  it('never invents a payment id when the native module is missing', async () => {
    jest.isolateModules(() => {
      jest.doMock(
        'react-native-razorpay',
        () => {
          throw new Error('Native module RNRazorpayCheckout is not available');
        },
        { virtual: true },
      );
    });

    // Re-require through the isolated registry so the lazy require hits the throwing mock.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { razorpayCheckoutLauncher: launcher } = require('./razorpayLauncher') as {
      razorpayCheckoutLauncher: typeof razorpayCheckoutLauncher;
    };

    await expect(launcher.open(ORDER)).rejects.toBeInstanceOf(Error);
  });
});

describe('the errors are distinguishable', () => {
  it('separates cancelled, failed and missing-SDK so a caller can act differently', () => {
    expect(new CheckoutCancelledError()).toBeInstanceOf(CheckoutCancelledError);
    expect(new CheckoutFailedError(1, 'x')).not.toBeInstanceOf(CheckoutCancelledError);
    expect(new CheckoutSdkMissingError(new Error('x'))).not.toBeInstanceOf(CheckoutFailedError);
  });
});
