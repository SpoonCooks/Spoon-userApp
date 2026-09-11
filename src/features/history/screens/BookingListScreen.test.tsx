import { fireEvent, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';

import {
  DEMO_BOOKING_HISTORY,
  DEMO_BOOKING_HISTORY_EMPTY,
  DEMO_REFUND_HISTORY,
  DEMO_UPCOMING_BOOKINGS,
  DEMO_UPCOMING_BOOKINGS_EMPTY,
} from '@/demo/fixtures/screens';
import { BookingListView } from './BookingListScreen';

const props = { onRetry: jest.fn(), onBack: jest.fn() };

describe('Booking history (6:227)', () => {
  it('renders one card per booking with server status labels', () => {
    render(<BookingListView state={ready(DEMO_BOOKING_HISTORY)} {...props} />);

    expect(screen.getByText('Past bookings')).toBeTruthy();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getByText('Unfulfilled')).toBeTruthy();
  });

  it('renders an empty state', () => {
    render(<BookingListView state={ready(DEMO_BOOKING_HISTORY_EMPTY)} {...props} />);

    expect(screen.getByTestId('booking-list-screen-empty')).toBeTruthy();
  });

  /**
   * LOADING RULE, reversed for V8 (task §13 / §25).
   *
   * This used to assert the opposite — that the branded `71:747` interstitial was rendered here.
   * The founder's rule is now that the ONE global loading screen belongs to the app opening, and
   * Profile -> My bookings is exactly the "normal navigation" it must not appear on. A list that
   * is loading gets the SKELETON of the list, which is scoped, silent and shaped like what is
   * coming.
   */
  it('renders a scoped skeleton, never the branded interstitial (task §13)', () => {
    render(<BookingListView state={{ status: 'loading' }} {...props} />);

    expect(screen.queryByTestId('intro-loading')).toBeNull();
    expect(screen.queryByText('Best cooks in town!')).toBeNull();
    expect(screen.getByTestId('loading-card-0')).toBeTruthy();
    // The list and its header only exist once the payload does.
    expect(screen.queryByText('Past bookings')).toBeNull();
  });

  it('renders an error surface', () => {
    render(
      <BookingListView
        state={{ status: 'error', error: { kind: 'server', message: 'boom', status: 500 } }}
        {...props}
      />,
    );

    expect(screen.getByTestId('error-state')).toBeTruthy();
  });
});

describe('My bookings — Upcoming/Past tabs', () => {
  const tabs = { active: 'upcoming', onChange: jest.fn() };

  afterEach(() => {
    tabs.onChange.mockClear();
  });

  it('titles the header "My bookings" and renders the switcher only when tabs is passed', () => {
    render(<BookingListView state={ready(DEMO_UPCOMING_BOOKINGS)} tabs={tabs} {...props} />);

    expect(screen.getByText('My bookings')).toBeTruthy();
    expect(screen.getByTestId('booking-list-screen-tabs')).toBeTruthy();
  });

  it('reports the segment pressed, not the one already active', () => {
    render(<BookingListView state={ready(DEMO_UPCOMING_BOOKINGS)} tabs={tabs} {...props} />);

    fireEvent.press(screen.getByTestId('booking-list-screen-tabs-past'));

    expect(tabs.onChange).toHaveBeenCalledTimes(1);
    expect(tabs.onChange).toHaveBeenCalledWith('past');
  });

  it('falls back to list.title and renders no switcher when tabs is omitted', () => {
    render(<BookingListView state={ready(DEMO_BOOKING_HISTORY)} {...props} />);

    expect(screen.queryByText('My bookings')).toBeNull();
    expect(screen.queryByTestId('booking-list-screen-tabs')).toBeNull();
  });

  it("renders the Upcoming tab's own empty state, distinct from the Past tab's", () => {
    render(<BookingListView state={ready(DEMO_UPCOMING_BOOKINGS_EMPTY)} tabs={tabs} {...props} />);

    expect(screen.getByTestId('booking-list-screen-empty')).toBeTruthy();
    expect(screen.getByText('No upcoming bookings')).toBeTruthy();
  });
});

describe('Refunds (71:615)', () => {
  it('reuses the same card with the refund variant and no rating', () => {
    render(
      <BookingListView
        state={ready(DEMO_REFUND_HISTORY)}
        variant="refund"
        testID="refunds"
        {...props}
      />,
    );

    expect(screen.getByText('Refunds')).toBeTruthy();
    expect(screen.getByText('Refund expected by 15th Apr')).toBeTruthy();
    expect(screen.getByText('Processing')).toBeTruthy();
    expect(screen.queryByTestId('refunds-card-demo-refund-1-rating')).toBeNull();
  });
});
