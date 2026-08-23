import { render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';

import {
  DEMO_BOOKING_HISTORY,
  DEMO_BOOKING_HISTORY_EMPTY,
  DEMO_REFUND_HISTORY,
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
