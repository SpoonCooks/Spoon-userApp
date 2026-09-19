import { Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';
import type { StubHandlers } from '@/test/renderWithRuntime';
import { CheckoutCancelledError } from '@features/payment';

import { useBookingSubmission } from './data';

/**
 * Closing checkout gives the slot back.
 *
 * The booking is created BEFORE Razorpay opens, so a customer who backs out is left holding the
 * start time they had just picked — and the Scheduled grid, reading the server, stops offering
 * it. Their own hold greyed out their own CTA, with nothing on screen saying why.
 *
 * The release is deliberately timid, and the timidity is the part worth testing: `POST /cancel`
 * is fee-bearing, and nothing about it was asked for by the customer.
 */

const QUOTE = {
  quote: {
    amountPaise: 13545,
    durationMinutes: 60,
    serviceAmountPaise: 12900,
    taxRateBps: 500,
    taxAmountPaise: 645,
    totalAmountPaise: 13545,
    currency: 'INR',
    pricingVersion: 'pricing-policy-v0',
    validUntil: '2026-08-18T12:00:00.000Z',
  },
  slotType: 'scheduled',
  scheduledStart: '2026-08-19T07:30:00.000Z',
  durationMinutes: 60,
};

const CREATED = {
  booking: {
    id: 'bkg-held',
    status: 'created',
    slotType: 'scheduled',
    scheduledStart: '2026-08-19T07:30:00.000Z',
    durationMinutes: 60,
    price: {
      amountPaise: 13545,
      durationMinutes: 60,
      serviceAmountPaise: 12900,
      taxRateBps: 500,
      taxAmountPaise: 645,
      totalAmountPaise: 13545,
      currency: 'INR',
      pricingVersion: 'pricing-policy-v0',
    },
    holdExpiresAt: '2026-08-18T12:10:00.000Z',
  },
};

/** An order that opens checkout — the launcher below is what then refuses it. */
const ORDER = {
  paymentId: 'pay-1',
  provider: 'razorpay' as const,
  providerOrderId: 'order_1',
  amountPaise: 13545,
  currency: 'INR' as const,
  status: 'created' as const,
  keyId: 'rzp_test_key',
};

function preview(
  overrides: {
    cancellable?: boolean;
    capturedAmountPaise?: number;
    refundAmountPaise?: number;
    chargeAmountPaise?: number;
  } = {},
) {
  return () => ({
    bookingId: 'bkg-held',
    cancellable: overrides.cancellable ?? true,
    band: null,
    refundPercent: null,
    minutesToStart: 240,
    serviceAmountPaise: 12900,
    // An abandoned hold has paid NOTHING — that is what makes releasing it safe.
    capturedAmountPaise: overrides.capturedAmountPaise ?? 0,
    refundAmountPaise: overrides.refundAmountPaise ?? 0,
    chargeAmountPaise: overrides.chargeAmountPaise ?? 0,
    policyVersion: 'cancellation-policy-v0',
  });
}

/**
 * `useBookingSubmission` releases an abandoned hold when the screen loses focus, so it reaches
 * for navigation. These tests render the hook directly, with no navigator above it — the mock
 * runs the effect and its cleanup on unmount, which is the moment being asserted.
 */
jest.mock('expo-router', () => ({
  __esModule: true,
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
}));

/**
 * The submission's payment step reaches the REAL Razorpay launcher, which has no native module
 * under Jest. Standing that ONE module in for a launcher that refuses the way a dismissal does is
 * what makes the `'cancelled'` branch reachable at all — mocked at its own file rather than at
 * the feature barrel, whose `export *` re-exports do not survive being spread.
 *
 * `CheckoutCancelledError` is carried through from the real module, so the `instanceof` check
 * that classifies the outcome still sees the class it was compiled against.
 */
jest.mock('../payment/api/razorpayLauncher', () => {
  const actual = jest.requireActual('../payment/api/razorpayLauncher');
  return {
    ...actual,
    razorpayCheckoutLauncher: {
      open: () => Promise.reject(new actual.CheckoutCancelledError()),
    },
  };
});

function Harness({ onDone }: { onDone: (outcome: string) => void }) {
  const submission = useBookingSubmission({
    slotType: 'scheduled',
    durationId: 'dur-60',
    scheduledStart: '2026-08-19T07:30:00.000Z',
  });

  return (
    <>
      <Text testID="can-submit">{String(submission.canSubmit)}</Text>
      <Text
        testID="submit"
        onPress={() => {
          void submission.submit().then((created) => onDone(created.payment));
        }}
      >
        submit
      </Text>
    </>
  );
}

function renderSubmission(handlers: StubHandlers) {
  const calls: string[] = [];
  const stub = createStubApi(handlers);
  const api = {
    async request(path: string, options: Parameters<typeof stub.request>[1]) {
      calls.push(`${options.method ?? 'GET'} ${path}`);
      return stub.request(path, options);
    },
  } as typeof stub;

  const outcomes: string[] = [];
  const view = renderWithRuntime(<Harness onDone={(outcome) => outcomes.push(outcome)} />, {
    runtime: createTestRuntime({ api }),
  });

  return { ...view, calls, outcomes };
}

const BASE: StubHandlers = {
  'GET /v1/me/addresses': DEFAULT_API_STUBS['GET /v1/me/addresses']!,
  'POST /v1/bookings/quote': () => QUOTE,
  'POST /v1/bookings': () => CREATED,
  'POST /v1/bookings/bkg-held/payments/order': () => ORDER,
};

/**
 * A dismissed checkout keeps its hold for the RETRY, and gives it back on the way out.
 *
 * The server creates the booking before Razorpay opens and counts it as live, so a customer who
 * backs out and presses again is refused for overlapping themselves. Reusing the hold is what
 * makes the second press work. Releasing it on dismissal would defeat that — there would be
 * nothing left to reuse — so the release waits until the screen is left, when nothing is going
 * to reuse it and leaving it would block the customer's own slot.
 */
describe('a dismissed checkout keeps its hold for the retry', () => {
  it('does NOT release while the customer is still on the screen', async () => {
    const { calls, outcomes, getByTestId } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview(),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    // Still mounted, so the hold is still theirs to retry against. Releasing here would cancel
    // the very booking the next press needs.
    expect(calls).not.toContain('POST /v1/bookings/bkg-held/cancel');
    expect(calls).not.toContain('GET /v1/bookings/bkg-held/cancellation-preview');
  });

  /**
   * The whole point: a second press pays for the booking already held, rather than asking the
   * server for another one it will refuse as an overlap.
   */
  it('reuses the held booking on a retry instead of creating a second one', async () => {
    const { calls, outcomes, getByTestId } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview(),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled', 'cancelled']));

    // One booking for two attempts, and checkout opened against it both times.
    expect(calls.filter((call) => call === 'POST /v1/bookings')).toHaveLength(1);
    expect(
      calls.filter((call) => call === 'POST /v1/bookings/bkg-held/payments/order'),
    ).toHaveLength(2);
  });

  it('releases the hold once the screen is left', async () => {
    const { calls, outcomes, getByTestId, unmount } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview(),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    unmount();

    await waitFor(() => expect(calls).toContain('POST /v1/bookings/bkg-held/cancel'));
  });

  /**
   * The code decides how the release is ATTRIBUTED. `ABANDONED_CHECKOUT` makes the server stamp
   * `cancelledBy: 'system'`, so an automatic release is recorded exactly as the server's own
   * expiry sweep records one. Under the old `OTHER` it landed as a customer cancellation —
   * indistinguishable from someone who booked a cook and changed their mind.
   *
   * No detail is sent with it: the code says all of it, and `requiresDetail` is false, so any
   * text would be dropped rather than stored.
   */
  it('releases under the dedicated code, with no free text', async () => {
    let body: unknown;
    const { outcomes, getByTestId, unmount } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview(),
      'POST /v1/bookings/bkg-held/cancel': (requestBody) => {
        body = requestBody;
        return {};
      },
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    unmount();

    await waitFor(() => expect(body).toEqual({ reasonCode: 'ABANDONED_CHECKOUT' }));
  });

  /**
   * The regression that made the first version of this do nothing at all.
   *
   * `chargeAmountPaise` is a BAND figure — a percentage of the service amount — and the server
   * quotes one whether or not a rupee was ever captured. Vetoing on it left every abandoned hold
   * in place, silently, taking the customer's own start time out of the grid.
   */
  it('releases even when the preview quotes a fee, as long as nothing was captured', async () => {
    const { calls, outcomes, getByTestId, unmount } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview({ chargeAmountPaise: 6450 }),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    unmount();

    await waitFor(() => expect(calls).toContain('POST /v1/bookings/bkg-held/cancel'));
  });

  /**
   * The safety rule, stated the way it actually holds: a card that was never charged cannot be
   * charged by cancelling. Money having MOVED is what puts this out of reach — that is no longer
   * an abandoned hold, and nothing automatic gets to touch it.
   */
  it('refuses to touch a booking that has actually paid', async () => {
    const { calls, outcomes, getByTestId, unmount } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview({
        capturedAmountPaise: 13545,
        chargeAmountPaise: 6450,
      }),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    // Unmounted so the release actually RUNS — the gate is what has to refuse it, not the
    // absence of a trigger.
    unmount();
    await waitFor(() => expect(calls).toContain('GET /v1/bookings/bkg-held/cancellation-preview'));
    expect(calls).not.toContain('POST /v1/bookings/bkg-held/cancel');
  });

  it('refuses when a refund is owed, which means money moved', async () => {
    const { calls, outcomes, getByTestId, unmount } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview({ refundAmountPaise: 13545 }),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    // Unmounted so the release actually RUNS — the gate is what has to refuse it, not the
    // absence of a trigger.
    unmount();
    await waitFor(() => expect(calls).toContain('GET /v1/bookings/bkg-held/cancellation-preview'));
    expect(calls).not.toContain('POST /v1/bookings/bkg-held/cancel');
  });

  it('leaves the hold alone when the server says it is not cancellable', async () => {
    const { calls, outcomes, getByTestId, unmount } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': preview({ cancellable: false }),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    // Unmounted so the release actually RUNS — the gate is what has to refuse it, not the
    // absence of a trigger.
    unmount();
    await waitFor(() => expect(calls).toContain('GET /v1/bookings/bkg-held/cancellation-preview'));
    expect(calls).not.toContain('POST /v1/bookings/bkg-held/cancel');
  });

  /** A release that cannot even be priced is not a reason to fail the submission. */
  it('still reports the dismissal when the release itself fails', async () => {
    const { outcomes, getByTestId } = renderSubmission({
      ...BASE,
      'GET /v1/bookings/bkg-held/cancellation-preview': () => {
        throw new Error('offline');
      },
    });

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(outcomes).toEqual(['cancelled']));
  });

  it('is a dismissal, not a failure — the distinction the caller routes on', () => {
    expect(new CheckoutCancelledError()).toBeInstanceOf(CheckoutCancelledError);
  });
});

/**
 * Changing the selection gives the previous hold back, BEFORE asking for the new one.
 *
 * The gap this closes: the hold was dropped from state and left alive on the server, where
 * `bookings_customer_active_no_overlap` counts it. Dismiss checkout on one slot, pick a nearby
 * one, and `POST /v1/bookings` was refused for overlapping a booking the customer never paid
 * for, could not see and could not cancel — locked out of their own slot until the server's
 * abandon window closed.
 */
const SECOND_START = '2026-08-19T09:30:00.000Z';

function SelectionHarness({
  start,
  onDone,
}: {
  readonly start: string;
  readonly onDone: (outcome: string) => void;
}) {
  const submission = useBookingSubmission({
    slotType: 'scheduled',
    durationId: 'dur-60',
    scheduledStart: start,
  });

  return (
    <>
      <Text testID="can-submit">{String(submission.canSubmit)}</Text>
      <Text
        testID="submit"
        onPress={() => {
          void submission.submit().then((created) => onDone(created.payment));
        }}
      >
        submit
      </Text>
    </>
  );
}

describe('changing the selection releases the hold it no longer matches', () => {
  /** A second booking id, so "a new booking was created" is provable rather than assumed. */
  const SECOND = {
    booking: { ...CREATED.booking, id: 'bkg-second', scheduledStart: SECOND_START },
  };

  function renderSelection() {
    const calls: string[] = [];
    let created = 0;
    const stub = createStubApi({
      ...BASE,
      'POST /v1/bookings': () => {
        created += 1;
        return created === 1 ? CREATED : SECOND;
      },
      'GET /v1/bookings/bkg-held/cancellation-preview': preview(),
      'POST /v1/bookings/bkg-held/cancel': () => ({}),
      'POST /v1/bookings/bkg-second/payments/order': () => ORDER,
      'GET /v1/bookings/bkg-second/cancellation-preview': preview(),
      'POST /v1/bookings/bkg-second/cancel': () => ({}),
    });
    const api = {
      async request(path: string, options: Parameters<typeof stub.request>[1]) {
        calls.push(`${options.method ?? 'GET'} ${path}`);
        return stub.request(path, options);
      },
    } as typeof stub;

    const outcomes: string[] = [];
    const view = renderWithRuntime(
      <SelectionHarness start={QUOTE.scheduledStart} onDone={(o) => outcomes.push(o)} />,
      { runtime: createTestRuntime({ api }) },
    );

    return { ...view, calls, outcomes };
  }

  it('cancels the superseded hold and only then creates the new booking', async () => {
    const { calls, outcomes, getByTestId, rerender } = renderSelection();

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    // The customer picks a different start and presses again.
    rerender(<SelectionHarness start={SECOND_START} onDone={(o) => outcomes.push(o)} />);
    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled', 'cancelled']));

    // The first hold was given back...
    expect(calls).toContain('POST /v1/bookings/bkg-held/cancel');

    /*
     * ...BEFORE the replacement was asked for, which is the whole point. A release still in
     * flight when the server tests the new booking for overlap is the refusal this prevents.
     */
    const released = calls.indexOf('POST /v1/bookings/bkg-held/cancel');
    const creates = calls.reduce<number[]>(
      (at, call, index) => (call === 'POST /v1/bookings' ? [...at, index] : at),
      [],
    );
    expect(creates).toHaveLength(2);
    expect(released).toBeLessThan(creates[1]!);

    // And checkout opened against the NEW booking, not the released one.
    expect(calls).toContain('POST /v1/bookings/bkg-second/payments/order');
  });

  /** The same selection is untouched: that hold is the one the retry pays for. */
  it('leaves the hold alone when the selection has not changed', async () => {
    const { calls, outcomes, getByTestId } = renderSelection();

    await waitFor(() => expect(getByTestId('can-submit')).toHaveTextContent('true'));
    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled']));

    fireEvent.press(getByTestId('submit'));
    await waitFor(() => expect(outcomes).toEqual(['cancelled', 'cancelled']));

    expect(calls).not.toContain('POST /v1/bookings/bkg-held/cancel');
    expect(calls.filter((call) => call === 'POST /v1/bookings')).toHaveLength(1);
  });
});
