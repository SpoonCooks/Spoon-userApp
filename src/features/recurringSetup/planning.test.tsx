import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { catalogueSchema } from '@features/catalogue';
import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';

import { VisitChoices } from './components/VisitChoices';
import { durationIdFor, durationLabel, durationMinutes } from './data';
import { LOCAL_PLANNING, RecurringPlanningProvider, planningFrom } from './planning';
import type { RecurringEligibilityDto } from './api';

/**
 * The flow's planning inputs (DEC-084): what the backend says wins, field by field, and anything
 * it has not said yet falls back to the local rules the flow already ran on.
 */

const CATALOGUE = catalogueSchema.parse(DEFAULT_API_STUBS['GET /v1/catalogue']!(undefined));

const ELIGIBILITY: RecurringEligibilityDto = {
  policyVersion: 'recurring-v1',
  unlocked: true,
  poolCount: 3,
  unlockThreshold: 3,
  window: { startDate: '2026-10-05', endDate: '2026-10-25' },
  limits: { minDays: 4, maxDays: 10, maxVisitsPerDay: 3 },
  charging: { chargeLeadHours: 24, reminderLeadHours: 48, mandateMaxChargePaise: 100000 },
  rescheduleGraceDays: 7,
};

describe('planningFrom', () => {
  it('is the local rules when nothing has answered', () => {
    expect(
      planningFrom({ addressId: null, eligibility: null, calendar: null, catalogue: null }),
    ).toEqual(LOCAL_PLANNING);
  });

  it('takes the window and limits from eligibility', () => {
    const planning = planningFrom({
      addressId: 'addr-1',
      eligibility: ELIGIBILITY,
      calendar: null,
      catalogue: null,
    });

    expect(planning).toMatchObject({
      addressId: 'addr-1',
      windowStartId: '2026-10-05',
      minDays: 4,
      maxDays: 10,
    });
  });

  it('greys exactly the days the calendar says no pool Cook can take', () => {
    const planning = planningFrom({
      addressId: 'addr-1',
      eligibility: null,
      calendar: {
        window: ELIGIBILITY.window,
        days: [
          { date: '2026-10-05', available: true },
          { date: '2026-10-06', available: false },
        ],
      },
      catalogue: null,
    });

    expect([...planning.unavailableDayIds]).toEqual(['2026-10-06']);
    // The calendar's window stands in when eligibility has not answered.
    expect(planning.windowStartId).toBe('2026-10-05');
  });

  it('offers the catalogue durations, priced like Instant', () => {
    const planning = planningFrom({
      addressId: null,
      eligibility: null,
      calendar: null,
      catalogue: CATALOGUE,
    });

    expect(planning.durations.map((option) => [option.id, option.label, option.price])).toEqual([
      ['d30', '30 mins', '₹69'],
      ['d60', '1 hr', '₹129'],
    ]);
  });
});

describe('duration ids', () => {
  it('name their minutes, so a new catalogue duration reads back everywhere', () => {
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

  function renderChoices() {
    const startTimesBodies: unknown[] = [];
    const runtime = createTestRuntime({
      api: createStubApi({
        'POST /v1/recurring/start-times': (body) => {
          startTimesBodies.push(body);
          return {
            durationMinutes: 60,
            startTimes: [
              { startTime: '08:00', availableDates: DAYS, coverage: 'all' },
              { startTime: '08:30', availableDates: ['2026-10-06'], coverage: 'partial' },
            ],
          };
        },
      }),
    });
    renderWithRuntime(
      <RecurringPlanningProvider
        value={{ ...LOCAL_PLANNING, addressId: 'addr-1', durations: LOCAL_PLANNING.durations }}
      >
        <VisitChoices busy={[]} dayIds={DAYS} timeLabel="Time of the day" onChange={jest.fn()} />
      </RecurringPlanningProvider>,
      { runtime },
    );
    return { startTimesBodies };
  }

  const disabled = (label: string) =>
    screen.getByRole('radio', { name: label }).props.accessibilityState?.disabled === true;

  it('asks for this visit’s days and the picked duration', async () => {
    const { startTimesBodies } = renderChoices();

    // The time of the day first (`229:1802`), then the Duration it opens (`288:401`).
    fireEvent.press(screen.getByRole('radio', { name: 'Morning' }));
    fireEvent.press(screen.getByRole('radio', { name: /^1 hr/ }));

    await waitFor(() =>
      expect(startTimesBodies).toEqual([{ addressId: 'addr-1', dates: DAYS, durationMinutes: 60 }]),
    );
  });

  it('offers only starts a pool Cook can take on every day', async () => {
    renderChoices();

    // The time of the day first (`229:1802`), then the Duration it opens (`288:401`).
    fireEvent.press(screen.getByRole('radio', { name: 'Morning' }));
    fireEvent.press(screen.getByRole('radio', { name: /^1 hr/ }));

    await waitFor(() => expect(disabled('8:30 AM')).toBe(true));
    expect(disabled('8:00 AM')).toBe(false);
    // Not offered by the backend at all — outside its grid — so greyed too.
    expect(disabled('9:00 AM')).toBe(true);
  });
});
