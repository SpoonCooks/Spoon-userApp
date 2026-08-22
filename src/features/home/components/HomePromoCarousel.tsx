import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import type {
  AppStateStatus,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import { lightTheme } from '@ui';

import { HOME_USECASE_SLIDES } from '../assets';
import { HOME_DESIGN } from '../layout';
import type { HomePromoViewModel } from '../types';

const { promo: DESIGN } = HOME_DESIGN;

/**
 * The Home use-case carousel — Figma `381:660` "header slides", nine cards in V7.
 *
 * ## Geometry
 *
 * One 217 x 268 card at r20, 16 from its neighbours, with 75pt of the adjacent cards peeking. The
 * peek is produced by CENTRING a card in the viewport rather than by drawing smaller side panels:
 * `contentInset` is emulated with symmetric padding of `(viewport - 217) / 2`, so every card
 * comes to rest dead-centre instead of jamming against an edge.
 *
 * Because that padding is exactly `(viewport - card) / 2`, the resting offset for card `i` is
 * `i * stride` on ANY width — the viewport cancels out. That is what lets the same arithmetic
 * drive the wrap below without re-measuring anything.
 *
 * ## The loop — cloned edges, not a rewind
 *
 * The previous implementation advanced with `(index + 1) % count`, which meant crossing the last
 * card ANIMATED THE TRACK BACKWARDS THROUGH ALL OF THEM to reach the first. That is the visible
 * snap the design does not have, and it also made the carousel finite in the other direction:
 * a customer swiping right from the first card hit a hard edge.
 *
 * So the track rendered is not the nine slides. It is
 *
 *     [ s7 s8 | s0 s1 s2 s3 s4 s5 s6 s7 s8 | s0 s1 ]
 *       clones        the real slides        clones
 *        0  1    2  3  4  5  6  7  8  9 10   11 12
 *
 * Moving forward off `s8` (position 10) lands on position 11 — which IS a picture of `s0` — and
 * once that animation settles the scroller is re-anchored, WITHOUT animation, onto position 2.
 * Both positions show the same artwork with the same neighbours peeking, so the re-anchor is
 * invisible. The same holds backwards off `s0`.
 *
 * TWO clones per side rather than one: at position 11 the RIGHT peek must still be a real card,
 * and with a single clone there would be nothing there to draw — an empty gutter sliding past on
 * every wrap, which is the same defect in a smaller window.
 *
 * Nothing here is written against a slide COUNT — the track, the wrap arithmetic and the dots are
 * all derived from `slides.length`, which is why V7's ninth card needed no change to this file.
 *
 * `index` is always the LOGICAL slide (0-8). The dots and the accessibility label read it, so
 * they never report a clone.
 *
 * ## Autoplay lifecycle
 *
 * The interval runs only while ALL of these hold, and is torn down the moment any stops:
 *
 *   - the screen is FOCUSED — navigating to Address stops it, coming back starts it;
 *   - the app is in the FOREGROUND — `AppState` backgrounding stops it;
 *   - the platform is not reporting "reduce motion", because an unrequested, unstoppable
 *     animation is exactly what that setting exists to switch off. Swiping still works.
 *
 * A manual swipe suspends it while the finger is down and then RESTARTS it from the card the
 * customer landed on, so the next automatic move is a full dwell away rather than whatever was
 * left of the previous one. That restart is a `cycle` bump, and only a DRAG bumps it — an
 * automatic step must not keep resetting its own clock.
 *
 * There is exactly one interval: it lives in one effect whose cleanup clears it, so no
 * combination of focus, background and swipe can leave two running.
 *
 * ## What it must not do
 *
 * Trigger a read. The slides are BUNDLED assets and the component holds only an index, so
 * changing page is pure local state — no query, no invalidation, no loading state.
 */
export interface HomePromoCarouselProps {
  /** Reserved for a future server-driven slide set. Unused today; the slides are design assets. */
  readonly promo?: HomePromoViewModel;
  /** Overridden in tests so a 4 s timer never gates a test run. */
  readonly autoAdvanceMs?: number;
  /**
   * Whether the Home screen is the focused route. Defaults to true so the component can be
   * rendered on its own — the navigator is the only thing that knows better, and it passes it in.
   */
  readonly focused?: boolean;
  readonly testID?: string;
}

const AUTO_ADVANCE_MS = 4000;

/** Cards repeated at each end so both peeks stay real at the wrap. See the note above. */
const CLONES = 2;

/**
 * How long to allow a programmatic step to finish before re-anchoring off a clone.
 *
 * `scrollTo` animates for about 300 ms and reports completion through `onMomentumScrollEnd` —
 * but that event is not guaranteed for a PROGRAMMATIC scroll on every platform, and a wrap that
 * depended on it would strand the track on a clone and stop advancing. The settle handler and
 * this timeout both perform the same idempotent re-anchor, whichever arrives first.
 */
const WRAP_SETTLE_MS = 450;

/**
 * How long after the finger lifts to settle anyway.
 *
 * A release normally hands over to momentum, and `onMomentumScrollEnd` settles it. But a release
 * that produces no momentum — and, on Android, a snap that is interrupted — fires no such event,
 * and the carousel would then sit with `interacting` latched true and its autoplay dead for as
 * long as the customer stayed on Home. Measured on the handset: five deliberate swipes and the
 * carousel never moved again. This is the backstop that makes the latch temporary.
 */
const SETTLE_FALLBACK_MS = 600;

/**
 * Whether the app counts as on-screen for autoplay.
 *
 * Tested against the states that mean PAUSED rather than for `'active'`. Android reports
 * `'unknown'` for a moment at startup, and on iOS the state during a system prompt is `'inactive'`
 * — checking for `'active'` would leave the carousel frozen until the first change event arrived,
 * which on a launch straight onto Home may be never.
 */
function isForeground(status: AppStateStatus | string): boolean {
  return status !== 'background' && status !== 'inactive';
}

export function HomePromoCarousel({
  autoAdvanceMs = AUTO_ADVANCE_MS,
  focused = true,
  testID = 'home-promo',
}: HomePromoCarouselProps) {
  const slides = HOME_USECASE_SLIDES;
  const count = slides.length;
  /** A single slide cannot loop, and must not be cloned into a track that pretends it can. */
  const looping = count > 1;

  const { width: windowWidth } = useWindowDimensions();

  const track = useMemo(
    () =>
      looping ? [...slides.slice(-CLONES), ...slides, ...slides.slice(0, CLONES)] : [...slides],
    [slides, looping],
  );
  /** Where the real slides begin in the rendered track. */
  const firstReal = looping ? CLONES : 0;

  const toLogical = useCallback(
    (position: number) => (looping ? (((position - CLONES) % count) + count) % count : 0),
    [looping, count],
  );

  const scroller = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState(windowWidth);
  /** The LOGICAL slide on screen. Drives the dots; never a clone. */
  const [index, setIndex] = useState(0);
  /** Bumped when a MANUAL swipe settles, which is what restarts the dwell. */
  const [cycle, setCycle] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [appActive, setAppActive] = useState(() => isForeground(AppState.currentState));

  /** The card's position in the RENDERED track, clones included. */
  const position = useRef(firstReal);
  /**
   * Set while a finger is down. Auto-advance reads it rather than clearing the interval, so a
   * gesture that ends without its matching end event cannot freeze the carousel permanently.
   */
  const interacting = useRef(false);
  /** True only for a customer-driven scroll, so an automatic step never restarts its own clock. */
  const dragged = useRef(false);
  const wrapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The most recent scroll offset, so the fallback below can settle without an event to read. */
  const lastOffset = useRef(0);
  const didInit = useRef(false);

  /** One card plus one gutter — the distance between two consecutive resting positions. */
  const stride = DESIGN.centre.width + DESIGN.gap;
  /** Centres a card in whatever width the row is given, which is what produces the peek. */
  const sidePadding = Math.max(0, (viewport - DESIGN.centre.width) / 2);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  /**
   * Foreground/background.
   *
   * Android re-emits 'active' many times a second while the app is ALREADY foreground. Storing a
   * BOOLEAN rather than acting on the event is what makes that harmless: React bails out of a
   * set-state to the same value, so the interval effect below never re-runs.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      setAppActive(isForeground(status));
    });
    return () => subscription.remove();
  }, []);

  const clearWrapTimer = useCallback(() => {
    if (wrapTimer.current !== null) {
      clearTimeout(wrapTimer.current);
      wrapTimer.current = null;
    }
  }, []);

  const clearSettleTimer = useCallback(() => {
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearWrapTimer();
      clearSettleTimer();
    },
    [clearWrapTimer, clearSettleTimer],
  );

  const anchor = useCallback(
    (trackPosition: number, animated: boolean) => {
      scroller.current?.scrollTo({ x: trackPosition * stride, y: 0, animated });
    },
    [stride],
  );

  /**
   * Bring the track back onto a REAL card showing the same artwork. Idempotent: running it twice,
   * or running it when the card is already real, changes nothing.
   */
  const normalize = useCallback(
    (landed: number) => {
      clearWrapTimer();
      const logical = toLogical(landed);
      const real = firstReal + logical;
      position.current = real;
      setIndex(logical);
      if (real !== landed) anchor(real, false);
      return logical;
    },
    [anchor, clearWrapTimer, firstReal, toLogical],
  );

  /** One step forward, wrapping through the clone rather than rewinding across the track. */
  const advance = useCallback(() => {
    if (!looping) return;
    const next = position.current + 1;
    position.current = next;
    setIndex(toLogical(next));
    anchor(next, true);

    if (next >= firstReal + count) {
      clearWrapTimer();
      wrapTimer.current = setTimeout(() => {
        wrapTimer.current = null;
        normalize(next);
      }, WRAP_SETTLE_MS);
    }
  }, [anchor, clearWrapTimer, count, firstReal, looping, normalize, toLogical]);

  /**
   * The single autoplay interval.
   *
   * Every reason to stop is a DEPENDENCY rather than a branch inside the tick, so stopping is the
   * effect being torn down — there is no path that leaves an interval running with nothing to do.
   */
  useEffect(() => {
    if (!looping || !focused || !appActive || reduceMotion || autoAdvanceMs <= 0) return;

    const timer = setInterval(() => {
      if (interacting.current) return;
      advance();
    }, autoAdvanceMs);

    return () => clearInterval(timer);
  }, [looping, focused, appActive, reduceMotion, autoAdvanceMs, advance, cycle]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setViewport(event.nativeEvent.layout.width);
  }, []);

  /**
   * Start on the first REAL card, not on the leading clone.
   *
   * Content size is the signal rather than layout: on Android a `scrollTo` issued before the row
   * has measured its children is silently dropped, and the carousel would open on `s6`.
   */
  const onContentSizeChange = useCallback(() => {
    if (didInit.current) return;
    didInit.current = true;
    anchor(firstReal, false);
  }, [anchor, firstReal]);

  /** A rotation changes the padding, so the current card has to be re-centred under it. */
  useEffect(() => {
    if (!didInit.current || interacting.current) return;
    anchor(position.current, false);
  }, [anchor, viewport]);

  const settle = useCallback(
    (offsetX: number) => {
      clearSettleTimer();
      const landed = Math.round(offsetX / stride);
      normalize(landed);
      interacting.current = false;
      if (dragged.current) {
        dragged.current = false;
        // Restart the dwell from where the customer landed.
        setCycle((previous) => previous + 1);
      }
    },
    [clearSettleTimer, normalize, stride],
  );

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      settle(event.nativeEvent.contentOffset.x);
    },
    [settle],
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    lastOffset.current = event.nativeEvent.contentOffset.x;
  }, []);

  /**
   * The finger lifted.
   *
   * A release already AT a resting position produces no momentum, so it is settled here and now.
   * A release mid-snap is still in flight, and settling it immediately would re-anchor the track
   * out from under the animation — so it is left to `onMomentumScrollEnd`, with a timer as the
   * backstop for the case where that event never comes. Either way the settle happens, which is
   * what guarantees `interacting` is released and autoplay resumes.
   */
  const onEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      lastOffset.current = offsetX;
      if (Math.abs(offsetX - Math.round(offsetX / stride) * stride) < 1) {
        settle(offsetX);
        return;
      }
      clearSettleTimer();
      settleTimer.current = setTimeout(() => {
        settleTimer.current = null;
        settle(lastOffset.current);
      }, SETTLE_FALLBACK_MS);
    },
    [clearSettleTimer, settle, stride],
  );

  return (
    <View style={styles.block} testID={testID}>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Snapping to the STRIDE, not to the page width, is what lets both neighbours peek while
        // every card still comes to rest dead-centre.
        snapToInterval={stride}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScrollBeginDrag={() => {
          interacting.current = true;
          dragged.current = true;
          clearWrapTimer();
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onEndDrag}
        contentContainerStyle={[styles.track, { paddingHorizontal: sidePadding }]}
        style={styles.row}
        testID={`${testID}-scroll`}
      >
        {track.map((slide, trackPosition) => {
          const isReal = trackPosition >= firstReal && trackPosition < firstReal + count;
          const logical = toLogical(trackPosition);
          return (
            <Image
              // Clones repeat a slide id, so position is what makes the key unique.
              key={`${slide.id}-${trackPosition}`}
              source={slide.source}
              style={styles.card}
              // `cover` on a box whose aspect ratio matches the asset's: the export carries a few
              // points of transparent shadow bleed, which cover trims rather than letterboxing.
              resizeMode="cover"
              accessible
              accessibilityRole="image"
              accessibilityLabel={slide.label}
              // A clone is the same picture twice; only the real card on screen is announced.
              accessibilityElementsHidden={!isReal || logical !== index}
              accessibilityIgnoresInvertColors
              testID={`${testID}-slide-${trackPosition}`}
            />
          );
        })}
      </ScrollView>

      <View
        style={styles.dots}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Slide ${index + 1} of ${count}`}
        testID={`${testID}-dots`}
      >
        {slides.map((slide, position_) => (
          <View
            key={slide.id}
            style={[styles.dot, position_ === index ? styles.dotActive : styles.dotIdle]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `381:660` — 303 tall: 8.5 above the slide row, the row, 6, then the 12pt dot row. */
  block: { alignSelf: 'stretch', paddingTop: DESIGN.slideRowTop, gap: DESIGN.dotsGap },
  row: { alignSelf: 'stretch', height: DESIGN.slideRowHeight },
  track: { alignItems: 'center', gap: DESIGN.gap },
  /** `378:184` … `375:124` — 217 x 268 at r20. Fixed, so the peek flexes instead of the card. */
  card: {
    width: DESIGN.centre.width,
    height: DESIGN.centre.height,
    borderRadius: DESIGN.radius,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `381:677` — eight 7pt circles at a 4pt gutter, centred in a 12pt row. */
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DESIGN.dot.gap,
    height: 12,
  },
  dot: {
    width: DESIGN.dot.size,
    height: DESIGN.dot.size,
    borderRadius: DESIGN.dot.size / 2,
    opacity: DESIGN.dot.opacity,
  },
  /** `381:678` — `#FFDE33`. */
  dotActive: { backgroundColor: lightTheme.colors.borderCtaSoft },
  /** `381:679` — `#FFEF99`. */
  dotIdle: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
});
