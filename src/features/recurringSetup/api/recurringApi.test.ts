import type { ApiClient, RequestOptions } from '@core/api';

import { createRecurringApi } from './recurringApi';
import type { PlanDraftInput } from './recurringApi';

/**
 * The Recurring Plan wire contract — DEC-084, SpoonCooks/V0#101.
 *
 * Payloads are transcribed from the backend's own response builders (`plan-capacity.ts`,
 * `plan-service.ts`, `mandate-service.ts`), not a live instance: the routes were not deployed
 * when this was written. The body assertions matter more than usual, because every plan body is
 * `additionalProperties: false` and the draft rules (visit 1 on every day, `dates` forbidden on an
 * `all` visit) come back as a bare 400 with no reason.
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
  serviceAmountPaise: 10932,
  taxRateBps: 1800,
  taxAmountPaise: 1968,
  totalAmountPaise: 12900,
  pricingVersion: 'pricing-2026-09-01',
};

const ELIGIBILITY = {
  policyVersion: 'recurring-v1',
  unlocked: true,
  poolCount: 3,
  unlockThreshold: 3,
  window: { startDate: '2026-10-05', endDate: '2026-10-25' },
  limits: { minDays: 5, maxDays: 14, maxVisitsPerDay: 3 },
  charging: { chargeLeadHours: 24, reminderLeadHours: 48, mandateMaxChargePaise: 100000 },
  rescheduleGraceDays: 7,
};

const DRAFT: PlanDraftInput = {
  addressId: '11111111-1111-4111-8111-111111111111',
  dates: ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'],
  visits: [
    { visitNumber: 1, durationMinutes: 60, startTime: '08:00', daysScope: 'all' },
    {
      visitNumber: 2,
      durationMinutes: 30,
      startTime: '19:30',
      daysScope: 'some',
      dates: ['2026-10-06', '2026-10-08'],
    },
  ],
};

const QUOTE = {
  policyVersion: 'recurring-v1',
  bookable: true,
  window: ELIGIBILITY.window,
  firstDate: '2026-10-06',
  lastDate: '2026-10-10',
  daysCount: 5,
  visitsCount: 7,
  overlaps: [],
  visits: [
    {
      date: '2026-10-06',
      visitNumber: 1,
      startTime: '08:00',
      durationMinutes: 60,
      start: '2026-10-06T02:30:00.000Z',
      overridden: false,
      available: true,
      reason: 'AVAILABLE',
    },
  ],
  visitSummaries: [
    { visitNumber: 1, durationMinutes: 60, startTime: '08:00', daysCount: 5, price: PRICE },
  ],
  chargeRange: { minPaise: 6900, maxPaise: 12900 },
  totalPaise: 78300,
  mandateMaxChargePaise: 100000,
};

const PLAN = {
  planId: 'plan-1',
  status: 'pending_mandate',
  addressId: DRAFT.addressId,
  window: ELIGIBILITY.window,
  keepGoing: false,
  mealNotes: null,
  policyVersion: 'recurring-v1',
  templates: [
    {
      visitNumber: 1,
      durationMinutes: 60,
      startTime: '08:00',
      daysScope: 'all',
      price: {
        totalAmountPaise: 12900,
        serviceAmountPaise: 10932,
        taxAmountPaise: 1968,
        pricingVersion: 'pricing-2026-09-01',
      },
    },
  ],
  visits: [
    {
      visitId: 'visit-1',
      date: '2026-10-06',
      visitNumber: 1,
      start: '2026-10-06T02:30:00.000Z',
      durationMinutes: 60,
      pricePaise: 12900,
      status: 'reserved',
      bookingId: null,
      chargeDueAt: '2026-10-05T02:30:00.000Z',
      reminderDueAt: '2026-10-04T02:30:00.000Z',
    },
  ],
  autopay: null,
  createdAt: '2026-10-02T06:00:00.000Z',
  cancelledAt: null,
};

describe('planning reads', () => {
  it('reads eligibility with no parameters', async () => {
    const { calls, recurring } = recording(ELIGIBILITY);

    const eligibility = await recurring.eligibility();

    expect(calls[0]).toMatchObject({ path: '/v1/recurring/eligibility', method: 'GET' });
    expect(eligibility.limits).toEqual({ minDays: 5, maxDays: 14, maxVisitsPerDay: 3 });
  });

  it('asks the calendar about one address', async () => {
    const { calls, recurring } = recording({
      window: ELIGIBILITY.window,
      days: [{ date: '2026-10-05', available: false }],
    });

    const calendar = await recurring.calendar(DRAFT.addressId);

    expect(calls[0]?.path).toBe(`/v1/recurring/calendar?addressId=${DRAFT.addressId}`);
    expect(calendar.days[0]).toEqual({ date: '2026-10-05', available: false });
  });

  it('posts the picked days and one duration for start times', async () => {
    const { calls, recurring } = recording({
      durationMinutes: 60,
      startTimes: [{ startTime: '08:00', availableDates: ['2026-10-06'], coverage: 'partial' }],
    });

    await recurring.startTimes({
      addressId: DRAFT.addressId,
      dates: ['2026-10-06', '2026-10-07'],
      durationMinutes: 60,
    });

    expect(calls[0]).toMatchObject({
      path: '/v1/recurring/start-times',
      method: 'POST',
      body: {
        addressId: DRAFT.addressId,
        dates: ['2026-10-06', '2026-10-07'],
        durationMinutes: 60,
      },
    });
  });
});

describe('the draft body', () => {
  it('quotes without an idempotency key, since a quote holds nothing', async () => {
    const { calls, recurring } = recording(QUOTE);

    const quote = await recurring.quote(DRAFT);

    expect(calls[0]).toMatchObject({ path: '/v1/recurring/plans/quote', method: 'POST' });
    expect(calls[0]?.headers['Idempotency-Key']).toBeUndefined();
    expect(quote.totalPaise).toBe(78300);
  });

  it('sends visit 1 without dates and a "some" visit with its subset', async () => {
    const { calls, recurring } = recording(QUOTE);

    await recurring.quote(DRAFT);

    expect(calls[0]?.body).toEqual({
      addressId: DRAFT.addressId,
      dates: DRAFT.dates,
      visits: [
        { visitNumber: 1, durationMinutes: 60, startTime: '08:00', daysScope: 'all' },
        {
          visitNumber: 2,
          durationMinutes: 30,
          startTime: '19:30',
          daysScope: 'some',
          dates: ['2026-10-06', '2026-10-08'],
        },
      ],
    });
  });

  // `dates` on an `all` visit is a 400, not an ignored extra.
  it('drops dates from an "all" visit even if the caller supplied them', async () => {
    const { calls, recurring } = recording(QUOTE);

    await recurring.quote({
      ...DRAFT,
      visits: [{ ...DRAFT.visits[0]!, dates: ['2026-10-06'] }],
    });

    const body = calls[0]?.body as { visits: Record<string, unknown>[] };
    expect(body.visits[0]).not.toHaveProperty('dates');
  });

  it('leaves overrides out when there are none', async () => {
    const { calls, recurring } = recording(QUOTE);

    await recurring.quote({ ...DRAFT, overrides: [] });

    expect(calls[0]?.body).not.toHaveProperty('overrides');
  });
});

describe('plan writes', () => {
  it('saves with an Idempotency-Key and the optional fields only when given', async () => {
    const { calls, recurring } = recording(PLAN);

    const plan = await recurring.create({ ...DRAFT, mealNotes: 'Less oil' }, 'recurring.create:x');

    expect(calls[0]).toMatchObject({ path: '/v1/recurring/plans', method: 'POST' });
    expect(calls[0]?.headers['Idempotency-Key']).toEqual(expect.any(String));
    expect(calls[0]?.body).toMatchObject({ mealNotes: 'Less oil' });
    expect(calls[0]?.body).not.toHaveProperty('keepGoing');
    expect(plan.status).toBe('pending_mandate');
  });

  it('cancels a plan and a visit on their own routes, each idempotent', async () => {
    const { calls, recurring } = recording(PLAN);

    await recurring.cancel('plan-1', 'recurring.cancel:plan-1');
    await recurring.cancelVisit('plan-1', 'visit-1', 'recurring.visit.cancel:visit-1');

    expect(calls.map((call) => call.path)).toEqual([
      '/v1/me/recurring-plans/plan-1/cancel',
      '/v1/me/recurring-plans/plan-1/visits/visit-1/cancel',
    ]);
    expect(calls.every((call) => call.headers['Idempotency-Key'] !== undefined)).toBe(true);
    expect(calls.every((call) => call.body === undefined)).toBe(true);
  });

  it('reschedules a visit to a date and a start time', async () => {
    const { calls, recurring } = recording(PLAN);

    await recurring.rescheduleVisit(
      'plan-1',
      'visit-1',
      { date: '2026-10-12', startTime: '09:00' },
      'recurring.visit.reschedule:visit-1',
    );

    expect(calls[0]).toMatchObject({
      path: '/v1/me/recurring-plans/plan-1/visits/visit-1/reschedule',
      body: { date: '2026-10-12', startTime: '09:00' },
    });
  });

  it('sets keep-going without an idempotency key', async () => {
    const { calls, recurring } = recording({ ...PLAN, keepGoing: true });

    await recurring.setKeepGoing('plan-1', true);

    expect(calls[0]).toMatchObject({
      path: '/v1/me/recurring-plans/plan-1/keep-going',
      body: { keepGoing: true },
    });
    expect(calls[0]?.headers['Idempotency-Key']).toBeUndefined();
  });
});

describe('autopay', () => {
  it('starts a mandate for a method and parses the checkout', async () => {
    const { calls, recurring } = recording({
      mandateId: 'mandate-1',
      planId: 'plan-1',
      method: 'upi',
      status: 'pending',
      provider: 'razorpay',
      providerOrderId: 'order_1',
      providerCustomerId: 'cust_1',
      amountPaise: 100,
      currency: 'INR',
      maxAmountPaise: 100000,
      authoriseBy: '2026-10-02T06:30:00.000Z',
      keyId: null,
    });

    const checkout = await recurring.startMandate('plan-1', 'upi', 'recurring.mandate:plan-1');

    expect(calls[0]).toMatchObject({
      path: '/v1/me/recurring-plans/plan-1/mandate',
      body: { method: 'upi' },
    });
    expect(checkout.keyId).toBeNull();
  });

  it('verifies with the three values Razorpay returns', async () => {
    const { calls, recurring } = recording({
      mandateId: 'mandate-1',
      planId: 'plan-1',
      method: 'upi',
      status: 'initiated',
      planStatus: 'pending_mandate',
      confirmedAt: null,
    });

    const result = await recurring.verifyMandate('plan-1', {
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
  it('rejects a plan status the app does not know', async () => {
    const { recurring } = recording({ ...PLAN, status: 'paused' });

    await expect(recurring.detail('plan-1')).rejects.toThrow();
  });

  it('rejects a wall-clock start time that is not HH:MM', async () => {
    const { recurring } = recording({
      durationMinutes: 60,
      startTimes: [{ startTime: '8:00', availableDates: [], coverage: 'full' }],
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
