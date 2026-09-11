import { Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { createStubApi, createTestRuntime, renderWithRuntime } from '@/test/renderWithRuntime';
import type { StubHandlers } from '@/test/renderWithRuntime';

import { CheckoutCancelledError, CheckoutFailedError } from '@features/payment';
import type { CheckoutLauncher } from '@features/payment';

import { usePaymentRetry } from './data';
import type { PaymentOutcome } from './data';

/**
 * `usePaymentRetry` shares its outcome classification (`payAndClassify`) with
 * `useBookingSubmission.submit()` — a regression here would silently break both the first
 * payment attempt and every retry. Exercised through a STUB launcher (`CheckoutLauncher` is
 * already the seam `usePayForBooking` injects it through) rather than the real Razorpay SDK,
 * which has no native module in a test environment.
 */

const ORDER_CREATED = {
  paymentId: 'pay-1',
  provider: 'razorpay' as const,
  providerOrderId: 'order_1',
  amountPaise: 13545,
  currency: 'INR' as const,
  status: 'created' as const,
  keyId: 'rzp_test_key',
};

const ORDER_PROCESSING = {
  ...ORDER_CREATED,
  providerOrderId: null,
  status: 'processing' as const,
  keyId: null,
};

function stubLauncher(open: CheckoutLauncher['open']): CheckoutLauncher {
  return { open };
}

function RetryHarness({
  bookingId,
  launcher,
  onOutcome,
}: {
  bookingId: string;
  launcher: CheckoutLauncher;
  onOutcome: (outcome: PaymentOutcome) => void;
}) {
  const retry = usePaymentRetry(bookingId, launcher);
  return (
    <Text
      testID="retry"
      onPress={() => {
        void retry.retry().then(onOutcome);
      }}
    >
      retry
    </Text>
  );
}

function renderRetry(
  launcher: CheckoutLauncher,
  outcomes: PaymentOutcome[],
  api: ReturnType<typeof createStubApi>,
) {
  return renderWithRuntime(
    <RetryHarness
      bookingId="bk-1"
      launcher={launcher}
      onOutcome={(outcome) => outcomes.push(outcome)}
    />,
    { runtime: createTestRuntime({ api }) },
  );
}

/** Records every call the hook makes, so a test can assert on headers — same shape as
 * `submission.test.tsx`'s helper of the same name. */
function recordingApi(handlers: StubHandlers) {
  const calls: { key: string; headers: Record<string, string> | undefined }[] = [];
  const stub = createStubApi(handlers);

  return {
    calls,
    api: {
      async request(path: string, options: Parameters<typeof stub.request>[1]) {
        calls.push({
          key: `${options.method ?? 'GET'} ${path}`,
          headers: options.headers as Record<string, string> | undefined,
        });
        return stub.request(path, options);
      },
    } as typeof stub,
  };
}

describe('usePaymentRetry', () => {
  it('resolves verified once checkout and verify both succeed', async () => {
    const outcomes: PaymentOutcome[] = [];
    const api = createStubApi({
      'POST /v1/bookings/bk-1/payments/order': () => ORDER_CREATED,
      'POST /v1/bookings/bk-1/payments/verify': () => ({ ok: true }),
    });
    const launcher = stubLauncher(async () => ({ providerPaymentId: 'pay_1', signature: 'sig' }));

    const { getByTestId } = renderRetry(launcher, outcomes, api);
    fireEvent.press(getByTestId('retry'));

    await waitFor(() => expect(outcomes).toEqual(['verified']));
  });

  it('resolves cancelled when the customer dismisses checkout, without calling verify', async () => {
    const outcomes: PaymentOutcome[] = [];
    const calls: string[] = [];
    const api = createStubApi({
      'POST /v1/bookings/bk-1/payments/order': () => {
        calls.push('order');
        return ORDER_CREATED;
      },
      'POST /v1/bookings/bk-1/payments/verify': () => {
        calls.push('verify');
        return { ok: true };
      },
    });
    const launcher = stubLauncher(async () => {
      throw new CheckoutCancelledError();
    });

    const { getByTestId } = renderRetry(launcher, outcomes, api);
    fireEvent.press(getByTestId('retry'));

    await waitFor(() => expect(outcomes).toEqual(['cancelled']));
    expect(calls).toEqual(['order']);
  });

  it('resolves failed on a declined payment — distinct from a dismissal', async () => {
    const outcomes: PaymentOutcome[] = [];
    const api = createStubApi({
      'POST /v1/bookings/bk-1/payments/order': () => ORDER_CREATED,
    });
    const launcher = stubLauncher(async () => {
      throw new CheckoutFailedError(400, 'Card declined');
    });

    const { getByTestId } = renderRetry(launcher, outcomes, api);
    fireEvent.press(getByTestId('retry'));

    await waitFor(() => expect(outcomes).toEqual(['failed']));
  });

  it('resolves processing without opening checkout when the order is not ready yet', async () => {
    const outcomes: PaymentOutcome[] = [];
    const opened: unknown[] = [];
    const api = createStubApi({
      'POST /v1/bookings/bk-1/payments/order': () => ORDER_PROCESSING,
    });
    const launcher = stubLauncher(async (input) => {
      opened.push(input);
      throw new Error('must not open checkout against a processing order');
    });

    const { getByTestId } = renderRetry(launcher, outcomes, api);
    fireEvent.press(getByTestId('retry'));

    await waitFor(() => expect(outcomes).toEqual(['processing']));
    expect(opened).toEqual([]);
  });

  it('scopes the order request to the booking, so a retry reuses rather than duplicates it', async () => {
    const { calls, api } = recordingApi({
      'POST /v1/bookings/bk-1/payments/order': () => ORDER_CREATED,
      'POST /v1/bookings/bk-1/payments/verify': () => ({ ok: true }),
    });
    const launcher = stubLauncher(async () => ({ providerPaymentId: 'pay_1', signature: 'sig' }));

    const outcomes: PaymentOutcome[] = [];
    const { getByTestId } = renderWithRuntime(
      <RetryHarness bookingId="bk-1" launcher={launcher} onOutcome={(o) => outcomes.push(o)} />,
      { runtime: createTestRuntime({ api }) },
    );
    fireEvent.press(getByTestId('retry'));

    await waitFor(() => expect(outcomes).toEqual(['verified']));
    const order = calls.find((call) => call.key === 'POST /v1/bookings/bk-1/payments/order');
    expect(order?.headers?.['Idempotency-Key']).toEqual(expect.any(String));
  });
});
