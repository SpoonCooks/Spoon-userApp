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

/** Day + period + duration + slot — the four the screen calls `complete`. */
const COMPLETE_SELECTION = {
  dayId: 'day-1',
  periodId: 'morning',
  durationId: 'dur-60',
  slotId: 'am-0500AM',
} as const;

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

  it('shows no payment-details line, because reschedule takes no payment (B-4)', () => {
    render(<ScheduleView state={ready(DEMO_SCHEDULE_RESCHEDULE)} {...actions} />);

    expect(screen.queryByTestId('schedule-payment-details')).toBeNull();
  });

  it('surfaces a server-supplied block when the single reschedule is used up (R-3)', () => {
    render(<ScheduleView state={ready(DEMO_SCHEDULE_RESCHEDULE_BLOCKED)} {...actions} />);

    expect(screen.getByTestId('schedule-blocked')).toBeTruthy();
    expect(screen.getByTestId('schedule-submit').props.accessibilityState.disabled).toBe(true);
  });
});

describe('Schedule — finalized footer (275:4177)', () => {
  it('renders one CTA bar plus the payment-details line, and nothing else', () => {
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_BOOK)}
        {...actions}
        onOpenPaymentDetails={jest.fn()}
      />,
    );

    expect(screen.getByTestId('schedule-submit')).toBeTruthy();
    expect(screen.getByTestId('schedule-payment-details')).toBeTruthy();
    // `267:3521` draws neither the superseded inset `Pay →` pill nor a second bar.
    expect(screen.queryByTestId('schedule-pay')).toBeNull();
    expect(screen.queryByTestId('schedule-meal-brief')).toBeNull();
  });

  /**
   * Task §11 — no clickable dead controls. `275:4180` has no designed breakdown sheet for
   * Scheduled, so the route wires no handler and the line must not be drawn: a link that absorbs a
   * press and opens nothing reads as the app having failed.
   */
  it('omits the payment-details line when the host opens no breakdown', () => {
    renderBook();

    expect(screen.getByTestId('schedule-submit')).toBeTruthy();
    expect(screen.queryByTestId('schedule-payment-details')).toBeNull();
  });

  /** Task §7 / §18 — the CTA carries its own pending state; the grid behind it stays put. */
  it('shows the pending state on the CTA alone while a booking call is in flight', () => {
    render(<ScheduleView state={ready(DEMO_SCHEDULE_BOOK)} {...actions} submitting />);

    const submit = screen.getByTestId('schedule-submit');
    expect(submit.props.accessibilityState.busy).toBe(true);
    expect(submit.props.accessibilityState.disabled).toBe(true);
    // Nothing was swapped for a spinner: the day row the customer was choosing from is still here.
    expect(screen.getByTestId('schedule-screen')).toBeTruthy();
  });
});

/**
 * `275:4177` — the amount belongs to the QUOTE, and appears only with the priced state.
 *
 * `275:4488` / `275:4713` / `275:4938` all draw a bare, greyed-out "Book Now" while the selection
 * is incomplete. The superseded build read the amount off a fixture and showed the same "₹129" to
 * every customer for every selection, complete or not.
 */
describe('the CTA amount is the quote’s, or absent', () => {
  it('states no amount while the selection is incomplete', () => {
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_BOOK)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onSubmit={jest.fn()}
        primaryCtaAmountLabel="₹198"
      />,
    );

    const cta = screen.getByTestId('schedule-submit');
    expect(cta.props.accessibilityState.disabled).toBe(true);
    expect(cta.props.accessibilityLabel).toBe('Book Now');
  });

  it('states no amount when the route has no quote to give', () => {
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_BOOK)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onSubmit={jest.fn()}
        initialSelection={COMPLETE_SELECTION}
      />,
    );

    expect(screen.getByTestId('schedule-submit').props.accessibilityLabel).toBe('Book Now');
  });

  it('appends the quote amount once the selection is complete', () => {
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_BOOK)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onSubmit={jest.fn()}
        initialSelection={COMPLETE_SELECTION}
        primaryCtaAmountLabel="₹198"
      />,
    );

    const cta = screen.getByTestId('schedule-submit');
    expect(cta.props.accessibilityState.disabled).toBe(false);
    expect(cta.props.accessibilityLabel).toBe('Book Now • ₹198');
  });
});
/**
 * The founder's progressive rule for the Scheduled flow (task section A).
 *
 * `275:4488` (Day), `275:4713` (+ Time) and `275:4938` (+ Duration) all draw "Book Now" in
 * `275:4690`'s grey; only `34:3035`, the step with a start time chosen, draws it live. A tile
 * that has merely been TOUCHED does not enable it, and neither does a complete grid selection
 * with no server authority behind it.
 */
describe('Book Now is disabled until every required selection is made', () => {
  const disabled = () =>
    screen.getByTestId('schedule-submit').props.accessibilityState.disabled === true;

  it('is disabled with nothing selected at all (275:4488)', () => {
    renderBook();

    expect(disabled()).toBe(true);
  });

  it('is disabled with only a DAY selected (275:4488)', () => {
    renderBook();

    fireEvent.press(screen.getByTestId('schedule-days-day-1'));
    expect(disabled()).toBe(true);
  });

  it('is disabled with a day and a daypart but no duration (275:4713)', () => {
    renderBook();

    fireEvent.press(screen.getByTestId('schedule-days-day-1'));
    fireEvent.press(screen.getByTestId('schedule-periods-morning'));
    expect(disabled()).toBe(true);
  });

  it('is STILL disabled once a duration is chosen but no start time is (275:4938)', () => {
    renderBook();

    fireEvent.press(screen.getByTestId('schedule-days-day-1'));
    fireEvent.press(screen.getByTestId('schedule-periods-morning'));
    fireEvent.press(screen.getByTestId('schedule-duration-dur-60'));
    expect(disabled()).toBe(true);
  });

  it('presses through to nothing while it is disabled', () => {
    const onSubmit = jest.fn();
    render(<ScheduleView state={ready(DEMO_SCHEDULE_BOOK)} {...actions} onSubmit={onSubmit} />);

    fireEvent.press(screen.getByTestId('schedule-days-day-1'));
    fireEvent.press(screen.getByTestId('schedule-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  /**
   * A complete grid selection is not a bookable booking (task section A4/A5). The route answers
   * for the address, the availability read and the QUOTE; until it does, the bar stays grey.
   */
  it('is disabled on a complete selection the host has no server authority for', () => {
    const onSubmit = jest.fn();
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_BOOK)}
        {...actions}
        onSubmit={onSubmit}
        initialSelection={COMPLETE_SELECTION}
        canSubmit={false}
      />,
    );

    expect(disabled()).toBe(true);
    fireEvent.press(screen.getByTestId('schedule-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('enables on a complete selection the host CAN submit', () => {
    const onSubmit = jest.fn();
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_BOOK)}
        {...actions}
        onSubmit={onSubmit}
        initialSelection={COMPLETE_SELECTION}
        canSubmit
      />,
    );

    expect(disabled()).toBe(false);
    fireEvent.press(screen.getByTestId('schedule-submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  /** One tap, one booking (task section K) - this is the control that takes payment. */
  it('refuses a second press while the booking call is in flight', () => {
    const onSubmit = jest.fn();
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_BOOK)}
        {...actions}
        onSubmit={onSubmit}
        initialSelection={COMPLETE_SELECTION}
        canSubmit
        submitting
      />,
    );

    fireEvent.press(screen.getByTestId('schedule-submit'));
    fireEvent.press(screen.getByTestId('schedule-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  /** The server saying "no" outranks a full grid (ruling R-3 / task section A4). */
  it('stays disabled when the server has blocked the screen outright', () => {
    render(
      <ScheduleView
        state={ready(DEMO_SCHEDULE_RESCHEDULE_BLOCKED)}
        {...actions}
        initialSelection={{ dayId: 'day-1', periodId: 'morning', slotId: 'am-0500AM' }}
        canSubmit
      />,
    );

    expect(disabled()).toBe(true);
  });
});
