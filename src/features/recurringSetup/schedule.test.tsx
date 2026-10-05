import { fireEvent, render, screen } from '@testing-library/react-native';

import { RecurringInfoProvider } from './components/HelpFab';
import { RecurringScheduleScreen } from './screens/RecurringScheduleScreen';
import { RecurringVisitDaysScreen } from './screens/RecurringVisitDaysScreen';
import type { RecurringVisitChoice } from './types';

/** The start times come from the backend; with no answer yet, every start in the band is offered. */
jest.mock('./api', () => ({
  useRecurringStartTimes: () => ({ state: { status: 'loading' } }),
}));

/**
 * Schedule (`229:1802` → `288:401` → `288:516`, `332:5921` → `332:5718`): the time of the day
 * first, the Duration carousel it opens ABOVE the pills, then the start times; and the visit's days
 * before it (`332:6093`, `332:5869`).
 */
const DAYS = ['2026-09-28', '2026-09-29', '2026-10-01', '2026-10-02'];

function renderSchedule(props: Partial<Parameters<typeof RecurringScheduleScreen>[0]> = {}) {
  const onSave = jest.fn();
  const onInfo = jest.fn();
  render(
    <RecurringInfoProvider onOpen={onInfo}>
      <RecurringScheduleScreen
        planNumber={1}
        visitNumber={1}
        dayIds={DAYS}
        ctaLabel="Save & Schedule Plan 2"
        onBack={jest.fn()}
        onSave={onSave}
        {...props}
      />
    </RecurringInfoProvider>,
  );
  return { onSave, onInfo };
}

const save = () => screen.getByTestId('recurring-schedule-screen-save');
const saveDisabled = () => save().props.accessibilityState?.disabled === true;
const radio = (name: string | RegExp) => screen.getByRole('radio', { name });
const disabled = (name: string) => radio(name).props.accessibilityState?.disabled === true;

describe('Schedule', () => {
  it('opens on the time of the day alone, with the CTA waiting', () => {
    renderSchedule();

    expect(screen.getByText('Time of the day')).toBeTruthy();
    expect(screen.queryByText('Duration')).toBeNull();
    expect(screen.queryByText('Start time')).toBeNull();
    expect(screen.getByText('Save & Schedule Plan 2')).toBeTruthy();
    expect(saveDisabled()).toBe(true);
  });

  it('opens the Duration carousel once a time is chosen, then the start times', () => {
    renderSchedule();

    fireEvent.press(radio('Morning'));
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.queryByText('Start time')).toBeNull();

    fireEvent.press(radio(/^1 hr/));
    expect(screen.getByText('Start time')).toBeTruthy();
    expect(saveDisabled()).toBe(true);
  });

  it('stacks the sections Duration, Time of the day, Start time', () => {
    renderSchedule({ initial: { durationId: 'd60', timeOfDay: 'morning' } });

    expect(
      screen
        .getAllByText(/^(Duration|Time of the day|Start time)$/)
        .map((node) => node.props.children),
    ).toEqual(['Duration', 'Time of the day', 'Start time']);
  });

  it('saves the chosen visit once a start time is picked', () => {
    const { onSave } = renderSchedule();

    fireEvent.press(radio('Morning'));
    fireEvent.press(radio(/^1 hr/));
    fireEvent.press(radio('9:00 AM'));

    expect(saveDisabled()).toBe(false);
    fireEvent.press(save());
    expect(onSave).toHaveBeenCalledWith({
      timeOfDay: 'morning',
      durationId: 'd60',
      startMinutes: 9 * 60,
    });
  });

  it('keeps the duration across a new time of the day, and clears the start time', () => {
    renderSchedule();

    fireEvent.press(radio('Morning'));
    fireEvent.press(radio(/^1 hr/));
    fireEvent.press(radio('9:00 AM'));
    fireEvent.press(radio('Afternoon'));

    expect(saveDisabled()).toBe(true);
    expect(screen.getByText('Start time')).toBeTruthy();
    expect(radio('12:00 PM').props.accessibilityState?.selected).toBe(false);
    expect(radio(/^1 hr/).props.accessibilityState?.selected).toBe(true);
  });

  it('keeps the start time when a longer duration still fits', () => {
    renderSchedule({ initial: { durationId: 'd60', timeOfDay: 'morning', startMinutes: 9 * 60 } });

    expect(saveDisabled()).toBe(false);
    fireEvent.press(radio(/^1.5 hrs/));

    expect(saveDisabled()).toBe(false);
  });

  it('opens at the step a part-made choice has reached', () => {
    renderSchedule({ initial: { timeOfDay: 'morning' } });

    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.queryByText('Start time')).toBeNull();
  });

  it('draws the help button, which opens the Recurring landing', () => {
    const { onInfo } = renderSchedule();

    fireEvent.press(screen.getByRole('button', { name: 'About Recurring' }));

    expect(onInfo).toHaveBeenCalledTimes(1);
  });

  describe('adding a further visit', () => {
    const FIRST: RecurringVisitChoice = {
      timeOfDay: 'morning',
      durationId: 'd60',
      startMinutes: 9 * 60,
    };
    const adding = {
      visitNumber: 2,
      dayIds: DAYS.slice(0, 3),
      ctaLabel: 'Add this visit',
      addingVisit: {
        planDayIds: DAYS,
        visitsBefore: [FIRST],
        otherVisits: [FIRST],
      },
    };

    it('titles the time section "Time" and heads the screen with the plan and its visits', () => {
      renderSchedule(adding);
      fireEvent.press(radio('Morning'));

      expect(screen.getByText('Time')).toBeTruthy();
      expect(screen.queryByText('Time of the day')).toBeNull();
      expect(screen.getByText('1st Visit')).toBeTruthy();
      expect(screen.getByText('1 hr · 9:00 AM')).toBeTruthy();
      expect(screen.getByText('2nd Visit')).toBeTruthy();
      expect(screen.getByText('Scheduling')).toBeTruthy();
      expect(screen.getByText('Add this visit')).toBeTruthy();
    });

    it('greys what the first visit takes: 9 AM for an hour leaves no 9:00 or 8:30 start', () => {
      renderSchedule(adding);
      fireEvent.press(radio('Morning'));
      fireEvent.press(radio(/^1 hr/));

      expect(disabled('8:30 AM')).toBe(true);
      expect(disabled('9:00 AM')).toBe(true);
      expect(disabled('9:30 AM')).toBe(true);
      expect(disabled('10:00 AM')).toBe(false);
      expect(disabled('8:00 AM')).toBe(false);
    });
  });
});

describe('Visit days', () => {
  function renderDays(initialDayIds?: readonly string[]) {
    const onContinue = jest.fn();
    const onInfo = jest.fn();
    render(
      <RecurringInfoProvider onOpen={onInfo}>
        <RecurringVisitDaysScreen
          planNumber={1}
          planDayIds={['2026-10-02', '2026-10-07', '2026-10-17', '2026-10-18']}
          bookedVisits={['1 hr · 9:00 AM']}
          initialDayIds={initialDayIds}
          onBack={jest.fn()}
          onContinue={onContinue}
        />
      </RecurringInfoProvider>,
    );
    return { onContinue, onInfo };
  }

  const cta = () => screen.getByTestId('recurring-visit-days-screen-continue');

  it('asks which of the plan’s days the next visit runs on, with Continue waiting', () => {
    renderDays();

    expect(screen.getByText('Plan 1: Selected days')).toBeTruthy();
    expect(screen.getByText('Select days on which 2nd visit is needed')).toBeTruthy();
    expect(screen.getByText('Scheduling')).toBeTruthy();
    expect(cta().props.accessibilityState?.disabled).toBe(true);
  });

  it('unlocks Continue once a day is picked, and hands over the picked days in order', () => {
    const { onContinue } = renderDays(['2026-10-17', '2026-10-02']);

    expect(cta().props.accessibilityState?.disabled).not.toBe(true);
    fireEvent.press(cta());

    expect(onContinue).toHaveBeenCalledWith(['2026-10-02', '2026-10-17']);
  });

  it('draws the help button', () => {
    const { onInfo } = renderDays();

    fireEvent.press(screen.getByRole('button', { name: 'About Recurring' }));

    expect(onInfo).toHaveBeenCalledTimes(1);
  });
});
