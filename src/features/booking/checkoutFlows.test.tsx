import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { RuntimeProvider } from '@core/runtimeContext';
import type { AppRuntime } from '@core/runtime';
import { createStubApi, createTestRuntime } from '@/test/renderWithRuntime';
import type { StubHandlers } from '@/test/renderWithRuntime';
import type { CheckoutLauncher } from '@features/payment';

import { idempotency } from '@core/api';
import type { ApiClient } from '@core/api';

import { ratingScopeFor, useCreateExtension, useRateBooking, useTipCook } from './api';

/**
 * Tip and extension are PAID operations, and rating carries a value the wire used to lose.
 *
 * All three used to stop one step short of the truth: `POST /tips` and `POST /extensions` each
 * return a real Razorpay order and each reply was discarded, so the app reported success for a
 * payment nobody had made; and the `5+` chip was collapsed to a bare `stars: 5`. The contract now
 * carries all three, and these tests are what keeps the client honest about them.
 *
 * What is asserted is the INVARIANT, not the implementation: the amount and the order come from
 * the server, checkout is opened with exactly what the server sent, verification is always
 * attempted for whatever was opened, and nothing claims success that the backend has not
 * confirmed. A cancelled checkout must leave no verified payment behind.
 */

const BOOKING_ID = 'bkg-1';

function wrapperFor(runtime: AppRuntime) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={runtime.queryClient}>
        <RuntimeProvider runtime={runtime}>{children}</RuntimeProvider>
      </QueryClientProvider>
    );
  };
}

function runtimeWith(handlers: StubHandlers): AppRuntime {
  return createTestRuntime({ api: createStubApi(handlers) });
}

/** A launcher that records what it was opened with and returns a Razorpay-shaped result. */
function recordingLauncher() {
  const opened: Parameters<CheckoutLauncher['open']>[0][] = [];
  const launcher: CheckoutLauncher = {
    async open(input) {
      opened.push(input);
      return { providerPaymentId: 'pay_live_1', signature: 'sig_1' };
    },
  };
  return { launcher, opened };
}

/** A launcher that refuses, standing in for the customer dismissing the sheet. */
function cancellingLauncher(): CheckoutLauncher {
  return {
    async open() {
      throw new Error('Checkout dismissed');
    },
  };
}

const TIP_ORDER = {
  tipId: 'tip-1',
  paymentId: 'pmt-1',
  bookingId: BOOKING_ID,
  cookId: 'cook-1',
  provider: 'razorpay',
  amountPaise: 5000,
  currency: 'INR',
  status: 'created',
  providerOrderId: 'order_tip_1',
  keyId: 'rzp_test_key',
};

const EXTENSION_QUOTE = {
  extensionId: 'ext-1',
  state: 'payment_pending',
  paymentId: 'pmt-2',
  minutes: 20,
  pricePaise: 3500,
  taxAmountPaise: 175,
  totalAmountPaise: 3675,
  currency: 'INR',
  pricingVersion: 'extension-pricing-owner-skus-v1',
  newExpectedEnd: '2026-08-20T14:20:00.000Z',
  calculatedAt: '2026-08-20T13:00:00.000Z',
  providerOrderId: 'order_ext_1',
  keyId: 'rzp_test_key',
};

/* ------------------------------------------------------------------------ tip */

describe('tip checkout', () => {
  it('opens checkout with the SERVER order and then verifies it', async () => {
    const tips = jest.fn(() => TIP_ORDER);
    const verify = jest.fn(() => {
      const { keyId: _keyId, ...settled } = TIP_ORDER;
      return { ...settled, status: 'captured' };
    });
    const { launcher, opened } = recordingLauncher();

    const runtime = runtimeWith({
      [`POST /v1/bookings/${BOOKING_ID}/tips`]: tips,
      [`POST /v1/bookings/${BOOKING_ID}/tips/verify`]: verify,
    });

    const { result } = renderHook(() => useTipCook(launcher), { wrapper: wrapperFor(runtime) });

    await result.current.mutateAsync({
      bookingId: BOOKING_ID,
      amountPaise: 5000,
      scope: 'booking.tip:bkg-1',
    });

    // Every value handed to Razorpay is the server's, not the client's.
    expect(opened).toHaveLength(1);
    expect(opened[0]).toMatchObject({
      keyId: 'rzp_test_key',
      providerOrderId: 'order_tip_1',
      amountPaise: 5000,
      currency: 'INR',
    });

    // The callback is forwarded untouched to the only party that can check the signature.
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith({
      providerPaymentId: 'pay_live_1',
      signature: 'sig_1',
    });
  });

  it('does not open checkout, or verify, while the provider order is still processing', async () => {
    const verify = jest.fn();
    const { launcher, opened } = recordingLauncher();

    const runtime = runtimeWith({
      [`POST /v1/bookings/${BOOKING_ID}/tips`]: () => ({
        ...TIP_ORDER,
        status: 'processing',
        providerOrderId: null,
      }),
      [`POST /v1/bookings/${BOOKING_ID}/tips/verify`]: verify,
    });

    const { result } = renderHook(() => useTipCook(launcher), { wrapper: wrapperFor(runtime) });

    const order = await result.current.mutateAsync({
      bookingId: BOOKING_ID,
      amountPaise: 5000,
      scope: 'booking.tip:bkg-1',
    });

    expect(order.status).toBe('processing');
    expect(opened).toHaveLength(0);
    expect(verify).not.toHaveBeenCalled();
  });

  it('verifies nothing when the customer dismisses checkout', async () => {
    const verify = jest.fn();
    const runtime = runtimeWith({
      [`POST /v1/bookings/${BOOKING_ID}/tips`]: () => TIP_ORDER,
      [`POST /v1/bookings/${BOOKING_ID}/tips/verify`]: verify,
    });

    const { result } = renderHook(() => useTipCook(cancellingLauncher()), {
      wrapper: wrapperFor(runtime),
    });

    await expect(
      result.current.mutateAsync({
        bookingId: BOOKING_ID,
        amountPaise: 5000,
        scope: 'booking.tip:bkg-1',
      }),
    ).rejects.toThrow();

    expect(verify).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ extension */

describe('extension checkout', () => {
  it('keeps the extensionId across checkout and verifies against THAT extension', async () => {
    const create = jest.fn(() => EXTENSION_QUOTE);
    const verify = jest.fn(() => ({ ok: true }));
    const { launcher, opened } = recordingLauncher();

    const runtime = runtimeWith({
      [`POST /v1/bookings/${BOOKING_ID}/extensions`]: create,
      // The route is extension-SCOPED: verifying against the booking would settle the wrong thing.
      [`POST /v1/bookings/${BOOKING_ID}/extensions/ext-1/verify-payment`]: verify,
    });

    const { result } = renderHook(() => useCreateExtension(launcher), {
      wrapper: wrapperFor(runtime),
    });

    await result.current.mutateAsync({
      bookingId: BOOKING_ID,
      minutes: 20,
      scope: 'booking.extend:bkg-1:20',
    });

    // The backend's total, never a locally computed per-minute charge.
    expect(opened[0]).toMatchObject({
      keyId: 'rzp_test_key',
      providerOrderId: 'order_ext_1',
      amountPaise: 3675,
      currency: 'INR',
    });
    expect(verify).toHaveBeenCalledWith({
      providerPaymentId: 'pay_live_1',
      signature: 'sig_1',
    });
  });

  it('does not extend locally when the customer dismisses checkout', async () => {
    const verify = jest.fn();
    const runtime = runtimeWith({
      [`POST /v1/bookings/${BOOKING_ID}/extensions`]: () => EXTENSION_QUOTE,
      [`POST /v1/bookings/${BOOKING_ID}/extensions/ext-1/verify-payment`]: verify,
    });

    const { result } = renderHook(() => useCreateExtension(cancellingLauncher()), {
      wrapper: wrapperFor(runtime),
    });

    await expect(
      result.current.mutateAsync({
        bookingId: BOOKING_ID,
        minutes: 20,
        scope: 'booking.extend:bkg-1:20',
      }),
    ).rejects.toThrow();

    expect(verify).not.toHaveBeenCalled();
  });

  /**
   * The one step the contract has not caught up with.
   *
   * `POST /payments/order` and `POST /tips` both attach the public Razorpay key; the extension
   * quote does not. Without a key there is nothing legitimate to open checkout with, so the flow
   * REFUSES rather than guessing one — and it must not fall back to an embedded key or report a
   * payment that never happened.
   */
  it('refuses to open checkout when the quote carries no publishable key', async () => {
    const verify = jest.fn();
    const { launcher, opened } = recordingLauncher();
    const { keyId: _keyId, ...quoteWithoutKey } = EXTENSION_QUOTE;

    const runtime = runtimeWith({
      [`POST /v1/bookings/${BOOKING_ID}/extensions`]: () => quoteWithoutKey,
      [`POST /v1/bookings/${BOOKING_ID}/extensions/ext-1/verify-payment`]: verify,
    });

    const { result } = renderHook(() => useCreateExtension(launcher), {
      wrapper: wrapperFor(runtime),
    });

    await expect(
      result.current.mutateAsync({
        bookingId: BOOKING_ID,
        minutes: 20,
        scope: 'booking.extend:bkg-1:20',
      }),
    ).rejects.toThrow(/publishable key/i);

    expect(opened).toHaveLength(0);
    expect(verify).not.toHaveBeenCalled();
  });
});

/* --------------------------------------------------------------------- rating */

describe('rating', () => {
  const ratingReply = (exceptional: boolean) => ({
    ratingId: 'rat-1',
    bookingId: BOOKING_ID,
    cookId: 'cook-1',
    stars: 5,
    isFivePlus: true,
    exceptional,
    created: true,
  });

  it('sends no `exceptional` for an ordinary rating', async () => {
    const rate = jest.fn(() => ratingReply(false));
    const runtime = runtimeWith({ [`PUT /v1/bookings/${BOOKING_ID}/rating`]: rate });

    const { result } = renderHook(() => useRateBooking(), { wrapper: wrapperFor(runtime) });

    await result.current.mutateAsync({
      bookingId: BOOKING_ID,
      stars: 5,
      scope: 'booking.rate:bkg-1',
    });

    await waitFor(() => expect(rate).toHaveBeenCalledTimes(1));
    // The contract defaults it to false; an ordinary 5 stays silent about a chip nobody pressed.
    expect(rate).toHaveBeenCalledWith({ stars: 5 });
  });

  it('records the `5+` chip as stars 5 AND exceptional', async () => {
    const rate = jest.fn(() => ratingReply(true));
    const runtime = runtimeWith({ [`PUT /v1/bookings/${BOOKING_ID}/rating`]: rate });

    const { result } = renderHook(() => useRateBooking(), { wrapper: wrapperFor(runtime) });

    const saved = await result.current.mutateAsync({
      bookingId: BOOKING_ID,
      stars: 5,
      exceptional: true,
      scope: 'booking.rate:bkg-1',
    });

    // Valid only as the PAIR — the server refuses `exceptional` on any other star value.
    expect(rate).toHaveBeenCalledWith({ stars: 5, exceptional: true });
    // The reply is parsed, not discarded: `exceptional` here is the STORED answer.
    expect(saved.exceptional).toBe(true);
    expect(saved.created).toBe(true);
  });
});

/**
 * Rating and writing arrive as two calls from two screens, and the scope store is in memory —
 * so one scope means one key, and the backend rejects a key reused with a different body (409
 * IDEMPOTENCY_CONFLICT) before the rating logic runs. Under a single scope a customer who rated
 * from Home and then wrote something on the booking had their feedback silently dropped.
 */
describe('ratingScopeFor — writing is a different intent from rating', () => {
  it('scopes a bare rating and a rating WITH words to different intents', () => {
    expect(ratingScopeFor('bkg-1', undefined)).not.toBe(ratingScopeFor('bkg-1', 'Lovely food'));
  });

  it('treats blank words as no words, so a retry of a bare rating replays it', () => {
    const bare = ratingScopeFor('bkg-1', undefined);
    expect(ratingScopeFor('bkg-1', '')).toBe(bare);
    expect(ratingScopeFor('bkg-1', '   ')).toBe(bare);
  });

  /** A retry of the SAME intent has to repeat its key — that is what the store is for. */
  it('is stable for the same booking and the same kind of submission', () => {
    expect(ratingScopeFor('bkg-1', 'Lovely food')).toBe(ratingScopeFor('bkg-1', 'Lovely food'));
    // ...and the words themselves do not split it further: editing before a retry is one intent.
    expect(ratingScopeFor('bkg-1', 'Lovely food')).toBe(ratingScopeFor('bkg-1', 'Great roti'));
  });

  it('never collides across bookings', () => {
    expect(ratingScopeFor('bkg-1', 'a')).not.toBe(ratingScopeFor('bkg-2', 'a'));
  });
});

/* ------------------------------------------------- tip idempotency: one key per ATTEMPT */

/** A stub that records the `Idempotency-Key` each call carried, which is the whole subject here. */
function keyRecordingRuntime(handlers: StubHandlers) {
  const sent: { path: string; key: string | undefined }[] = [];
  const api: ApiClient = {
    async request(path, options) {
      const method = options.method ?? 'GET';
      const handler = handlers[`${method} ${path}`];
      if (handler === undefined) throw new Error(`No stub for ${method} ${path}`);
      const headers = options.headers as Record<string, string> | undefined;
      sent.push({ path, key: headers?.['Idempotency-Key'] });
      return options.parse(handler(options.body));
    },
  };
  return { runtime: createTestRuntime({ api }), sent };
}

function settledTip() {
  const { keyId: _keyId, ...settled } = TIP_ORDER;
  return { ...settled, status: 'captured' };
}

describe('tip idempotency — the key names an ATTEMPT, never a booking', () => {
  it('releases the attempt key when checkout FAILS, not only when it succeeds', async () => {
    const runtime = runtimeWith({
      [`POST /v1/bookings/${BOOKING_ID}/tips`]: () => TIP_ORDER,
      [`POST /v1/bookings/${BOOKING_ID}/tips/verify`]: () => settledTip(),
    });

    const { result } = renderHook(() => useTipCook(cancellingLauncher()), {
      wrapper: wrapperFor(runtime),
    });

    const scope = `booking.tip.${BOOKING_ID}.attempt-a`;
    await expect(
      result.current.mutateAsync({ bookingId: BOOKING_ID, amountPaise: 5000, scope }),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isPending).toBe(false));

    /*
     * The regression. Release used to sit at the end of the happy path, so a dismissed or failed
     * checkout left the key held -- and the backend commits its claim as `processing` BEFORE
     * calling Razorpay, so reusing that key mid-flight does not replay and does not 409. It falls
     * through and mints a SECOND tip, payment and provider order. A key that outlives its attempt
     * is the whole hazard.
     */
    expect(idempotency.has(scope)).toBe(false);
    expect(idempotency.has(`${scope}.verify`)).toBe(false);
  });

  it('verifies under the ATTEMPT key, so a second tip does not collide with the first', async () => {
    const { runtime, sent } = keyRecordingRuntime({
      [`POST /v1/bookings/${BOOKING_ID}/tips`]: () => TIP_ORDER,
      [`POST /v1/bookings/${BOOKING_ID}/tips/verify`]: () => settledTip(),
    });

    const { launcher } = recordingLauncher();
    const { result } = renderHook(() => useTipCook(launcher), { wrapper: wrapperFor(runtime) });

    // Tips are NOT capped per booking, so this is an ordinary thing for a customer to do.
    for (const attempt of ['attempt-a', 'attempt-b']) {
      await result.current.mutateAsync({
        bookingId: BOOKING_ID,
        amountPaise: 5000,
        scope: `booking.tip.${BOOKING_ID}.${attempt}`,
      });
    }

    const verifyKeys = sent.filter((call) => call.path.endsWith('/verify')).map((call) => call.key);
    expect(verifyKeys).toHaveLength(2);

    /*
     * Verify used a scope fixed per BOOKING (`booking.tip.verify:<id>`) that nothing released, so
     * the second tip verified under the first tip's key carrying a different Razorpay payload --
     * a request-hash mismatch, which the backend answers 409 unconditionally. The payment was
     * captured and the customer could never have it verified.
     */
    expect(verifyKeys[0]).not.toBe(verifyKeys[1]);
    expect(verifyKeys[0]).toBeDefined();
  });
});
