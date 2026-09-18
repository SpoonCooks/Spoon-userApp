import type { CancellationPreviewDto } from '@features/booking';

import { DEMO_CANCELLATION } from '@/demo/fixtures/screens';

import { cancellationFrom, reasonsFrom } from './adapters';

/**
 * The refund table, composed.
 *
 * This is the screen's most consequential block — three figures a customer will hold the company
 * to — and it is built two different ways: from `base` before the preview lands, and from the
 * PREVIEW once it does. The two drifted apart unnoticed, because only the first had a test: with
 * a preview in hand (which is every real booking) the labels read "Amount paid / Cancellation fee
 * / Refund" and the refund line lost its `total` emphasis, so the frame's ruled, emphasised total
 * rendered as an ordinary third row. Both paths are asserted here now.
 */

const PREVIEW: CancellationPreviewDto = {
  bookingId: 'bk-1',
  cancellable: true,
  band: 'SCHEDULED_FULL_REFUND',
  refundPercent: 100,
  minutesToStart: 240,
  serviceAmountPaise: 12900,
  capturedAmountPaise: 13545,
  refundAmountPaise: 13545,
  chargeAmountPaise: 0,
  policyVersion: 'cancellation-policy-v0',
};

function compose(preview: CancellationPreviewDto | null) {
  return cancellationFrom({
    base: DEMO_CANCELLATION,
    catalogue: null,
    preview,
    reschedule: null,
  });
}

describe('cancellationFrom — the refund table', () => {
  it('labels the three rows the way the frame does, with a preview in hand', () => {
    expect(compose(PREVIEW).refundRows.map((row) => row.label)).toEqual([
      'Original Amount Paid',
      'Cancellation Processing Fee',
      'Refund Amount',
    ]);
  });

  it('keeps the refund line emphasised as the total, so it keeps its rule', () => {
    const rows = compose(PREVIEW).refundRows;

    expect(rows[2]?.emphasis).toBe('total');
    // The two above it are ordinary rows; only the last is the total.
    expect(rows[0]?.emphasis).toBeUndefined();
    expect(rows[1]?.emphasis).toBeUndefined();
  });

  it('uses the same labels whether or not the preview has arrived', () => {
    expect(compose(null).refundRows.map((row) => row.label)).toEqual(
      compose(PREVIEW).refundRows.map((row) => row.label),
    );
  });

  it('renders the SERVER’s figures, never a subtraction of its own', () => {
    // Deliberately not paid − fee. A client computing the refund could not produce this.
    const disagreeing = { ...PREVIEW, chargeAmountPaise: 3400, refundAmountPaise: 9500 };

    expect(compose(disagreeing).refundRows.map((row) => row.value)).toEqual([
      '₹135.45',
      '₹34',
      '₹95',
    ]);
  });
});

/**
 * `ABANDONED_CHECKOUT` is a normal published catalogue entry — nothing on the wire marks it as
 * machine-only — but the APP sends it when it gives back a hold nobody paid for. Rendered
 * verbatim it would sit in this sheet as a reason a customer could pick for cancelling a real
 * booking, and choosing it would record a cancellation the server attributes to the system.
 */
describe('reasonsFrom — what a human is actually offered', () => {
  const catalogueWith = (reasons: readonly { code: string; label: string }[]) =>
    ({
      cancellation: {
        reasons: reasons.map((reason) => ({ ...reason, requiresDetail: reason.code === 'OTHER' })),
      },
    }) as Parameters<typeof reasonsFrom>[0];

  it('drops the code the app sends for itself', () => {
    const offered = reasonsFrom(
      catalogueWith([
        { code: 'CHANGE_OF_PLANS', label: 'Change of plans' },
        { code: 'ABANDONED_CHECKOUT', label: 'Abandoned checkout' },
        { code: 'OTHER', label: 'Others' },
      ]),
    );

    expect(offered.map((reason) => reason.id)).toEqual(['CHANGE_OF_PLANS', 'OTHER']);
  });

  it('keeps every other published reason, and its detail requirement', () => {
    const offered = reasonsFrom(
      catalogueWith([
        { code: 'CHANGE_OF_PLANS', label: 'Change of plans' },
        { code: 'OTHER', label: 'Others' },
      ]),
    );

    expect(offered).toEqual([
      { id: 'CHANGE_OF_PLANS', label: 'Change of plans' },
      { id: 'OTHER', label: 'Others', requiresDetail: true },
    ]);
  });
});
