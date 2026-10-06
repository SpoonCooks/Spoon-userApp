import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createStubApi, createTestRuntime, renderWithRuntime } from '@/test/renderWithRuntime';

import { VisitChoices } from './components/VisitChoices';
import { durationIdFor, durationLabel, durationMinutes } from './data';
import { LOCAL_PLANNING, RecurringPlanningProvider, planningFrom } from './planning';
import type { RecurringEligibilityDto } from './api';

/**
 * The flow's planning inputs (DEC-086): what the backend says wins, field by field, and anything
 * it has not said yet falls back to the local rules the flow already ran on.
 */

const ELIGIBILITY: RecurringEligibilityDto = {
  policyVersion: 'recurring-v2-spec-1',
  unlocked: true,
  poolCount: 2,
  unlockThreshold: 2,
  chip: 'book',
  liveBookings: [],
  window: { startDate: '2026-10-05', endDate: '2026-10-25' },
  limits: { minDays: 4, maxDays: 10 },
  timesOfDay: [
    { timeOfDay: 'morning', firstStart: '05:00', lastStart: '11:45' },
    { timeOfDay: 'afternoon', firstStart: '12:00', lastStart: '16:45' },
    { timeOfDay: 'evening', firstStart: '17:00', lastStart: '23:45' },
  ],
  durations: [
    {
      durationMinutes: 30,
      basePricePaise: 15000,
      pricePaise: 6900,
      gstPaise: 345,
      totalPaise: 7245,
      pricingVersion: 'p',
    },
    {
      durationMinutes: 60,
      basePricePaise: 12900,
      pricePaise: 12900,
      gstPaise: 645,
      totalPaise: 13545,
      pricingVersion: 'p',
    },
  ],
  charging: { notifyLeadHours: 27, debitLeadHours: 3, mandateMaxChargePaise: 100000 },
};

describe('planningFrom', () => {
  it('is the local rules when nothing has answered', () => {
    expect(planningFrom({ addressId: null, eligibility: null, calendar: null })).toEqual(
      LOCAL_PLANNING,
    );
  });

  it('takes the window and limits from eligibility', () => {
    const planning = planningFrom({
      addressId: 'addr-1',
      eligibility: ELIGIBILITY,
      calendar: null,
    });

    expect(planning).toMatchObject({
      addressId: 'addr-1',
      windowStartId: '2026-10-05',
      minDays: 4,
      maxDays: 10,
    });
  });

  it('greys exactly the days a live Recurring booking already has', () => {
    const planning = planningFrom({
      addressId: 'addr-1',
      eligibility: null,
      calendar: {
        window: ELIGIBILITY.window,
        days: [
          { date: '2026-10-05', selectable: true },
          { date: '2026-10-06', selectable: false },
        ],
      },
    });

    expect([...planning.unavailableDayIds]).toEqual(['2026-10-06']);
    // The calendar's window stands in when eligibility has not answered.
    expect(planning.windowStartId).toBe('2026-10-05');
  });

  it('prices durations at the effective price, striking the base only when it is higher', () => {
    const planning = planningFrom({ addressId: null, eligibility: ELIGIBILITY, calendar: null });

    expect(
      planning.durations.map((option) => [
        option.id,
        option.label,
        option.price,
        option.strikePrice,
      ]),
    ).toEqual([
      ['d30', '30 mins', '₹69', '₹150'],
      ['d60', '1 hr', '₹129', undefined],
    ]);
  });
});

describe('duration ids', () => {
  it('name their minutes, so a new duration reads back everywhere', () => {
    expect(durationIdFor(180)).toBe('d180');
    expect(durationMinutes('d180')).toBe(180);
    expect(durationLabel('d90')).toBe('1.5 hr');
    expect(durationLabel('d45')).toBe('45 mins');
  });

  it('reads nothing from a missing or malformed id', () => {
    expect(durationMinutes(null)).toBe(0);
    expect(durationMinutes('dx')).toBe(0);
    expect(durationLabel(null)).toBe('');
  });
});

describe('VisitChoices start times', () => {
  const DAYS = ['2026-10-06', '2026-10-07'];

  function renderChoices(
    busy: { fromMinutes: number; toMinutes: number; dayIds?: string[] }[] = [],
  ) {
    const startTimesBodies: unknown[] = [];
    const runtime = createTestRuntime({
      api: createStubApi({
        'POST /v1/recurring/start-times': (body) => {
          startTimesBodies.push(body);
          return {
            durationMinutes: 60,
            timesOfDay: [
              { timeOfDay: 'morning', available: true, startTimes: ['08:00'] },
              { timeOfDay: 'afternoon', available: false, startTimes: [] },
              { timeOfDay: 'evening', available: true, startTimes: ['18:00'] },
            ],
          };
        },
      }),
    });
    renderWithRuntime(
      <RecurringPlanningProvider value={{ ...LOCAL_PLANNING, addressId: 'addr-1' }}>
        <VisitChoices busy={busy} dayIds={DAYS} timeLabel="Time of the day" onChange={jest.fn()} />
      </RecurringPlanningProvider>,
      { runtime },
    );
    return { startTimesBodies };
  }

  const disabled = (label: string) =>
    screen.getByRole('radio', { name: label }).props.accessibilityState?.disabled === true;

  it('asks for this visit’s days, the picked duration and the Plan’s other visits', async () => {
    const { startTimesBodies } = renderChoices([
      { fromMinutes: 9 * 60, toMinutes: 10 * 60, dayIds: ['2026-10-06'] },
    ]);

    fireEvent.press(screen.getByRole('radio', { name: 'Morning' }));
    fireEvent.press(screen.getByRole('radio', { name: /^1 hr/ }));

    await waitFor(() =>
      expect(startTimesBodies).toEqual([
        {
          addressId: 'addr-1',
          dates: DAYS,
          durationMinutes: 60,
          sameDayVisits: [{ date: '2026-10-06', startTime: '09:00', durationMinutes: 60 }],
        },
      ]),
    );
  });

  it('offers only starts the backend offers, and closes a time of day with none left', async () => {
    renderChoices();

    fireEvent.press(screen.getByRole('radio', { name: 'Morning' }));
    fireEvent.press(screen.getByRole('radio', { name: /^1 hr/ }));

    await waitFor(() => expect(disabled('8:30 AM')).toBe(true));
    expect(disabled('8:00 AM')).toBe(false);
    expect(disabled('Afternoon')).toBe(true);
    expect(disabled('Evening')).toBe(false);
  });
});
