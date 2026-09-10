import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, AppState } from 'react-native';

import { HomeBookingCarousel } from './HomeBookingCarousel';
import type { HomeBannerViewModel } from '../state/homeBannerView';

/**
 * The Home booking carousel — one `HomeBookingBanner` per active booking.
 *
 * This mirrors `HomePromoCarousel.test.tsx`'s structure deliberately: both carousels share the
 * same `useLoopingCarousel` hook, so the same loop/autoplay contract applies here — the only
 * thing worth re-asserting per consumer is that IT is wired up correctly (right testIDs, right
 * item count, right stride), not the loop mechanics themselves, which `HomePromoCarousel.test.tsx`
 * already locks down against the shared hook.
 */

const TICK = 1000;

function bookingFixture(id: string, title: string): HomeBannerViewModel {
  return {
    variant: 'confirmed',
    bookingId: id,
    title,
    dateLabel: 'Tomorrow, Aug 5',
    timeLabel: '1:15 PM • 1 hr',
    cookName: `Cook for ${id}`,
    badgeValue: 'Confirmed!',
    destination: { route: '/booking/[id]', bookingId: id, figmaPage: '8a' },
  };
}

const THREE_BOOKINGS = [
  bookingFixture('bk-1', 'First booking'),
  bookingFixture('bk-2', 'Second booking'),
  bookingFixture('bk-3', 'Third booking'),
];

let appStateListener: ((status: string) => void) | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  appStateListener = undefined;

  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _type: string,
    handler: (status: string) => void,
  ) => {
    appStateListener = handler;
    return { remove: jest.fn() };
  }) as never);

  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((() => ({ remove: jest.fn() })) as never);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function slideLabel(): string {
  return String(screen.getByTestId('home-booking-carousel-dots').props.accessibilityLabel);
}

/** The stride this test run actually resolved to — read off the rendered ScrollView itself, so
 * this file makes no assumption about the test environment's window width. */
function stride(): number {
  return Number(screen.getByTestId('home-booking-carousel-scroll').props.snapToInterval);
}

function settleOn(trackPosition: number) {
  fireEvent(screen.getByTestId('home-booking-carousel-scroll'), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: trackPosition * stride(), y: 0 },
      contentSize: { width: 0, height: 0 },
      layoutMeasurement: { width: 0, height: 0 },
    },
  });
}

const onOpen = jest.fn();

describe('HomeBookingCarousel', () => {
  it('renders nothing for zero bookings', () => {
    render(<HomeBookingCarousel bookings={[]} onOpen={onOpen} />);

    expect(screen.queryByTestId('home-booking-carousel')).toBeNull();
  });

  it('renders a single booking as a static card — no dots, no loop', () => {
    render(
      <HomeBookingCarousel
        bookings={[bookingFixture('bk-solo', 'Solo booking')]}
        onOpen={onOpen}
        autoAdvanceMs={TICK}
      />,
    );

    expect(screen.getByText('Solo booking')).toBeTruthy();
    expect(screen.queryByTestId('home-booking-carousel-dots')).toBeNull();

    // A single item cannot loop; the autoplay interval must not fire at all.
    act(() => jest.advanceTimersByTime(TICK * 5));
    expect(screen.getByText('Solo booking')).toBeTruthy();
  });

  it('renders one card per booking and reports the right slide count', () => {
    render(<HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />);

    expect(screen.getByText('First booking')).toBeTruthy();
    expect(slideLabel()).toBe('Booking 1 of 3');
  });

  it('opens the booking that was pressed, not a different one', () => {
    render(<HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />);

    // Two leading clones sit before the first REAL card in a 3-item looping track (see
    // `CAROUSEL_CLONES` in `useLoopingCarousel.ts`), so booking 0 renders at track position 2.
    fireEvent.press(screen.getByTestId('home-booking-carousel-card-2'));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(THREE_BOOKINGS[0]);
  });

  it('advances one booking per interval, same cadence as the promo carousel', () => {
    render(<HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />);

    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe('Booking 2 of 3');

    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe('Booking 3 of 3');
  });

  it('loops past the last booking back to the first', () => {
    render(<HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />);

    for (let step = 0; step < THREE_BOOKINGS.length; step += 1) {
      act(() => jest.advanceTimersByTime(TICK));
    }

    expect(slideLabel()).toBe('Booking 1 of 3');
  });

  it('does not advance while the screen is not focused, and resumes when it is', () => {
    const { rerender } = render(
      <HomeBookingCarousel
        bookings={THREE_BOOKINGS}
        onOpen={onOpen}
        autoAdvanceMs={TICK}
        focused={false}
      />,
    );

    act(() => jest.advanceTimersByTime(TICK * 5));
    expect(slideLabel()).toBe('Booking 1 of 3');

    rerender(
      <HomeBookingCarousel
        bookings={THREE_BOOKINGS}
        onOpen={onOpen}
        autoAdvanceMs={TICK}
        focused
      />,
    );
    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe('Booking 2 of 3');
  });

  it('does not advance while the app is backgrounded, and resumes when it returns', () => {
    render(<HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />);

    act(() => appStateListener?.('background'));
    act(() => jest.advanceTimersByTime(TICK * 5));
    expect(slideLabel()).toBe('Booking 1 of 3');

    act(() => appStateListener?.('active'));
    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe('Booking 2 of 3');
  });

  it('does not autoplay when the platform asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    render(<HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => jest.advanceTimersByTime(TICK * 5));

    expect(slideLabel()).toBe('Booking 1 of 3');
  });

  it('reports the logical booking for a manual swipe to any position', () => {
    render(<HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />);

    // Track position 3 is the first LEADING clone slot's offset from position 0 for a 3-item,
    // 2-clone track — i.e. `firstReal (2) + logical (1)`.
    settleOn(3);
    expect(slideLabel()).toBe('Booking 2 of 3');
  });

  it('follows the booking being viewed when a reschedule reorders the list around it', () => {
    const { rerender } = render(
      <HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />,
    );

    // Move onto the second booking, the same way a manual swipe would.
    settleOn(3);
    expect(slideLabel()).toBe('Booking 2 of 3');

    // Home stays mounted underneath the booking detail screen the whole time a reschedule
    // happens there, so this is a plain prop update — not a remount — moving the VIEWED booking
    // (bk-2) to the front of the list.
    const reordered = [THREE_BOOKINGS[1]!, THREE_BOOKINGS[0]!, THREE_BOOKINGS[2]!];
    rerender(<HomeBookingCarousel bookings={reordered} onOpen={onOpen} autoAdvanceMs={TICK} />);

    // The re-anchor is deferred a 0ms timeout past the render that detects the reorder — advance
    // by exactly that much (not `runOnlyPendingTimers`, which would also fire the still-pending
    // 1s autoplay interval one tick early, a test-only artifact of that helper ignoring delay).
    act(() => jest.advanceTimersByTime(0));

    expect(slideLabel()).toBe('Booking 1 of 3');
    expect(screen.getByText('Second booking')).toBeTruthy();
  });

  it('falls back to a nearby slot when the booking being viewed drops out of the list', () => {
    const { rerender } = render(
      <HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />,
    );

    // Track position 4 is `firstReal (2) + logical (2)` — the third booking.
    settleOn(4);
    expect(slideLabel()).toBe('Booking 3 of 3');

    // The viewed booking (bk-3) is gone — e.g. it got rated and aged out of the active list.
    const remaining = [THREE_BOOKINGS[0]!, THREE_BOOKINGS[1]!];
    rerender(<HomeBookingCarousel bookings={remaining} onOpen={onOpen} autoAdvanceMs={TICK} />);

    act(() => jest.advanceTimersByTime(0));

    expect(slideLabel()).toBe('Booking 2 of 2');
    expect(screen.getByText('Second booking')).toBeTruthy();
  });

  it('does not raise onRate when the host wires none — the rate card stays inert', () => {
    render(
      <HomeBookingCarousel
        bookings={[
          { ...bookingFixture('bk-rate', 'Rate me'), variant: 'rate', rating: { description: '' } },
        ]}
        onOpen={onOpen}
      />,
    );

    // A single booking draws no dots, but the card itself (and its rating widget) still renders.
    expect(screen.getByText('Rate me')).toBeTruthy();
  });

  it('leaves no timer running after unmount', () => {
    const { unmount } = render(
      <HomeBookingCarousel bookings={THREE_BOOKINGS} onOpen={onOpen} autoAdvanceMs={TICK} />,
    );

    act(() => jest.advanceTimersByTime(TICK));
    unmount();

    expect(() => act(() => jest.advanceTimersByTime(TICK * 10))).not.toThrow();
  });
});
