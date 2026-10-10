import { cancelledSummary } from './cancelWholeBooking';
import type { BookingCancellationDto } from '@features/recurringSetup';

function result(visitsCancelled: number, feePaise: number, refundPaise: number) {
  return { visitsCancelled, totals: { feePaise, refundPaise } } as BookingCancellationDto;
}

describe('cancelledSummary', () => {
  it('says only how many visits were cancelled when nothing was charged', () => {
    expect(cancelledSummary(result(2, 0, 0))).toBe('2 visits cancelled.');
  });

  it('reads as the handoff does for a debited visit cancelled with a fee', () => {
    expect(cancelledSummary(result(1, 1811, 5434))).toBe(
      '1 visit cancelled with a fee, ₹54.34 refunded.',
    );
  });

  it('leaves the fee out of a free cancellation of a debited visit', () => {
    expect(cancelledSummary(result(3, 0, 7245))).toBe('3 visits cancelled, ₹72.45 refunded.');
  });
});
