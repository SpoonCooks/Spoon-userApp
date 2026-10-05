import { fireEvent, render, screen } from '@testing-library/react-native';

import { buildRecurringWindow } from '../data';
import { SummaryCalendar, summaryWindow } from './SummaryCalendar';

/**
 * The Summary's month calendar (`1079:3220`). The window is pinned to the frames' date, so it runs
 * Sep 28 – Oct 18: rows of Sep 28–30 / Oct 1–4 / 5–11 / 12–18.
 */
const TODAY = new Date(2026, 8, 25);
const RANGE = buildRecurringWindow(TODAY);
const PLAN = ['2026-10-02', '2026-10-07', '2026-10-17', '2026-10-18'];

function renderCalendar(props: Partial<Parameters<typeof SummaryCalendar>[0]> = {}) {
  render(
    <SummaryCalendar
      range={RANGE}
      selectedIds={PLAN}
      title="Plan 2 selected dates"
      testID="cal"
      {...props}
    />,
  );
}

describe('SummaryCalendar', () => {
  it('draws the weekday row, every window date and the month beside each row', () => {
    renderCalendar();
    expect(screen.getByText('Plan 2 selected dates')).toBeTruthy();
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label) =>
      expect(screen.getByText(label)).toBeTruthy(),
    );
    expect(screen.getByText('Sept')).toBeTruthy();
    expect(screen.getAllByText('Oct')).toHaveLength(3);
    // 21 dates: 28, 29, 30, 1 … 18.
    expect(screen.getAllByText(/^\d{1,2}$/)).toHaveLength(21);
  });

  it("marks only the visit's dates as selected", () => {
    renderCalendar();
    const selected = screen
      .getAllByLabelText(/^[A-Z][a-z]+day, /)
      .filter((node) => node.props.accessibilityState?.selected === true);
    expect(selected).toHaveLength(4);
    expect(screen.getByLabelText('Wednesday, October 7')).toBeTruthy();
  });

  it('has no pencil, and no buttons, unless asked', () => {
    renderCalendar();
    expect(screen.queryByTestId('cal-edit')).toBeNull();
    expect(screen.queryByTestId('cal-2026-10-07')).toBeNull();
  });

  it('turns the selected dates into buttons in edit mode, and no others', () => {
    const onPickDay = jest.fn();
    const onEdit = jest.fn();
    renderCalendar({ onEdit, onPickDay });
    expect(screen.getByLabelText('Stop editing dates')).toBeTruthy();
    expect(screen.queryByTestId('cal-2026-10-08')).toBeNull();
    fireEvent.press(screen.getByTestId('cal-2026-10-07'));
    expect(onPickDay).toHaveBeenCalledWith('2026-10-07');
    fireEvent.press(screen.getByTestId('cal-edit'));
    expect(onEdit).toHaveBeenCalled();
  });
});

describe('summaryWindow', () => {
  it("opens on today + 3 without a server answer, and on the server's start when it has one", () => {
    expect(summaryWindow(PLAN, null, TODAY).orderedIds[0]).toBe('2026-09-28');
    expect(summaryWindow(PLAN, '2026-09-29', TODAY).orderedIds[0]).toBe('2026-09-29');
  });

  it('opens on the earliest plan date when the plan has fallen out of the window', () => {
    const range = summaryWindow(['2026-09-01', '2026-09-03'], null, TODAY);
    expect(range.orderedIds[0]).toBe('2026-09-01');
    expect(range.orderedIds).toContain('2026-09-03');
  });
});
