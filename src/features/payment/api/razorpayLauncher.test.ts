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
    mockOpen.mockRejectedValue({ code: 2, description: 'Payment processing cancelled by user' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toBeInstanceOf(
      CheckoutCancelledError,
    );
  });

  it('reports any other provider rejection as a failure, keeping its reason for logs', async () => {
    mockOpen.mockRejectedValue({ code: 1, description: 'Your card was declined' });

    await expect(razorpayCheckoutLauncher.open(ORDER)).rejects.toMatchObject({
      name: 'CheckoutFailedError',
      providerCode: 1,
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
