import { fireEvent, render, screen } from '@testing-library/react-native';

import { HomeBookingCarousel } from './HomeBookingCarousel';
import {
  DEMO_ACTIVE_BOOKING_ARRIVING,
  DEMO_ACTIVE_BOOKING_CONFIRMED,
  DEMO_ACTIVE_BOOKING_TIME_LEFT,
} from '@/demo/fixtures/home';

/**
 * Home used to draw ONE booking card.
 *
 * `GET /v1/me/bookings/active` returns up to twenty, and Home sorted them, took the winner and
 * dropped the rest — so a customer holding an 11:30 and a 2:00 booking saw one card and nothing
 * to say the second existed. The payload had them all along.
 *
 * The rule these pin: every booking is reachable, and the single-booking case does not pay for it.
 */

const second = { ...DEMO_ACTIVE_BOOKING_CONFIRMED, bookingId: 'booking-2' };
const third = { ...DEMO_ACTIVE_BOOKING_TIME_LEFT, bookingId: 'booking-3' };

describe('every active booking is reachable', () => {
  it('draws a page for each booking, not just the first', () => {
    render(
      <HomeBookingCarousel
        bookings={[DEMO_ACTIVE_BOOKING_ARRIVING, second, third]}
        onOpen={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId(`home-booking-carousel-page-${DEMO_ACTIVE_BOOKING_ARRIVING.bookingId}`),
    ).toBeTruthy();
    expect(screen.getByTestId('home-booking-carousel-page-booking-2')).toBeTruthy();
    expect(screen.getByTestId('home-booking-carousel-page-booking-3')).toBeTruthy();
  });

  it('says how many there are, so the second is discoverable', () => {
    // The dots are the only thing on screen that says a second booking exists — without them a
    // swipeable card is indistinguishable from a fixed one.
    render(
      <HomeBookingCarousel bookings={[DEMO_ACTIVE_BOOKING_ARRIVING, second]} onOpen={jest.fn()} />,
    );

    expect(screen.getByTestId('home-booking-carousel-dots')).toBeTruthy();
    expect(screen.getByLabelText('Booking 1 of 2')).toBeTruthy();
  });

  it('opens the booking whose card was pressed, not always the first', () => {
    // The bug this replaces was a shared opener bound to the lead booking. With one card that is
    // invisible; with three it sends every tap to the wrong screen.
    const onOpen = jest.fn();
    render(
      <HomeBookingCarousel
        bookings={[DEMO_ACTIVE_BOOKING_ARRIVING, second, third]}
        onOpen={onOpen}
      />,
    );

    fireEvent.press(screen.getByTestId('home-booking-carousel-card-booking-3'));
    expect(onOpen).toHaveBeenCalledWith(third.destination);
  });
});

describe('one booking costs nothing', () => {
  it('renders the bare banner — no track, no dots', () => {
    // The common case is one booking and it must render exactly as it did before this component
    // existed: no ScrollView, no dot row, no measurement pass.
    render(<HomeBookingCarousel bookings={[DEMO_ACTIVE_BOOKING_ARRIVING]} onOpen={jest.fn()} />);

    expect(screen.getByTestId('home-upcoming-booking')).toBeTruthy();
    expect(screen.queryByTestId('home-booking-carousel-track')).toBeNull();
    expect(screen.queryByTestId('home-booking-carousel-dots')).toBeNull();
  });

  it('draws nothing at all when there are no bookings', () => {
    render(<HomeBookingCarousel bookings={[]} onOpen={jest.fn()} />);
    expect(screen.queryByTestId('home-upcoming-booking')).toBeNull();
  });
});
