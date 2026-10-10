import { cancelledSummary } from './cancelWholeBooking';
import type { BookingCancellationDto } from '@features/recurringSetup';

function result(visitsCancelled: number, feePaise: number, refundPaise: number) {
  return { visitsCancelled, totals: { feePaise, refundPaise } } as BookingCancellationDto;
}

describe('cancelledSummary', () => {
  it('says only how many visits were cancelled when nothing was charged', () => {
    expect(cancelledSummary(result(2, 0, 0))).toBe('2 visits were cancelled.');
  });

  it('names the fee and what is coming back for a debited visit', () => {
    expect(cancelledSummary(result(1, 1811, 5434))).toBe(
      '1 visit was cancelled. After a ₹18.11 cancellation fee, ₹54.34 is on its way back to your original payment method.',
    );
  });

  it('names a full refund without a fee', () => {
    expect(cancelledSummary(result(3, 0, 7245))).toBe(
      '3 visits were cancelled. ₹72.45 is on its way back to your original payment method.',
    );
  });
});
