import type { ApiClient, RequestOptions } from '@core/api';

import { createRecurringApi } from './recurringApi';
import type { RecurringDraftInput } from './recurringApi';

/**
 * The Recurring booking wire contract — DEC-086 (V2).
 *
 * Payloads are transcribed from the backend's own response builders (`booking-capacity.ts`,
 * `recurring-booking-service.ts`, `recurring-cancellation.ts`, `mandate-service.ts`), not a live
 * instance. The body assertions matter more than usual: every Recurring body is
 * `additionalProperties: false`, and the draft rules (Visit 1 on every day of its Plan, `dates`
 * refused on Visit 1) come back as a 400.
 */

interface Captured {
  path: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
}

function recording(response: unknown) {
  const calls: Captured[] = [];
  const api: ApiClient = {
    async request<T>(path: string, options: RequestOptions<T>): Promise<T> {
      calls.push({
        path,
        method: options.method ?? 'GET',
        body: options.body,
        headers: { ...(options.headers ?? {}) },
      });
      return options.parse(response);
    },
  };
  return { calls, recurring: createRecurringApi(api) };
}

const PRICE = {
  durationMinutes: 60,
  basePricePaise: 30000,
  pricePaise: 12900,
  gstPaise: 645,
  totalPaise: 13545,
  pricingVersion: 'pricing-2026-09-01',
};

const ELIGIBILITY = {
  policyVersion: 'recurring-v2-spec-1',
  unlocked: true,
  poolCount: 2,
  unlockThreshold: 2,
  chip: 'book',
  liveBookings: [],
  window: { startDate: '2026-10-05', endDate: '2026-10-25' },
  limits: { minDays: 5, maxDays: 14 },
  timesOfDay: [{ timeOfDay: 'morning', firstStart: '05:00', lastStart: '11:45' }],
  durations: [PRICE],
  charging: { notifyLeadHours: 27, debitLeadHours: 3, mandateMaxChargePaise: 100000 },
};

const DRAFT: RecurringDraftInput = {
  addressId: '11111111-1111-4111-8111-111111111111',
  plans: [
    {
      planNumber: 1,
      dates: ['2026-10-06', '2026-10-07', '2026-10-08'],
      visits: [
        { visitNumber: 1, timeOfDay: 'morning', durationMinutes: 60, startTime: '08:00' },
        {
          visitNumber: 2,
          timeOfDay: 'evening',
          durationMinutes: 30,
          startTime: '19:30',
          dates: ['2026-10-06'],
        },
      ],
    },
    {
      planNumber: 2,
      dates: ['2026-10-09', '2026-10-10'],
      visits: [{ visitNumber: 1, timeOfDay: 'afternoon', durationMinutes: 60, startTime: '13:00' }],
    },
  ],
};

const VISIT = {
  visitId: 'visit-1',
  planNumber: 1,
  visitNumber: 1,
  date: '2026-10-06',
  timeOfDay: 'morning',
  startTime: '08:00',
  start: '2026-10-06T02:30:00.000Z',
  durationMinutes: 60,
  status: 'scheduled',
  displayState: 'cook_pending',
  cookConfirmBy: '2026-10-05T23:30:00.000Z',
  cook: null,
  bookingId: null,
  totalPaise: 13545,
  cancelledBy: null,
};

const BOOKING = {
  recurringBookingId: 'rb-1',
  status: 'pending_mandate',
  addressId: DRAFT.addressId,
  window: ELIGIBILITY.window,
  policyVersion: 'recurring-v2-spec-1',
  mandate: null,
  banner: null,
  counts: { done: 0, cancelled: 0, toGo: 6 },
  plans: [
    {
      planNumber: 1,
      days: ['2026-10-06', '2026-10-07', '2026-10-08'],
      visits: [
        {
          visitNumber: 1,
          timeOfDay: 'morning',
          durationMinutes: 60,
          startTime: '08:00',
          days: ['2026-10-06', '2026-10-07', '2026-10-08'],
          price: {
            basePricePaise: 30000,
            pricePaise: 12900,
            gstPaise: 645,
            totalPaise: 13545,
            pricingVersion: 'p',
          },
        },
      ],
      history: [],
    },
  ],
  days: [{ date: '2026-10-06', group: 'upcoming', visits: [VISIT] }],
  upNext: VISIT,
  chargeRange: { minPaise: 7245, maxPaise: 13545 },
  support: { whatsappUrl: null },
  createdAt: '2026-10-02T06:00:00.000Z',
  cancelledAt: null,
  cancelledBy: null,
};

const VISIT_DETAIL = {
  ...VISIT,
  recurringBookingId: 'rb-1',
  price: BOOKING.plans[0]!.visits[0]!.price,
  payment: null,
  cancellation: null,
  mandate: null,
  prep: null,
  support: { whatsappUrl: 'https://wa.me/919800000001?text=hi' },
};

describe('planning reads', () => {
  it('reads eligibility, with the chip, times of day and duration prices', async () => {
    const { calls, recurring } = recording(ELIGIBILITY);

    const eligibility = await recurring.eligibility();

    expect(calls[0]).toMatchObject({ path: '/v1/recurring/eligibility', method: 'GET' });
    expect(eligibility.chip).toBe('book');
    expect(eligibility.durations[0]?.basePricePaise).toBe(30000);
  });

  it('reads the calendar with no address', async () => {
    const { calls, recurring } = recording({
      window: ELIGIBILITY.window,
      days: [{ date: '2026-10-05', selectable: false }],
    });

    const calendar = await recurring.calendar();

    expect(calls[0]?.path).toBe('/v1/recurring/calendar');
    expect(calendar.days[0]).toEqual({ date: '2026-10-05', selectable: false });
  });

  it('posts the dates, the duration and the Plan’s other visits for start times', async () => {
    const { calls, recurring } = recording({
      durationMinutes: 60,
      timesOfDay: [{ timeOfDay: 'morning', available: true, startTimes: ['08:00'] }],
    });

    await recurring.startTimes({
      addressId: DRAFT.addressId,
      dates: ['2026-10-06', '2026-10-07'],
      durationMinutes: 60,
      sameDayVisits: [{ date: '2026-10-06', startTime: '09:00', durationMinutes: 60 }],
    });

    expect(calls[0]).toMatchObject({
      path: '/v1/recurring/start-times',
      method: 'POST',
      body: {
        addressId: DRAFT.addressId,
        dates: ['2026-10-06', '2026-10-07'],
        durationMinutes: 60,
        sameDayVisits: [{ date: '2026-10-06', startTime: '09:00', durationMinutes: 60 }],
      },
    });
  });

  it('leaves sameDayVisits out when there are none', async () => {
    const { calls, recurring } = recording({ durationMinutes: 60, timesOfDay: [] });

    await recurring.startTimes({
      addressId: DRAFT.addressId,
      dates: ['2026-10-06'],
      durationMinutes: 60,
    });

    expect(calls[0]?.body).not.toHaveProperty('sameDayVisits');
  });
});

describe('the draft body', () => {
  it('quotes without an idempotency key, since a quote holds nothing', async () => {
    const { calls, recurring } = recording({
      policyVersion: 'p',
      bookable: true,
      window: ELIGIBILITY.window,
      firstDate: '2026-10-06',
      lastDate: '2026-10-10',
      daysCount: 5,
      visitsCount: 6,
      overlaps: [],
      visits: [],
      visitSummaries: [
        {
          planNumber: 1,
          visitNumber: 1,
          timeOfDay: 'morning',
          durationMinutes: 60,
          startTime: '08:00',
          daysCount: 3,
          price: PRICE,
        },
      ],
      chargeRange: { minPaise: 7245, maxPaise: 13545 },
      totalPaise: 75000,
      mandateMaxChargePaise: 100000,
    });

    const quote = await recurring.quote(DRAFT);

    expect(calls[0]).toMatchObject({ path: '/v1/recurring/bookings/quote', method: 'POST' });
    expect(calls[0]?.headers['Idempotency-Key']).toBeUndefined();
    expect(quote.totalPaise).toBe(75000);
  });

  it('sends Plans with Visit 1 dateless and a later visit with its days', async () => {
    const { calls, recurring } = recording(BOOKING);

    await recurring.create(DRAFT, 'recurring.create:x');

    expect(calls[0]?.body).toEqual({
      addressId: DRAFT.addressId,
      plans: [
        {
          planNumber: 1,
          dates: ['2026-10-06', '2026-10-07', '2026-10-08'],
          visits: [
            { visitNumber: 1, timeOfDay: 'morning', durationMinutes: 60, startTime: '08:00' },
            {
              visitNumber: 2,
              timeOfDay: 'evening',
              durationMinutes: 30,
              startTime: '19:30',
              dates: ['2026-10-06'],
            },
          ],
        },
        {
          planNumber: 2,
          dates: ['2026-10-09', '2026-10-10'],
          visits: [
            { visitNumber: 1, timeOfDay: 'afternoon', durationMinutes: 60, startTime: '13:00' },
          ],
        },
      ],
    });
  });

  // `dates` on Visit 1 is a 400, not an ignored extra.
  it('drops dates from Visit 1 even if the caller supplied them', async () => {
    const { calls, recurring } = recording(BOOKING);
    const plan = DRAFT.plans[0]!;

    await recurring.create(
      { ...DRAFT, plans: [{ ...plan, visits: [{ ...plan.visits[0]!, dates: ['2026-10-06'] }] }] },
      'recurring.create:y',
    );

    const body = calls[0]?.body as { plans: { visits: Record<string, unknown>[] }[] };
    expect(body.plans[0]?.visits[0]).not.toHaveProperty('dates');
  });
});

describe('booking writes', () => {
  it('saves with an Idempotency-Key and reads back a pending_mandate booking', async () => {
    const { calls, recurring } = recording(BOOKING);

    const booking = await recurring.create(DRAFT, 'recurring.create:z');

    expect(calls[0]).toMatchObject({ path: '/v1/recurring/bookings', method: 'POST' });
    expect(calls[0]?.headers['Idempotency-Key']).toEqual(expect.any(String));
    expect(booking.status).toBe('pending_mandate');
    expect(booking.upNext?.cook).toBeNull();
  });

  it('cancels a visit and a booking on their own routes, with a reason, each idempotent', async () => {
    const visit = recording({
      ...VISIT_DETAIL,
      status: 'cancelled',
      displayState: 'cancelled',
      cancelledBy: 'customer',
      cancellation: {
        cancelledBy: 'customer',
        cancelledAt: '2026-10-03T06:00:00.000Z',
        window: 1,
        reasonCode: 'OTHER',
        feePercent: 0,
        feePaise: 0,
        refundPaise: 0,
        refundStatus: null,
        nothingCharged: true,
      },
    });
    await visit.recurring.cancelVisit(
      'rb-1',
      'visit-1',
      { reasonCode: 'OTHER', reasonDetail: 'Travelling' },
      'recurring.visit.cancel:visit-1',
    );
    const whole = recording({
      booking: { ...BOOKING, status: 'cancelled' },
      visitsCancelled: 6,
      totals: { feePaise: 0, refundPaise: 0 },
      whatsappUrl: null,
    });
    await whole.recurring.cancel('rb-1', { reasonCode: 'URGENT_CHANGE' }, 'recurring.cancel:rb-1');

    expect(visit.calls[0]).toMatchObject({
      path: '/v1/me/recurring-bookings/rb-1/visits/visit-1/cancel',
      body: { reasonCode: 'OTHER', reasonDetail: 'Travelling' },
    });
    expect(whole.calls[0]).toMatchObject({
      path: '/v1/me/recurring-bookings/rb-1/cancel',
      body: { reasonCode: 'URGENT_CHANGE' },
    });
    expect(visit.calls[0]?.headers['Idempotency-Key']).toBeDefined();
    expect(whole.calls[0]?.headers['Idempotency-Key']).toBeDefined();
  });

  it('reads a visit’s cancellation quote without sending any amount', async () => {
    const { calls, recurring } = recording({
      visitId: 'visit-1',
      cancellable: true,
      window: 3,
      feePercent: 25,
      feePaise: 3386,
      refundPaise: 10159,
      chargedPaise: 13545,
      nothingCharged: false,
    });

    const quote = await recurring.visitCancellationQuote('rb-1', 'visit-1');

    expect(calls[0]).toMatchObject({
      path: '/v1/me/recurring-bookings/rb-1/visits/visit-1/cancellation-quote',
      method: 'GET',
    });
    expect(quote.feePercent).toBe(25);
  });

  it('writes prep checks with PUT, sending only the checks given', async () => {
    const { calls, recurring } = recording({
      bookingId: 'b-1',
      entryApproved: true,
      groceriesReady: false,
      utensilsReady: false,
      updatedAt: '2026-10-06T00:00:00.000Z',
    });

    await recurring.updatePrep('b-1', { entryApproved: true });

    expect(calls[0]).toMatchObject({
      path: '/v1/bookings/b-1/prep',
      method: 'PUT',
      body: { entryApproved: true },
    });
  });
});

describe('autopay', () => {
  it('starts a UPI mandate with no body and parses the checkout', async () => {
    const { calls, recurring } = recording({
      mandateId: 'mandate-1',
      recurringBookingId: 'rb-1',
      method: 'upi',
      status: 'pending',
      provider: 'razorpay',
      providerOrderId: 'order_1',
      providerCustomerId: 'cust_1',
      amountPaise: 100,
      currency: 'INR',
      maxAmountPaise: 100000,
      approveBy: '2026-10-02T06:30:00.000Z',
      keyId: null,
    });

    const checkout = await recurring.startMandate('rb-1', 'recurring.mandate:rb-1');

    expect(calls[0]).toMatchObject({ path: '/v1/me/recurring-bookings/rb-1/mandate' });
    expect(calls[0]?.body).toBeUndefined();
    expect(checkout.keyId).toBeNull();
  });

  it('verifies with the three values Razorpay returns', async () => {
    const { calls, recurring } = recording({
      mandateId: 'mandate-1',
      recurringBookingId: 'rb-1',
      method: 'upi',
      status: 'initiated',
      bookingStatus: 'pending_mandate',
      handleMasked: null,
      confirmedAt: null,
    });

    const result = await recurring.verifyMandate('rb-1', {
      providerOrderId: 'order_1',
      providerPaymentId: 'pay_1',
      signature: 'sig',
    });

    expect(calls[0]?.body).toEqual({
      providerOrderId: 'order_1',
      providerPaymentId: 'pay_1',
      signature: 'sig',
    });
    expect(result.status).toBe('initiated');
  });
});

describe('the boundary refuses a malformed payload', () => {
  it('rejects a booking status the app does not know', async () => {
    const { recurring } = recording({ ...BOOKING, status: 'paused' });

    await expect(recurring.detail('rb-1')).rejects.toThrow();
  });

  it('rejects a wall-clock start time that is not HH:MM', async () => {
    const { recurring } = recording({
      durationMinutes: 60,
      timesOfDay: [{ timeOfDay: 'morning', available: true, startTimes: ['8:00'] }],
    });

    await expect(
      recurring.startTimes({
        addressId: DRAFT.addressId,
        dates: ['2026-10-06'],
        durationMinutes: 60,
      }),
    ).rejects.toThrow();
  });
});
