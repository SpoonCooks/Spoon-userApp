import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { lightTheme } from '@ui';

import { HOME_USECASE_SLIDES } from '../assets';
import { useLoopingCarousel } from '../hooks/useLoopingCarousel';
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

export function HomePromoCarousel({
  autoAdvanceMs,
  focused = true,
  testID = 'home-promo',
}: HomePromoCarouselProps) {
  const slides = HOME_USECASE_SLIDES;
  const count = slides.length;

  const { width: windowWidth } = useWindowDimensions();
  const [viewport, setViewport] = useState(windowWidth);

  /** One card plus one gutter — the distance between two consecutive resting positions. */
  const stride = DESIGN.centre.width + DESIGN.gap;
  /** Centres a card in whatever width the row is given, which is what produces the peek. */
  const sidePadding = Math.max(0, (viewport - DESIGN.centre.width) / 2);

  const scrollRef = useRef<ScrollView>(null);
  const { recenter, ...carousel } = useLoopingCarousel({
    itemCount: count,
    stride,
    scrollRef,
    ...(autoAdvanceMs === undefined ? {} : { autoAdvanceMs }),
    focused,
  });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setViewport(event.nativeEvent.layout.width);
  }, []);

  /** A rotation changes the padding, so the current card has to be re-centred under it. */
  useEffect(() => {
    recenter();
  }, [viewport, recenter]);

  return (
    <View style={styles.block} testID={testID}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Snapping to the STRIDE, not to the page width, is what lets both neighbours peek while
        // every card still comes to rest dead-centre.
        snapToInterval={stride}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onLayout={onLayout}
        onContentSizeChange={carousel.scrollViewProps.onContentSizeChange}
        onScrollBeginDrag={carousel.scrollViewProps.onScrollBeginDrag}
        onScroll={carousel.scrollViewProps.onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={carousel.scrollViewProps.onMomentumScrollEnd}
        onScrollEndDrag={carousel.scrollViewProps.onScrollEndDrag}
        contentContainerStyle={[styles.track, { paddingHorizontal: sidePadding }]}
        style={styles.row}
        testID={`${testID}-scroll`}
      >
        {carousel.track.map((logical, trackPosition) => {
          const slide = slides[logical];
          if (slide === undefined) return null;
          const isReal = carousel.isRealTrackPosition(trackPosition);
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
              accessibilityElementsHidden={!isReal || logical !== carousel.index}
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
        accessibilityLabel={`Slide ${carousel.index + 1} of ${count}`}
        testID={`${testID}-dots`}
      >
        {slides.map((slide, position_) => (
          <View
            key={slide.id}
            style={[styles.dot, position_ === carousel.index ? styles.dotActive : styles.dotIdle]}
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
