import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_ACTIVE_BOOKING_RATE } from '@/demo/fixtures/home';
import { HomeBookingBanner } from './HomeBookingBanner';

/**
 * `337:4495` — the "Share your rating!" card.
 *
 * The scale on this card used to SUBMIT. A tap on a chip fired the rating mutation straight from
 * Home: one tap, on a scrolling list, with no cook shown, no `5+` explanation and no feedback
 * field — and a rating cannot be changed once stored. The documented tap target for this card is
 * page 14a, which is where the whole rating UI lives.
 */
describe('HomeBookingBanner — the rate card (337:4495)', () => {
  it('draws the scale at full strength and rates nothing from Home', () => {
    const onOpen = jest.fn();
    render(<HomeBookingBanner booking={DEMO_ACTIVE_BOOKING_RATE} onOpen={onOpen} />);

    const strip = screen.getByTestId('home-upcoming-booking-rating');
    expect(strip).toBeTruthy();

    // Not `disabled`: that dims the chips to `textDisabled`, and the frame draws them live.
    // They are inert because the wrapper takes no touches, not because they are greyed out.
    expect(strip.props.accessibilityState?.disabled).toBeFalsy();

    // The point of `pointerEvents="none"`: a tap that LANDS on a chip is not swallowed by it.
    // It falls through to the card, which opens page 14a — where the customer can see the cook,
    // read what `5+` means, and change their mind before anything is stored.
    fireEvent.press(screen.getByTestId('home-upcoming-booking-rating-5'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('opens the booking when the card is pressed', () => {
    const onOpen = jest.fn();
    render(<HomeBookingBanner booking={DEMO_ACTIVE_BOOKING_RATE} onOpen={onOpen} />);

    fireEvent.press(screen.getByTestId('home-upcoming-booking'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
