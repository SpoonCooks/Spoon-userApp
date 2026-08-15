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

  it('renders the DESIGNED loading state (71:747), not a generic skeleton (task §13)', () => {
    render(<BookingListView state={{ status: 'loading' }} {...props} />);

    expect(screen.getByTestId('intro-loading')).toBeTruthy();
    expect(screen.getByText('Best cooks in town!')).toBeTruthy();
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
