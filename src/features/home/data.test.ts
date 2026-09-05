import { selectHomeBooking } from './data';

import type { BookingSummaryDto } from '@features/booking';

const booking = (input: Partial<BookingSummaryDto> & Pick<BookingSummaryDto, 'id' | 'status'>) =>
  ({
    id: input.id,
    status: input.status,
    slotType: 'scheduled',
    scheduledStart: input.scheduledStart ?? '2026-08-26T12:00:00.000Z',
    durationMinutes: input.durationMinutes ?? 60,
    price: input.price ?? {
      amountPaise: 12900,
      durationMinutes: 60,
      serviceAmountPaise: 12900,
      taxRateBps: 0,
      taxAmountPaise: 0,
      totalAmountPaise: 12900,
      currency: 'INR',
      pricingVersion: 'pricing-v1',
    },
  }) as BookingSummaryDto;

describe('selectHomeBooking', () => {
  it('prefers the actionable live booking over an earlier completed item', () => {
    const selected = selectHomeBooking([
      booking({ id: 'completed', status: 'completed', scheduledStart: '2026-08-26T10:00:00.000Z' }),
      booking({
        id: 'travelling',
        status: 'cook_en_route',
        scheduledStart: '2026-08-26T14:00:00.000Z',
      }),
    ]);

    expect(selected?.id).toBe('travelling');
  });

  it('uses the nearest start and id as deterministic tie-breakers', () => {
    const selected = selectHomeBooking([
      booking({ id: 'z', status: 'assigned', scheduledStart: '2026-08-26T14:00:00.000Z' }),
      booking({ id: 'a', status: 'assigned', scheduledStart: '2026-08-26T12:00:00.000Z' }),
      booking({ id: 'b', status: 'cancelled', scheduledStart: '2026-08-26T09:00:00.000Z' }),
    ]);

    expect(selected?.id).toBe('a');
    expect(
      selectHomeBooking([
        booking({ id: 'z', status: 'assigned' }),
        booking({ id: 'a', status: 'assigned' }),
      ])?.id,
    ).toBe('a');
  });

  /**
   * A cancellation is SELECTABLE, and always loses to real work.
   *
   * It used to be filtered out entirely, which disabled `393:1072` — the apology card leading to
   * page 8c — even though the banner state machine had implemented it all along. A booking Spoon
   * cancelled reached the customer only as a refund line in history.
   *
   * Which cancellations qualify is the server's call (its own, money actually taken, still
   * recent); this only has to stop discarding them and keep them behind anything live.
   */
  it('surfaces a cancellation when there is nothing else to show', () => {
    expect(selectHomeBooking([booking({ id: 'gone', status: 'cancelled' })])?.id).toBe('gone');
  });

  it('never lets a cancellation displace a live booking', () => {
    for (const live of ['cook_en_route', 'cooking', 'assigned', 'created', 'completed'] as const) {
      const selected = selectHomeBooking([
        // Listed first, and with the nearer start, so only the RANK can be keeping it back.
        booking({ id: 'gone', status: 'cancelled', scheduledStart: '2026-08-26T08:00:00.000Z' }),
        booking({ id: 'live', status: live, scheduledStart: '2026-08-26T20:00:00.000Z' }),
      ]);
      expect(selected?.id).toBe('live');
    }
  });
});
