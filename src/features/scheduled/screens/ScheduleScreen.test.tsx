import { fireEvent, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';

import {
  DEMO_SCHEDULE_BOOK,
  DEMO_SCHEDULE_RESCHEDULE,
  DEMO_SCHEDULE_RESCHEDULE_BLOCKED,
} from '@/demo/fixtures/booking';
import { ScheduleView } from './ScheduleScreen';

const actions = {
  onBack: jest.fn(),
  onSubmit: jest.fn(),
  onOpenMealBrief: jest.fn(),
  onPay: jest.fn(),
};

function renderBook() {
  return render(<ScheduleView state={ready(DEMO_SCHEDULE_BOOK)} {...actions} />);
}

describe('Schedule — progressive disclosure (C-1)', () => {
  it('starts with Day only', () => {
    renderBook();

    expect(screen.getByTestId('schedule-days')).toBeTruthy();
    expect(screen.queryByTestId('schedule-periods')).toBeNull();
    expect(screen.queryByTestId('schedule-slots')).toBeNull();
  });

  it('reveals Day → Time → Duration → Start time as selections are made', () => {
    renderBook();

    fireEvent.press(screen.getByTestId('schedule-days-day-3'));
    expect(screen.getByTestId('schedule-periods')).toBeTruthy();
    expect(screen.queryByTestId('schedule-duration-dur-60')).toBeNull();

    fireEvent.press(screen.getByTestId('schedule-periods-morning'));
    expect(screen.getByTestId('schedule-duration-dur-60')).toBeTruthy();
    expect(screen.queryByTestId('schedule-slots')).toBeNull();

    fireEvent.press(screen.getByTestId('schedule-duration-dur-60'));
    expect(screen.getByTestId('schedule-slots')).toBeTruthy();
  });

  it('resets downstream selections when an upstream one changes', () => {
    renderBook();

    fireEvent.press(screen.getByTestId('schedule-days-day-3'));
    fireEvent.press(screen.getByTestId('schedule-periods-morning'));
    fireEvent.press(screen.getByTestId('schedule-duration-dur-60'));
    fireEvent.press(screen.getByTestId('schedule-days-day-2'));

    expect(screen.queryByTestId('schedule-periods')).toBeTruthy();
    expect(screen.queryByTestId('schedule-slots')).toBeNull();
  });
});

describe('Schedule — server data, not client rules', () => {
  it('renders exactly the days the payload provides — no booking horizon is encoded (B-8)', () => {
    const manyDays = {
      ...DEMO_SCHEDULE_BOOK,
      days: Array.from({ length: 9 }, (_unused, index) => ({
        id: `day-${index}`,
        caption: 'Day',
        label: `Aug ${index + 1}`,
      })),
    };

    render(<ScheduleView state={ready(manyDays)} {...actions} />);

    expect(screen.getByTestId('schedule-days-day-8')).toBeTruthy();
  });

  it('renders disabled slots as the server marks them and refuses selection', () => {
    renderBook();

    fireEvent.press(screen.getByTestId('schedule-days-day-1'));
    fireEvent.press(screen.getByTestId('schedule-periods-morning'));
    fireEvent.press(screen.getByTestId('schedule-duration-dur-60'));

    const soldOut = screen.getByTestId('schedule-slots-am-0500AM');
    expect(soldOut.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(soldOut);
    expect(screen.getByTestId('schedule-submit').props.accessibilityState.disabled).toBe(true);
  });

  it('keeps the CTA disabled until the selection is complete', () => {
    renderBook();
    expect(screen.getByTestId('schedule-submit').props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('schedule-days-day-1'));
    fireEvent.press(screen.getByTestId('schedule-periods-morning'));
    fireEvent.press(screen.getByTestId('schedule-duration-dur-60'));
    fireEvent.press(screen.getByTestId('schedule-slots-am-0530AM'));

    expect(screen.getByTestId('schedule-submit').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByTestId('schedule-submit'));
    expect(actions.onSubmit).toHaveBeenCalled();
  });
});

describe('Reschedule mode (C-2 / C-3)', () => {
  it('has no Duration section and goes Day → Time → Start time', () => {
    render(<ScheduleView state={ready(DEMO_SCHEDULE_RESCHEDULE)} {...actions} />);

    expect(screen.getAllByText('Reschedule').length).toBeGreaterThan(0);

    fireEvent.press(screen.getByTestId('schedule-days-day-1'));
    fireEvent.press(screen.getByTestId('schedule-periods-morning'));

    expect(screen.queryByTestId('schedule-duration-dur-60')).toBeNull();
    expect(screen.getByTestId('schedule-slots')).toBeTruthy();
  });

  it('shows no Pay control, because reschedule pricing is unresolved (B-4)', () => {
    render(<ScheduleView state={ready(DEMO_SCHEDULE_RESCHEDULE)} {...actions} />);

    expect(screen.queryByTestId('schedule-pay')).toBeNull();
  });

  it('surfaces a server-supplied block when the single reschedule is used up (R-3)', () => {
    render(<ScheduleView state={ready(DEMO_SCHEDULE_RESCHEDULE_BLOCKED)} {...actions} />);

    expect(screen.getByTestId('schedule-blocked')).toBeTruthy();
    expect(screen.getByTestId('schedule-submit').props.accessibilityState.disabled).toBe(true);
  });
});

describe('Schedule — book mode pay control', () => {
  it('renders the inset Pay control from the payload', () => {
    renderBook();

    expect(screen.getByTestId('schedule-pay')).toBeTruthy();
  });
});
