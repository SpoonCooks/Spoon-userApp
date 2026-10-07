import type { RecurringBookingDto, VisitSummaryDto } from '@features/recurringSetup';

import { plansSummaryFrom } from './plansSummary';

/** Today is Thu 8 Oct 2026; the booking runs 28 Sept → 18 Oct with two plans. */
const TODAY = '2026-10-08';
const PRICE = {
  basePricePaise: 33814,
  pricePaise: 25339,
  gstPaise: 4561,
  totalPaise: 29900,
  pricingVersion: 'v1',
};

function past(
  overrides: Partial<VisitSummaryDto> & Pick<VisitSummaryDto, 'date'>,
): VisitSummaryDto {
  return {
    visitId: `v-${overrides.date}-${overrides.visitNumber ?? 1}`,
    planNumber: 2,
    visitNumber: 1,
    timeOfDay: 'morning',
    startTime: '09:00',
    start: `${overrides.date}T03:30:00.000Z`,
    durationMinutes: 60,
    status: 'completed',
    displayState: 'completed',
    cookConfirmBy: `${overrides.date}T00:30:00.000Z`,
    cook: {
      cookId: 'c1',
      displayName: 'Cook Sanchita',
      profileImageUrl: null,
      rating: { average: 4.5, count: 3 },
    },
    bookingId: 'b-1',
    totalPaise: 29900,
    cancelledBy: null,
    ...overrides,
  } as VisitSummaryDto;
}

const BOOKING = {
  recurringBookingId: 'rb-1',
  status: 'active',
  addressId: 'a-1',
  window: { startDate: '2026-09-28', endDate: '2026-10-18' },
  policyVersion: 'v',
  mandate: null,
  banner: null,
  counts: { done: 2, cancelled: 1, toGo: 3 },
  plans: [
    {
      planNumber: 2,
      days: ['2026-10-02', '2026-10-07', '2026-10-17', '2026-10-18'],
      visits: [
        {
          visitNumber: 2,
          timeOfDay: 'evening',
          durationMinutes: 90,
          startTime: '19:00',
          days: [],
          price: PRICE,
        },
        {
          visitNumber: 1,
          timeOfDay: 'morning',
          durationMinutes: 60,
          startTime: '09:00',
          days: [],
          price: PRICE,
        },
      ],
      history: [
        past({ date: '2026-10-02' }),
        past({ date: TODAY }),
        past({
          date: '2026-10-02',
          visitNumber: 2,
          startTime: '19:00',
          start: '2026-10-02T13:30:00.000Z',
          status: 'cancelled',
          displayState: 'cancelled',
          cancelledBy: 'customer',
          cook: null,
        }),
      ],
    },
    { planNumber: 1, days: ['2026-09-28'], visits: [], history: [] },
  ],
  days: [],
  upNext: null,
  chargeRange: { minPaise: 0, maxPaise: 0 },
  support: { whatsappUrl: null },
  createdAt: '2026-09-20T00:00:00.000Z',
  cancelledAt: null,
  cancelledBy: null,
} as unknown as RecurringBookingDto;

describe('plansSummaryFrom', () => {
  const model = plansSummaryFrom(BOOKING, TODAY);
  const plan2 = model.plans.find((plan) => plan.id === 'plan-2')!;

  it('makes one tab per plan in order, opening on the first', () => {
    expect(model.plans.map((plan) => plan.label)).toEqual(['Plan 1', 'Plan 2']);
    expect(model.activePlanId).toBe('plan-1');
  });

  it('marks the plan’s dates on the booking’s calendar, first and last apart', () => {
    expect(plan2.calendar.title).toBe('Plan 2 selected dates');
    const cells = plan2.calendar.rows.flatMap((row) => row.cells).filter((cell) => cell !== null);
    const marked = cells
      .filter((cell) => cell!.mark !== undefined)
      .map((cell) => [cell!.day, cell!.mark]);
    expect(marked).toEqual([
      [2, 'start'],
      [7, 'selected'],
      [17, 'selected'],
      [18, 'end'],
    ]);
    expect(plan2.calendar.rows[0]!.month).toBe('Sept');
  });

  it('draws each visit’s time of day, length and start time', () => {
    expect(plan2.visits.map((visit) => visit.label)).toEqual(['1st Visit', '2nd Visit']);
    expect(plan2.visits[1]!.details.map((tile) => [tile.key, tile.caption])).toEqual([
      ['evening', 'Evening'],
      ['duration', '90 minutes'],
      ['startTime', '7:00 PM'],
    ]);
  });

  it('lists each visit’s own past visits, newest first', () => {
    const [first, second] = plan2.visits;
    expect(first!.historyCount).toBe('2 past visits');
    expect(first!.history.map((row) => [row.status, row.title, row.meta])).toEqual([
      ['done', 'Today, 8 Oct · 9:00 AM', 'Completed · Cook Sanchita'],
      ['done', 'Fri, 2 Oct · 9:00 AM', 'Completed · Cook Sanchita'],
    ]);
    expect(second!.historyCount).toBe('1 past visit');
    expect(second!.history[0]).toMatchObject({ status: 'cancelled', meta: 'Cancelled by you' });
  });
});
