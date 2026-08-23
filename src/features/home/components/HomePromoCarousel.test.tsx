import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, AppState } from 'react-native';

import { HOME_DESIGN } from '../layout';
import { HOME_USECASE_SLIDES } from '../assets';
import { HomePromoCarousel } from './HomePromoCarousel';

/**
 * The Home use-case carousel — `381:660`.
 *
 * ## What these lock down
 *
 * The carousel used to advance with `(index + 1) % count`, which meant crossing the last card
 * REWOUND the track through all eight, and swiping right from the first card hit a hard edge.
 * The replacement clones two cards onto each end and re-anchors off them, so both directions are
 * endless and neither wrap is visible.
 *
 * The index the customer sees must stay LOGICAL through all of that: the dots and the
 * accessibility label report "Slide n of 8" and must never report a clone, or a ninth slide.
 *
 * The autoplay half is a lifecycle contract — one interval, alive only while the screen is
 * focused and the app is foreground, and gone on unmount.
 */

/** One card plus one gutter: the distance between two resting positions. */
const STRIDE = HOME_DESIGN.promo.centre.width + HOME_DESIGN.promo.gap;
const COUNT = HOME_USECASE_SLIDES.length;
/** Cloned cards per side, so the first REAL slide sits at this track position. */
const FIRST_REAL = 2;
const TICK = 1000;

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

/** The dots row carries the logical position, which is exactly what the customer is told. */
function slideLabel(): string {
  return String(screen.getByTestId('home-promo-dots').props.accessibilityLabel);
}

/** Lands the scroller on a track position, the way a settled swipe does. */
function settleOn(trackPosition: number) {
  fireEvent(screen.getByTestId('home-promo-scroll'), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: trackPosition * STRIDE, y: 0 },
      contentSize: { width: 0, height: 0 },
      layoutMeasurement: { width: 0, height: 0 },
    },
  });
}

function renderCarousel(props: { focused?: boolean } = {}) {
  return render(<HomePromoCarousel autoAdvanceMs={TICK} {...props} />);
}

describe('infinite track', () => {
  it('renders the eight slides with two cloned cards on each end', () => {
    renderCarousel();

    // Clones — and every real card that is not the one on screen — are hidden from accessibility,
    // which is exactly what stops a screen reader announcing the same picture three times. That
    // also hides them from the default query, so this one opts them back in.
    const hidden = { includeHiddenElements: true };
    // 8 real + 2 leading clones + 2 trailing clones = positions 0..11, and nothing past them.
    for (let position = 0; position < COUNT + 4; position += 1) {
      expect(screen.getByTestId(`home-promo-slide-${position}`, hidden)).toBeTruthy();
    }
    expect(screen.queryByTestId(`home-promo-slide-${COUNT + 4}`, hidden)).toBeNull();
    // Only ever eight logical slides — the clones are not ones the customer can be "on".
    expect(slideLabel()).toBe(`Slide 1 of ${COUNT}`);
  });

  it('reports the first REAL slide on mount, not the leading clone', () => {
    renderCarousel();
    expect(slideLabel()).toBe(`Slide 1 of ${COUNT}`);
  });

  /** A clone is the same picture twice; only the real card on screen may be announced. */
  it('exposes exactly one slide to accessibility — the real one on screen', () => {
    renderCarousel();

    expect(screen.getByTestId(`home-promo-slide-${FIRST_REAL}`)).toBeTruthy();
    for (const clone of [0, 1, COUNT + 2, COUNT + 3]) {
      expect(screen.queryByTestId(`home-promo-slide-${clone}`)).toBeNull();
    }
  });

  /**
   * Swiping RIGHT off the first card. The old carousel could not do this at all; now it lands on
   * the trailing clone of slide 8, which must be reported as slide 8 rather than as a ninth one.
   */
  it('maps a swipe back past the first slide onto the last', () => {
    renderCarousel();

    settleOn(FIRST_REAL - 1);

    expect(slideLabel()).toBe(`Slide ${COUNT} of ${COUNT}`);
  });

  /** Swiping LEFT off the last card lands on the leading clone of slide 1. */
  it('maps a swipe forward past the last slide onto the first', () => {
    renderCarousel();

    settleOn(FIRST_REAL + COUNT);

    expect(slideLabel()).toBe(`Slide 1 of ${COUNT}`);
  });

  it('reports the logical slide for every real position', () => {
    renderCarousel();

    for (let logical = 0; logical < COUNT; logical += 1) {
      settleOn(FIRST_REAL + logical);
      expect(slideLabel()).toBe(`Slide ${logical + 1} of ${COUNT}`);
    }
  });
});

describe('autoplay', () => {
  it('advances one slide per interval', () => {
    renderCarousel();

    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe(`Slide 2 of ${COUNT}`);

    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe(`Slide 3 of ${COUNT}`);
  });

  /**
   * The point of the whole exercise: it must cross the end and keep going, twice over, without
   * ever reporting a slide outside 1..COUNT.
   *
   * Written against `COUNT` rather than against a literal, because the slide set is product
   * content and does change — V7 added a ninth card (`406:1325`). A test that hardcoded eight
   * would have failed for the wrong reason and taught nothing about the loop.
   */
  it('loops past the last slide back to the first, repeatedly', () => {
    renderCarousel();

    const seen: string[] = [];
    for (let step = 0; step < COUNT * 2; step += 1) {
      act(() => jest.advanceTimersByTime(TICK));
      seen.push(slideLabel());
    }

    // Two full laps, each ending back on card 1 — and never a "Slide COUNT + 1".
    expect(seen[COUNT - 1]).toBe(`Slide 1 of ${COUNT}`);
    expect(seen[COUNT * 2 - 1]).toBe(`Slide 1 of ${COUNT}`);

    const expected = Array.from({ length: COUNT }, (_, i) => `Slide ${i + 1} of ${COUNT}`);
    expect(seen.every((label) => expected.includes(label))).toBe(true);
  });

  it('does not advance while the app is backgrounded, and resumes when it returns', () => {
    renderCarousel();

    act(() => appStateListener?.('background'));
    act(() => jest.advanceTimersByTime(TICK * 5));
    expect(slideLabel()).toBe(`Slide 1 of ${COUNT}`);

    act(() => appStateListener?.('active'));
    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe(`Slide 2 of ${COUNT}`);
  });

  /**
   * Android re-emits 'active' many times a second while the app is ALREADY foreground. Each one
   * must be inert — a re-subscribed interval would advance the carousel far faster than its dwell.
   */
  it('is unaffected by repeated "active" events while already foreground', () => {
    renderCarousel();

    for (let i = 0; i < 20; i += 1) act(() => appStateListener?.('active'));

    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe(`Slide 2 of ${COUNT}`);
  });

  it('does not advance while the screen is not focused, and resumes when it is', () => {
    const { rerender } = render(<HomePromoCarousel autoAdvanceMs={TICK} focused={false} />);

    act(() => jest.advanceTimersByTime(TICK * 5));
    expect(slideLabel()).toBe(`Slide 1 of ${COUNT}`);

    rerender(<HomePromoCarousel autoAdvanceMs={TICK} focused />);
    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).toBe(`Slide 2 of ${COUNT}`);
  });

  /** A manual landing restarts the dwell, so the next automatic step is a full interval away. */
  it('restarts the dwell after a manual swipe instead of finishing the old one', () => {
    renderCarousel();

    act(() => jest.advanceTimersByTime(TICK * 0.75));
    fireEvent(screen.getByTestId('home-promo-scroll'), 'scrollBeginDrag');
    settleOn(FIRST_REAL + 3);
    expect(slideLabel()).toBe(`Slide 4 of ${COUNT}`);

    // What remained of the interrupted interval must not move it.
    act(() => jest.advanceTimersByTime(TICK * 0.5));
    expect(slideLabel()).toBe(`Slide 4 of ${COUNT}`);

    act(() => jest.advanceTimersByTime(TICK * 0.5));
    expect(slideLabel()).toBe(`Slide 5 of ${COUNT}`);
  });

  /**
   * The regression this closes, measured on the handset: five deliberate swipes and the carousel
   * never advanced again. A drag that ends mid-snap and produces NO momentum event left
   * `interacting` latched, and autoplay was dead for as long as the customer stayed on Home.
   */
  it('resumes autoplay after a drag that never produces a momentum event', () => {
    renderCarousel();

    const scroll = screen.getByTestId('home-promo-scroll');
    fireEvent(scroll, 'scrollBeginDrag');
    // Released between two resting positions, and nothing follows it.
    fireEvent(scroll, 'scrollEndDrag', {
      nativeEvent: {
        contentOffset: { x: (FIRST_REAL + 1) * STRIDE + STRIDE / 3, y: 0 },
        contentSize: { width: 0, height: 0 },
        layoutMeasurement: { width: 0, height: 0 },
      },
    });

    // The backstop settles it, and the dwell starts again from there.
    act(() => jest.advanceTimersByTime(TICK * 3));
    expect(slideLabel()).not.toBe(`Slide 1 of ${COUNT}`);

    const before = slideLabel();
    act(() => jest.advanceTimersByTime(TICK));
    expect(slideLabel()).not.toBe(before);
  });

  it('leaves no timer running after unmount', () => {
    const { unmount } = renderCarousel();

    act(() => jest.advanceTimersByTime(TICK));
    unmount();

    // Nothing may fire, and nothing may throw by touching an unmounted tree.
    expect(() => act(() => jest.advanceTimersByTime(TICK * 10))).not.toThrow();
  });

  it('does not autoplay when the platform asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    renderCarousel();

    // Let the accessibility probe resolve before the interval would have run.
    await act(async () => {
      await Promise.resolve();
    });
    act(() => jest.advanceTimersByTime(TICK * 5));

    expect(slideLabel()).toBe(`Slide 1 of ${COUNT}`);
  });
});
