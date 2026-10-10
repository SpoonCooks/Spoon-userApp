import type { CustomerRefundDto, RefundTrackerDto } from './api';

/** A refund as `GET /v1/me/refunds/{id}` returns it, for tests and the dev preview. */
export function refundFixture(
  overrides: Partial<Omit<CustomerRefundDto, 'tracker'>> & {
    readonly tracker?: Partial<RefundTrackerDto>;
  } = {},
): CustomerRefundDto {
  const { tracker, ...rest } = overrides;
  return {
    refundId: 'rf_1',
    bookingId: 'bk_1',
    amountPaise: 5434,
    state: 'provider_pending',
    requestedAt: '2026-10-08T05:30:00.000Z',
    serviceStart: '2026-10-10T07:30:00.000Z',
    durationMinutes: 60,
    ...rest,
    tracker: {
      status: 'in_progress',
      cause: 'customer_cancel',
      method: 'upi',
      breakdown: { paidPaise: 7245, feePercent: 25, feePaise: 1811, refundPaise: 5434 },
      steps: [
        { key: 'initiated', at: '2026-10-08T05:30:00.000Z' },
        { key: 'processed', at: null },
        { key: 'completed', at: null },
      ],
      failedAt: null,
      reference: null,
      recurring: null,
      ...tracker,
    },
  };
}
