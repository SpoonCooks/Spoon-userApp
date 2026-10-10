import { refundTrackerFrom } from './adapters';
import { refundFixture } from './fixtures';

const IST = 'Asia/Kolkata';

describe('refundTrackerFrom', () => {
  it('reads a late customer cancel as the partial breakdown, in progress', () => {
    const view = refundTrackerFrom(refundFixture(), { timeZone: IST });
    expect(view.title).toBe('Booking refund');
    expect(view.date).toBe('Sat, 10 Oct · 1 hr');
    expect(view.cancelledBy).toBe('Cancelled by you');
    expect(view.breakdownKind).toBe('partial');
    expect(view.breakdown).toEqual([
      { label: 'Amount paid', amount: '₹72.45' },
      { label: 'Cancellation fee (25%)', amount: '– ₹18.11', deducted: true },
    ]);
    expect(view.total).toEqual({ label: 'Refund amount', amount: '₹54.34' });
    expect(view.statusLabel).toBe('Refund in progress');
    expect(view.steps.map((step) => [step.key, step.done, step.when])).toEqual([
      ['initiated', true, '8 Oct'],
      ['processed', false, undefined],
      ['completed', false, undefined],
    ]);
    expect(view.reference).toBeUndefined();
  });

  it('reads a free-window cancel as the full breakdown with no fee line', () => {
    const view = refundTrackerFrom(
      refundFixture({
        tracker: { breakdown: { paidPaise: 7245, feePercent: 0, feePaise: 0, refundPaise: 7245 } },
      }),
    );
    expect(view.breakdownKind).toBe('full');
    expect(view.breakdown).toHaveLength(1);
  });

  it('reads a Spoon cancel as the full refund, tagged Cancelled by Spoon', () => {
    const view = refundTrackerFrom(
      refundFixture({
        tracker: {
          cause: 'spoon_cancel',
          breakdown: { paidPaise: 7245, feePercent: 0, feePaise: 0, refundPaise: 7245 },
        },
      }),
    );
    expect(view.breakdownKind).toBe('spoon');
    expect(view.cancelledBy).toBe('Cancelled by Spoon');
    expect(view.total).toEqual({ label: 'Full refund', amount: '₹72.45' });
  });

  it('shows the bank reference only once the refund is completed', () => {
    const reference = { type: 'RRN', number: '664320396937' };
    expect(
      refundTrackerFrom(refundFixture({ tracker: { status: 'in_progress', reference } })).reference,
    ).toBeUndefined();
    expect(
      refundTrackerFrom(refundFixture({ tracker: { status: 'completed', reference } })).reference,
    ).toBe('RRN: 664320396937');
  });

  it('names a Recurring visit and raises support with the refund when there is no booking', () => {
    const view = refundTrackerFrom(
      refundFixture({
        bookingId: null,
        serviceStart: null,
        durationMinutes: null,
        tracker: {
          status: 'failed',
          recurring: {
            recurringBookingId: 'rb_1',
            visitId: 'rv_1',
            planNumber: 3,
            visitNumber: 4,
            planVisitCount: 12,
          },
        },
      }),
      { timeZone: IST },
    );
    expect(view.title).toBe('Recurring visit refund');
    expect(view.recurringLine).toBe('Plan 3 · Visit 4 of 12');
    expect(view.date).toBe('Raised 8 Oct');
    expect(view.statusLabel).toBe('Refund failed');
    expect(view.supportMessage).toContain('refund rf_1');
    expect(view.supportMessage).not.toContain('booking');
  });

  it('leaves the tag off when the cause is neither party', () => {
    expect(refundTrackerFrom(refundFixture({ tracker: { cause: 'other' } })).cancelledBy).toBe(
      undefined,
    );
  });
});
