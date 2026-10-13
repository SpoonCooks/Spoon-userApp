import {
  mandateCheckoutSchema,
  mandateStatusViewSchema,
  recurringEligibilitySchema,
} from './schemas';

/** The UPI Intent additions to the mandate contract (V0 `feat/upi-intent-autopay`). */

const CHECKOUT = {
  mandateId: 'm-1',
  recurringBookingId: 'rb-1',
  method: 'upi',
  status: 'pending',
  provider: 'razorpay',
  providerOrderId: 'order_1',
  providerCustomerId: 'cust_1',
  amountPaise: 100,
  currency: 'INR',
  maxAmountPaise: 100_000,
  approveBy: '2026-10-13T06:30:00.000Z',
  keyId: 'rzp_test_x',
};

describe('mandate schemas', () => {
  it('reads a Checkout answer unchanged, and an Intent answer with its link', () => {
    expect(mandateCheckoutSchema.parse(CHECKOUT).intentLink).toBeUndefined();
    const intent = mandateCheckoutSchema.parse({
      ...CHECKOUT,
      intentLink: 'upi://mandate?pa=x@razorpay',
      providerPaymentId: 'pay_1',
      attemptExpiresAt: '2026-10-13T06:05:00.000Z',
    });
    expect(intent).toMatchObject({
      intentLink: 'upi://mandate?pa=x@razorpay',
      providerPaymentId: 'pay_1',
    });
  });

  it('refuses an intent link that is not a upi:// link', () => {
    expect(() =>
      mandateCheckoutSchema.parse({ ...CHECKOUT, intentLink: 'https://evil.example' }),
    ).toThrow();
  });

  it('reads the status poll, with and without an attempt', () => {
    const base = {
      mandateId: 'm-1',
      recurringBookingId: 'rb-1',
      status: 'rejected',
      bookingStatus: 'pending_mandate',
      approveBy: null,
      handleMasked: null,
      maxAmountPaise: 100_000,
    };
    expect(mandateStatusViewSchema.parse({ ...base, attempt: null }).attempt).toBeNull();
    expect(
      mandateStatusViewSchema.parse({
        ...base,
        attempt: { state: 'failed', failureReason: 'NOT_APPROVED', expiresAt: null },
      }).attempt,
    ).toEqual({ state: 'failed', failureReason: 'NOT_APPROVED', expiresAt: null });
    expect(() =>
      mandateStatusViewSchema.parse({
        ...base,
        attempt: { state: 'lost', failureReason: null, expiresAt: null },
      }),
    ).toThrow();
  });

  it('defaults the approval flow to Checkout for an older or unknown answer', () => {
    const eligibility = {
      policyVersion: 'p',
      unlocked: true,
      poolCount: 2,
      unlockThreshold: 2,
      chip: 'book',
      liveBookings: [],
      window: { startDate: '2026-10-16', endDate: '2026-11-05' },
      limits: { minDays: 5, maxDays: 14 },
      timesOfDay: [],
      durations: [],
      charging: { notifyLeadHours: 27, debitLeadHours: 3, mandateMaxChargePaise: 100_000 },
    };
    expect(recurringEligibilitySchema.parse(eligibility).charging.mandateFlow).toBe('checkout');
    expect(
      recurringEligibilitySchema.parse({
        ...eligibility,
        charging: { ...eligibility.charging, mandateFlow: 'upi_intent' },
      }).charging.mandateFlow,
    ).toBe('upi_intent');
    expect(
      recurringEligibilitySchema.parse({
        ...eligibility,
        charging: { ...eligibility.charging, mandateFlow: 'qr' },
      }).charging.mandateFlow,
    ).toBe('checkout');
  });
});
