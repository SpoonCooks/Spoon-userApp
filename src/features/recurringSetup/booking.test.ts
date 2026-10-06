import { draftFromPlans, unavailableVisitKeys } from './booking';
import type { RecurringQuoteDto } from './api';
import type { RecurringPlanDraft } from './types';

/** The flow's plans become exactly the draft `POST /v1/recurring/bookings` takes (DEC-086). */

const PLANS: RecurringPlanDraft[] = [
  {
    id: 'plan-a',
    dayIds: ['2026-10-08', '2026-10-06', '2026-10-07'],
    visits: [
      { timeOfDay: 'morning', durationId: 'd60', startMinutes: 8 * 60 + 30 },
      {
        timeOfDay: 'evening',
        durationId: 'd30',
        startMinutes: 19 * 60,
        dayIds: ['2026-10-07', '2026-10-06'],
      },
    ],
  },
  {
    id: 'plan-b',
    dayIds: ['2026-10-10', '2026-10-09'],
    visits: [{ timeOfDay: 'afternoon', durationId: 'd90', startMinutes: 13 * 60 }],
  },
];

describe('draftFromPlans', () => {
  it('numbers Plans and visits in order, with sorted dates and HH:MM starts', () => {
    expect(draftFromPlans('addr-1', PLANS)).toEqual({
      addressId: 'addr-1',
      plans: [
        {
          planNumber: 1,
          dates: ['2026-10-06', '2026-10-07', '2026-10-08'],
          visits: [
            { visitNumber: 1, timeOfDay: 'morning', durationMinutes: 60, startTime: '08:30' },
            {
              visitNumber: 2,
              timeOfDay: 'evening',
              durationMinutes: 30,
              startTime: '19:00',
              dates: ['2026-10-06', '2026-10-07'],
            },
          ],
        },
        {
          planNumber: 2,
          dates: ['2026-10-09', '2026-10-10'],
          visits: [
            { visitNumber: 1, timeOfDay: 'afternoon', durationMinutes: 90, startTime: '13:00' },
          ],
        },
      ],
    });
  });
});

describe('unavailableVisitKeys', () => {
  it('names the flow’s plan and day for each visit the quote says cannot run', () => {
    const quote = {
      visits: [
        { planNumber: 1, date: '2026-10-07', available: false },
        { planNumber: 2, date: '2026-10-09', available: true },
      ],
    } as unknown as RecurringQuoteDto;

    expect([...unavailableVisitKeys(PLANS, quote)]).toEqual(['plan-a#2026-10-07']);
  });
});
