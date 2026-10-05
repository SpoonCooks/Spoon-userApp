import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { RecurringPlanDraft } from '../types';
import { RecurringSummaryScreen } from './RecurringSummaryScreen';

/** The screen hands Android's back button to the stack, which needs a navigator; none is mounted. */
jest.mock('expo-router', () => ({
  __esModule: true,
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
}));

/**
 * The Summary — `1079:3207` (view), `494:1039` (edit), `568:2909` (undo banner), `542:1442` (the
 * bin's sheet). The window is pinned to the frames' date: Sep 28 – Oct 18.
 */
const TODAY = new Date(2026, 8, 25);
const PLAN_1_DAYS = ['2026-09-28', '2026-09-30', '2026-10-05'];
const PLAN_2_DAYS = ['2026-10-02', '2026-10-07', '2026-10-17', '2026-10-18'];

const PLANS: readonly RecurringPlanDraft[] = [
  {
    id: 'plan-1',
    dayIds: PLAN_1_DAYS,
    visits: [{ timeOfDay: 'morning', durationId: 'd90', startMinutes: 9 * 60 }],
  },
  {
    id: 'plan-2',
    dayIds: PLAN_2_DAYS,
    visits: [
      { timeOfDay: 'afternoon', durationId: 'd60', startMinutes: 9 * 60 },
      {
        timeOfDay: 'evening',
        durationId: 'd45',
        startMinutes: 18 * 60,
        dayIds: ['2026-10-07', '2026-10-17'],
      },
    ],
  },
];

function renderSummary(props: Partial<Parameters<typeof RecurringSummaryScreen>[0]> = {}) {
  const handlers = {
    onSelect: jest.fn(),
    onAddPlan: jest.fn(),
    onAddVisit: jest.fn(),
    onEditDate: jest.fn(),
    onDeleteVisit: jest.fn(),
    onDeletePlan: jest.fn(),
    onStartOver: jest.fn(),
    onBook: jest.fn(),
    onBack: jest.fn(),
  };
  const screenProps = {
    plans: PLANS,
    planIndex: 1,
    visitIndex: 0,
    today: TODAY,
    ...handlers,
    ...props,
  };
  const view = render(<RecurringSummaryScreen {...screenProps} />);
  return {
    ...handlers,
    /** The flow re-renders the Summary with another tab or visit when one is chosen. */
    show: (planIndex: number, visitIndex: number) =>
      view.rerender(
        <RecurringSummaryScreen {...screenProps} planIndex={planIndex} visitIndex={visitIndex} />,
      ),
  };
}

const PENCIL = 'recurring-summary-screen-days-edit';
const date = (id: string) => `recurring-summary-screen-days-${id}`;

describe('RecurringSummaryScreen — view', () => {
  it("shows the plan's dates as a calendar, with the captions above the three tiles", () => {
    renderSummary();
    expect(screen.getByText('Summary')).toBeTruthy();
    expect(screen.getByText('Plan 2 selected dates')).toBeTruthy();
    expect(screen.getByText('Sept')).toBeTruthy();
    expect(screen.getByText('Afternoon')).toBeTruthy();
    expect(screen.getByText('60 minutes')).toBeTruthy();
    expect(screen.getByText('9:00 AM')).toBeTruthy();
    expect(screen.getByText('Book Now')).toBeTruthy();
    // The view header has the bin and no back chevron.
    expect(screen.getByTestId('recurring-summary-screen-delete')).toBeTruthy();
    expect(screen.queryByTestId('recurring-summary-screen-header-back')).toBeNull();
  });

  it("highlights only the visit shown: the 2nd visit runs on two of the plan's four dates", () => {
    renderSummary({ visitIndex: 1 });
    const selected = screen
      .getAllByLabelText(/^[A-Z][a-z]+day, /)
      .filter((node) => node.props.accessibilityState?.selected === true);
    expect(selected).toHaveLength(2);
    expect(screen.getByText('Evening')).toBeTruthy();
    expect(screen.getByText('45 minutes')).toBeTruthy();
  });

  it('books, and adds a plan and a visit', () => {
    const handlers = renderSummary();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-book'));
    expect(handlers.onBook).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-switcher-add-plan'));
    expect(handlers.onAddPlan).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-switcher-add-visit'));
    expect(handlers.onAddVisit).toHaveBeenCalledWith(1);
  });
});

describe('RecurringSummaryScreen — edit mode (494:1039)', () => {
  it('trades the bin and Book Now for a back chevron, and makes the dates buttons', () => {
    renderSummary();
    expect(screen.queryByTestId(date('2026-10-07'))).toBeNull();
    fireEvent.press(screen.getByTestId(PENCIL));
    expect(screen.getByTestId('recurring-summary-screen-header-back')).toBeTruthy();
    expect(screen.queryByTestId('recurring-summary-screen-delete')).toBeNull();
    expect(screen.queryByTestId('recurring-summary-screen-book')).toBeNull();
    expect(screen.getByTestId(date('2026-10-07'))).toBeTruthy();
    // Only the plan's own dates are buttons.
    expect(screen.queryByTestId(date('2026-10-08'))).toBeNull();
    expect(screen.getByText('Plan 2 selected dates')).toBeTruthy();
  });

  it('opens Edit date for the one date tapped, and leaves edit mode', () => {
    const handlers = renderSummary();
    fireEvent.press(screen.getByTestId(PENCIL));
    fireEvent.press(screen.getByTestId(date('2026-10-07')));
    expect(handlers.onEditDate).toHaveBeenCalledWith(1, 0, '2026-10-07');
    expect(screen.queryByTestId(date('2026-10-17'))).toBeNull();
    expect(screen.getByTestId('recurring-summary-screen-book')).toBeTruthy();
  });

  it('leaves edit mode from the chevron, from the pencil again, or by changing plan', () => {
    const handlers = renderSummary();
    fireEvent.press(screen.getByTestId(PENCIL));
    fireEvent.press(screen.getByTestId('recurring-summary-screen-header-back'));
    expect(screen.getByTestId('recurring-summary-screen-book')).toBeTruthy();
    expect(handlers.onBack).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId(PENCIL));
    fireEvent.press(screen.getByTestId(PENCIL));
    expect(screen.getByTestId('recurring-summary-screen-book')).toBeTruthy();

    // Edit mode belongs to the visit it was turned on for: another visit or plan leaves it.
    fireEvent.press(screen.getByTestId(PENCIL));
    fireEvent.press(screen.getByTestId('recurring-summary-screen-switcher-visit-2'));
    expect(handlers.onSelect).toHaveBeenCalledWith(1, 1);
    act(() => handlers.show(1, 1));
    expect(screen.getByTestId('recurring-summary-screen-book')).toBeTruthy();
    expect(screen.queryByTestId('recurring-summary-screen-header-back')).toBeNull();
  });

  it('can open already in edit mode', () => {
    renderSummary({ initialEditing: true });
    expect(screen.getByTestId('recurring-summary-screen-header-back')).toBeTruthy();
    expect(screen.queryByTestId('recurring-summary-screen-book')).toBeNull();
  });
});

describe('RecurringSummaryScreen — deleting (542:1442, 568:2909)', () => {
  it('opens the sheet from the bin and closes it with Cancel', () => {
    renderSummary();
    expect(screen.queryByText('Manage your plans')).toBeNull();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-delete'));
    expect(screen.getByText('Manage your plans')).toBeTruthy();
    expect(screen.getByText('Delete visit')).toBeTruthy();
    expect(screen.getByText('1st Visit · Plan 2')).toBeTruthy();
    expect(screen.getByText('Plan 2 · 2 visits')).toBeTruthy();
    expect(
      screen.getByText('Deletes all 2 plans and 3 visits and takes you back to choosing days'),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-manage-cancel'));
    expect(screen.queryByText('Manage your plans')).toBeNull();
  });

  it('deletes the visit shown only after the dialog confirms it', () => {
    const handlers = renderSummary();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-delete'));
    fireEvent.press(screen.getByTestId('recurring-summary-screen-manage-visit'));
    expect(screen.getByText('Delete 1st Visit from Plan 2?')).toBeTruthy();
    expect(handlers.onDeleteVisit).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-delete-visit-confirm'));
    expect(handlers.onDeleteVisit).toHaveBeenCalledWith(1, 0);
  });

  it('shows the undo banner above the dates, with Undo and dismiss', () => {
    const onUndo = jest.fn();
    const onDismiss = jest.fn();
    renderSummary({ undo: { message: '2nd Visit deleted from Plan 2', onUndo, onDismiss } });
    expect(screen.getByText('2nd Visit deleted from Plan 2')).toBeTruthy();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-undo-undo'));
    expect(onUndo).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('recurring-summary-screen-undo-dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });
});

afterEach(() => {
  act(() => {
    jest.clearAllTimers();
  });
});
