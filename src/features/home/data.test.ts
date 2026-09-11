import { selectHomeBookings } from './data';

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

describe('selectHomeBookings', () => {
  it('orders ascending by scheduled start, regardless of status', () => {
    const selected = selectHomeBookings([
      booking({ id: 'completed', status: 'completed', scheduledStart: '2026-08-26T10:00:00.000Z' }),
      booking({
        id: 'travelling',
        status: 'cook_en_route',
        scheduledStart: '2026-08-26T14:00:00.000Z',
      }),
    ]);

    expect(selected.map((entry) => entry.id)).toEqual(['completed', 'travelling']);
  });

  it('uses id as a deterministic tie-breaker for equal (or absent) timestamps', () => {
    const selected = selectHomeBookings([
      booking({ id: 'z', status: 'assigned', scheduledStart: '2026-08-26T14:00:00.000Z' }),
      booking({ id: 'a', status: 'assigned', scheduledStart: '2026-08-26T12:00:00.000Z' }),
      booking({ id: 'b', status: 'assigned', scheduledStart: '2026-08-26T09:00:00.000Z' }),
    ]);

    expect(selected.map((entry) => entry.id)).toEqual(['b', 'a', 'z']);

    expect(
      selectHomeBookings([
        booking({ id: 'z', status: 'assigned' }),
        booking({ id: 'a', status: 'assigned' }),
      ]).map((entry) => entry.id),
    ).toEqual(['a', 'z']);
  });

  /**
   * The old single-pick version dropped every cancelled row unconditionally. This function no
   * longer does that — a booking the SYSTEM cancelled still needs to reach `homeBannerFor` to get
   * its apology card; distinguishing system from customer cancellation needs `cancelledBy`, which
   * only the per-booking DETAIL carries, not this summary. So a cancelled row passes through here
   * exactly like any other, ordered by its own `scheduledStart`.
   */
  it('does not drop cancelled bookings — that discrimination happens downstream, on detail', () => {
    const selected = selectHomeBookings([
      booking({ id: 'upcoming', status: 'assigned', scheduledStart: '2026-08-26T14:00:00.000Z' }),
      booking({ id: 'cancelled', status: 'cancelled', scheduledStart: '2026-08-26T09:00:00.000Z' }),
    ]);

    expect(selected.map((entry) => entry.id)).toEqual(['cancelled', 'upcoming']);
  });

  it('returns an empty array for an empty input, and does not mutate its argument', () => {
    expect(selectHomeBookings([])).toEqual([]);

    const input = [
      booking({ id: 'b', status: 'assigned' }),
      booking({ id: 'a', status: 'assigned' }),
    ];
    const original = [...input];
    selectHomeBookings(input);
    expect(input).toEqual(original);
  });
});
