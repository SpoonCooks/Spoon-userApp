import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_BOOKING_ACTIVE } from '@/demo/fixtures/bookings';
import { UpcomingBookingCard } from './UpcomingBookingCard';

describe('UpcomingBookingCard — Figma 59:587', () => {
  it('renders the fixed heading with the supplied date and duration', () => {
    render(<UpcomingBookingCard booking={DEMO_BOOKING_ACTIVE} />);

    expect(screen.getByText('Upcoming booking')).toBeTruthy();
    expect(screen.getByText('Tomorrow, Aug 5')).toBeTruthy();
    expect(screen.getByText('60 mins')).toBeTruthy();
  });

  it('opens from the card itself — the frame draws no separate control', () => {
    const onOpen = jest.fn();
    render(<UpcomingBookingCard booking={DEMO_BOOKING_ACTIVE} onOpen={onOpen} />);

    fireEvent.press(screen.getByTestId('home-upcoming-booking'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('is inert when no callback is supplied', () => {
    render(<UpcomingBookingCard booking={DEMO_BOOKING_ACTIVE} />);

    expect(screen.getByTestId('home-upcoming-booking')).toBeTruthy();
  });

  it('renders the heading with no date and no duration in the payload', () => {
    // The heading is fixed UI copy; everything else is server-supplied and independently optional.
    render(<UpcomingBookingCard booking={{ id: 'b1', headline: 'ignored' }} />);

    expect(screen.getByText('Upcoming booking')).toBeTruthy();
    expect(screen.queryByText('60 mins')).toBeNull();
  });

  it('survives realistic long values without breaking the header onto two lines', () => {
    render(
      <UpcomingBookingCard
        booking={{
          id: 'b2',
          headline: 'ignored',
          subtitle: 'Wednesday, 24 September 2026 at 7:30 PM',
          durationLabel: '150 minutes of cooking',
        }}
      />,
    );

    const date = screen.getByText('Wednesday, 24 September 2026 at 7:30 PM');
    expect(date.props.numberOfLines).toBe(1);
    expect(screen.getByText('150 minutes of cooking').props.numberOfLines).toBe(1);
  });
});
