import { refundListResponseSchema, refundSchema, trackingSchema } from './schemas';

describe('tracking contract', () => {
  it('preserves backend movement, arrival and reassignment evidence', () => {
    const parsed = trackingSchema.parse({
      bookingId: 'booking-1',
      status: 'cook_en_route',
      eta: { estimatedArrivalAt: null, updatedAt: null },
      movement: {
        status: 'progress_observed',
        lastEvidenceAt: '2026-08-18T09:35:00.000Z',
        etaConfidence: 'usable',
      },
      arrivedAt: null,
      reassignment: { occurred: true, sequence: 1, reassignedAt: '2026-08-18T09:20:00.000Z' },
      timingVerdict: 'ON_TIME',
      destination: { gateName: null, societyName: null },
      serviceOtp: { start: null, end: null },
      refreshAfterSeconds: 30,
      message: 'cook_on_the_way',
    });

    expect(parsed.movement?.etaConfidence).toBe('usable');
    expect(parsed.reassignment?.occurred).toBe(true);
    expect(parsed.message).toBe('cook_on_the_way');
  });
});

/**
 * The customer refund projection.
 *
 * The backend sends `refundId` / `state` / `requestedAt`. This schema read `id` / `status` /
 * `createdAt` and made every field optional, so a perfectly valid refund parsed into an object of
 * `undefined`s: the Refunds screen drew a row with no identity, no status pill, and a React key
 * that fell back to the booking id. Nothing threw — which is exactly the failure mode a loose
 * boundary schema has to be examined for.
 */
describe('refund contract', () => {
  const RECORD = {
    refundId: '33333333-3333-4333-8333-333333333333',
    bookingId: '11111111-1111-4111-8111-111111111111',
    reason: 'scheduled_cancellation',
    amountPaise: 12900,
    currency: 'INR',
    state: 'succeeded',
    requestedAt: '2026-08-19T10:00:00.000Z',
    completedAt: '2026-08-19T10:04:11.000Z',
  };

  it('parses the backend field names, not the ones the app used to guess at', () => {
    const parsed = refundSchema.parse(RECORD);

    expect(parsed.refundId).toBe(RECORD.refundId);
    expect(parsed.state).toBe('succeeded');
    expect(parsed.amountPaise).toBe(12900);
    expect(parsed.requestedAt).toBe(RECORD.requestedAt);
  });

  it('keeps `completedAt` null while a refund is still in flight', () => {
    const parsed = refundSchema.parse({ ...RECORD, state: 'provider_pending', completedAt: null });

    expect(parsed.completedAt).toBeNull();
    expect(parsed.state).toBe('provider_pending');
  });

  /** The old shape must now FAIL rather than silently producing an empty row. */
  it('refuses a payload using the field names this schema previously expected', () => {
    expect(() =>
      refundSchema.parse({
        id: RECORD.refundId,
        bookingId: RECORD.bookingId,
        status: 'succeeded',
        amountPaise: 12900,
        createdAt: RECORD.requestedAt,
      }),
    ).toThrow();
  });

  it('parses the list envelope', () => {
    const parsed = refundListResponseSchema.parse({ refunds: [RECORD] });

    expect(parsed.refunds).toHaveLength(1);
    expect(parsed.refunds[0]?.refundId).toBe(RECORD.refundId);
  });

  /**
   * DEC-067's durable outcomes are carried through, not collapsed. `reconcile_required` means the
   * provider result is unknown; calling it "Processing" would tell a customer their money is on
   * the way when nobody knows that.
   */
  it('carries the non-terminal and terminal failure states through unchanged', () => {
    for (const state of [
      'requested',
      'failed_retryable',
      'failed_terminal',
      'reconcile_required',
    ]) {
      expect(refundSchema.parse({ ...RECORD, state }).state).toBe(state);
    }
  });
});
