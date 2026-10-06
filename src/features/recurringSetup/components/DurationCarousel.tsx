import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import type { RecurringDurationOption } from '../types';

/**
 * The duration carousel — Spoon — User `1221:4505` ("Duration carousel", used by Schedule, Visit
 * addition and Edit date): a horizontal strip of cards that snaps the chosen one to the centre.
 *
 * The centred card is the focused one — larger (128 × 160 against 100 × 130), edged and lifted —
 * and its neighbours run off both sides of the screen. Each card shows its duration, its price and
 * the struck original, over a "level" of liquid rising from the foot of the card: the longer the
 * duration, the higher the level (`1219:4396`: 22 / 33 / 53 / 65 / 87 / 108 of 130 for 30 / 45 /
 * 60 / 90 / 120 / 150 minutes — `minutes / 180` of the card's height). Dots under the strip count
 * the options and mark the one in the centre.
 *
 * CONTROLLED: `selectedId` is the choice and the strip follows it. `onSelect` reports a new choice
 * when the strip comes to rest on a card, or a card is tapped (a tap on a neighbour also glides it
 * to the centre; a tap on the centred card confirms it). With `selectedId` null nothing is chosen
 * yet, but the strip still rests on a card (`defaultId`, else the middle one, `1 hr` in the
 * catalogue) so it never opens empty — scrolling to another card, or tapping the centred one,
 * chooses.
 *
 * Full-bleed: it is as wide as the window and carries no side margin, so inside a screen with a
 * 16pt gutter pass `bleed={16}` (Figma sets the instance at x −16 in a 370pt column).
 */
export interface DurationCarouselOption extends RecurringDurationOption {
  /** Greyed out and not selectable (the visit it would overlap is already booked). */
  readonly disabled?: boolean | undefined;
}

export interface DurationCarouselProps {
  readonly options: readonly DurationCarouselOption[];
  /** The chosen option's id, or null while none is. */
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Where the strip rests while nothing is chosen. The middle option by default. */
  readonly defaultId?: string | undefined;
  /** Negative side margin, to span a screen whose content has a gutter. Default 0. */
  readonly bleed?: number | undefined;
  readonly testID?: string | undefined;
}

/** "30 mins", "1 hr", "1.5 hrs", "2 hrs" — the carousel's own wording (`1219:4278` / `1219:4401`). */
export function durationCardLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return hours > 1 ? `${text} hrs` : `${text} hr`;
}

/** `1219:4396` — the level's height as a share of the card: 22 of 130 at 30 min, 108 at 150. */
export function durationLevelShare(minutes: number): number {
  return Math.min(Math.max(minutes / LEVEL_MINUTES, 0), 1);
}

export function DurationCarousel({
  options,
  selectedId,
  onSelect,
  defaultId,
  bleed = 0,
  testID = 'recurring-duration-carousel',
}: DurationCarouselProps) {
  const { width: windowWidth } = useWindowDimensions();
  const width = windowWidth + bleed * 2;
  const last = Math.max(options.length - 1, 0);

  const indexOf = useCallback(
    (id: string | null | undefined) => {
      const found = id === null || id === undefined ? -1 : options.findIndex((o) => o.id === id);
      return found < 0 ? null : found;
    },
    [options],
  );
  const restingIndex = indexOf(selectedId) ?? indexOf(defaultId) ?? Math.floor(last / 2);

  const scroller = useRef<ScrollView>(null);
  const [scrollX] = useState(() => new Animated.Value(restingIndex * PITCH));
  /** The card in the centre right now, followed live (dots, label sizes). */
  const [active, setActive] = useState(restingIndex);
  const activeRef = useRef(restingIndex);
  /** Last id reported, so a tap and the settle it causes report once. */
  const reported = useRef<string | null>(selectedId);

  useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      const next = clampIndex(Math.round(value / PITCH), last);
      if (next === activeRef.current) return;
      activeRef.current = next;
      setActive(next);
    });
    return () => scrollX.removeListener(listener);
  }, [scrollX, last]);

  const scrollToIndex = useCallback((index: number, animated: boolean) => {
    scroller.current?.scrollTo({ x: index * PITCH, y: 0, animated });
  }, []);

  // Mount on the resting card (`contentOffset` is iOS only), and follow `selectedId` afterwards.
  const selectedIndex = indexOf(selectedId);
  const mounted = useRef(false);
  useEffect(() => {
    reported.current = selectedId;
    if (!mounted.current) {
      mounted.current = true;
      scrollToIndex(restingIndex, false);
      return;
    }
    if (selectedIndex !== null && selectedIndex !== activeRef.current) {
      scrollToIndex(selectedIndex, true);
    }
  }, [selectedId, selectedIndex, restingIndex, scrollToIndex]);

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (option === undefined || option.disabled === true) return false;
      if (reported.current !== option.id) {
        reported.current = option.id;
        onSelect(option.id);
      }
      return true;
    },
    [options, onSelect],
  );

  /** The strip came to rest at `x`: choose the card there, or return to the last good one. */
  const settle = useCallback(
    (x: number) => {
      const index = clampIndex(Math.round(x / PITCH), last);
      if (choose(index)) return;
      const back = indexOf(reported.current) ?? nearestOpen(options, index);
      if (back !== null) scrollToIndex(back, true);
    },
    [choose, indexOf, last, options, scrollToIndex],
  );

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    scrollX.setValue(event.nativeEvent.contentOffset.x);
  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    settle(event.nativeEvent.contentOffset.x);
  const onDragEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // A drag let go exactly on a card never decelerates, so no momentum end follows it.
    const { x } = event.nativeEvent.contentOffset;
    if (Math.abs(x - Math.round(x / PITCH) * PITCH) < 1) settle(x);
  };

  const gutter = (width - FOCUS_WIDTH) / 2;
  const snapOffsets = useMemo(() => options.map((_, index) => index * PITCH), [options]);

  return (
    <View
      style={[styles.root, bleed === 0 ? null : { marginHorizontal: -bleed }]}
      testID={testID}
      accessibilityRole="radiogroup"
    >
      <ScrollView
        ref={scroller}
        horizontal
        style={{ width, height: TRACK_HEIGHT }}
        contentContainerStyle={[styles.track, { paddingHorizontal: gutter }]}
        contentOffset={{ x: restingIndex * PITCH, y: 0 }}
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        snapToEnd={false}
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onDragEnd}
        testID={`${testID}-track`}
      >
        {options.map((option, index) => (
          <DurationCard
            key={option.id}
            option={option}
            index={index}
            scrollX={scrollX}
            focused={index === active}
            selected={option.id === selectedId}
            onPress={() => {
              if (choose(index)) scrollToIndex(index, true);
            }}
            testID={`${testID}-option-${option.id}`}
          />
        ))}
      </ScrollView>
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
        {options.map((option, index) => (
          <View
            key={option.id}
            style={index === active ? styles.dotActive : styles.dot}
            testID={`${testID}-dot-${index}`}
          />
        ))}
      </View>
    </View>
  );
}

function clampIndex(index: number, last: number): number {
  return Math.min(Math.max(index, 0), last);
}

/** The enabled option closest to `index`, or null when every option is disabled. */
function nearestOpen(options: readonly DurationCarouselOption[], index: number): number | null {
  let best: number | null = null;
  options.forEach((option, candidate) => {
    if (option.disabled === true) return;
    if (best === null || Math.abs(candidate - index) < Math.abs(best - index)) best = candidate;
  });
  return best;
}

interface DurationCardProps {
  readonly option: DurationCarouselOption;
  readonly index: number;
  readonly scrollX: Animated.Value;
  /** The card in the centre: sets the type scale (the box itself eases with the scroll). */
  readonly focused: boolean;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}

/**
 * `1219:4271` (focused) and `1219:4394` (the rest) — one card. Its box, level and edge ease between
 * the two as the strip passes; the type scale switches as it crosses the centre.
 */
function DurationCard({
  option,
  index,
  scrollX,
  focused,
  selected,
  onPress,
  testID,
}: DurationCardProps) {
  // 1 while this card is centred, 0 a pitch away: everything below eases with it.
  const focus = scrollX.interpolate({
    inputRange: [(index - 1) * PITCH, index * PITCH, (index + 1) * PITCH],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const idleOpacity = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const boxWidth = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [CARD_WIDTH, FOCUS_WIDTH],
  });
  const boxHeight = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [CARD_HEIGHT, FOCUS_HEIGHT],
  });
  // The surface is a circle stretched to the card's width + 10 each side: an exact ellipse.
  const surfaceScale = Animated.divide(
    Animated.add(boxWidth, SURFACE_OVERHANG * 2),
    SURFACE_HEIGHT,
  );
  const levelHeight = Animated.multiply(boxHeight, durationLevelShare(option.minutes));
  const disabled = option.disabled === true;
  const label = durationCardLabel(option.minutes);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={
        option.strikePrice === undefined
          ? `${label}, ${option.price}`
          : `${label}, ${option.price}, was ${option.strikePrice}`
      }
      style={disabled ? styles.disabled : null}
      testID={testID}
    >
      <Animated.View style={{ width: boxWidth, height: boxHeight }}>
        <Animated.View style={[styles.face, styles.faceIdle, { opacity: idleOpacity }]} />
        <Animated.View style={[styles.face, styles.faceFocused, { opacity: focus }]} />
        <View style={styles.clip}>
          <Level
            height={levelHeight}
            surfaceScale={surfaceScale}
            idleOpacity={idleOpacity}
            focus={focus}
          />
          <View style={focused ? styles.contentFocused : styles.contentIdle}>
            <Text variant={focused ? 'displayMid' : 'titleNav'} color="textPrimary" align="center">
              {label}
            </Text>
            <View style={styles.price}>
              <Text variant={focused ? 'emphasis' : 'bodyStrong'} color="textPrimary">
                {option.price}
              </Text>
              {option.strikePrice === undefined ? null : (
                <Text variant="bodyStrong" color="textPrimary" style={styles.strike}>
                  {option.strikePrice}
                </Text>
              )}
            </View>
          </View>
        </View>
        <Animated.View pointerEvents="none" style={[styles.edge, { opacity: focus }]} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * `1219:4272` — the level: a body of liquid with a flat ellipse (`Surface`, 18 tall, 10 wider than
 * the card each side) lying across its top, its upper half above the body's edge. Both tints are
 * drawn and cross-faded, so the colour eases with the box.
 */
function Level({
  height,
  surfaceScale,
  idleOpacity,
  focus,
}: {
  readonly height: Animated.AnimatedMultiplication<number>;
  readonly surfaceScale: Animated.AnimatedDivision<number>;
  readonly idleOpacity: Animated.AnimatedInterpolation<number>;
  readonly focus: Animated.AnimatedInterpolation<number>;
}) {
  const idle = lightTheme.gradients.durationLevel;
  const focused = lightTheme.gradients.durationLevelFocused;
  return (
    <View style={styles.level} pointerEvents="none">
      <Animated.View style={{ height }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: idleOpacity }]}>
          <LinearGradient colors={idle.colors} locations={idle.locations} style={styles.body} />
          <View style={styles.surfaceRow}>
            <Animated.View
              style={[
                styles.surface,
                { backgroundColor: idle.colors[2], transform: [{ scaleX: surfaceScale }] },
              ]}
            />
          </View>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: focus }]}>
          <LinearGradient
            colors={focused.colors}
            locations={focused.locations}
            style={styles.body}
          />
          <View style={styles.surfaceRow}>
            <Animated.View
              style={[
                styles.surface,
                { backgroundColor: focused.colors[1], transform: [{ scaleX: surfaceScale }] },
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** `1219:4396` — 150 minutes fills 108 of 130; 30 fills 22: minutes / 180 of the card. */
const LEVEL_MINUTES = 180;

/** `1217:6619` — idle cards 100 × 130, the focused 128 × 160, 12 apart. */
const CARD_WIDTH = 100;
const CARD_HEIGHT = 130;
const FOCUS_WIDTH = 128;
const FOCUS_HEIGHT = 160;
const GAP = lightTheme.space.md;
/** One card to the next, between the idle ones: also the snap interval. */
const PITCH = CARD_WIDTH + GAP;
/** `1217:6618` — the track, the cards centred in it. */
const TRACK_HEIGHT = 176;
/** `1219:4398` — the surface ellipse: 18 tall, 10 past each side, its upper half above the body. */
const SURFACE_HEIGHT = 18;
const SURFACE_OVERHANG = 10;
const SURFACE_HALF = SURFACE_HEIGHT / 2;

const styles = StyleSheet.create({
  /** `1225:2211` — the strip, then 12, then the dots. */
  root: { gap: lightTheme.space.md, alignItems: 'center' },
  track: { alignItems: 'center', gap: GAP },
  disabled: { opacity: 0.4 },
  /** The card's white ground and its lift, apart from the clip so the shadow is not cut. */
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  faceIdle: { boxShadow: innerShadows.elevation1 },
  faceFocused: { boxShadow: innerShadows.elevation2 },
  clip: {
    ...StyleSheet.absoluteFill,
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `1219:4271` — the focused card's 1pt edge, drawn over the level. */
  edge: {
    ...StyleSheet.absoluteFill,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderDurationFocus,
  },
  level: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  surfaceRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SURFACE_HEIGHT,
    alignItems: 'center',
  },
  surface: { width: SURFACE_HEIGHT, height: SURFACE_HEIGHT, borderRadius: SURFACE_HALF },
  body: { position: 'absolute', top: SURFACE_HALF, left: 0, right: 0, bottom: 0 },
  /** `1219:4394` — p 8, 4 between the label and the price. */
  contentIdle: {
    alignItems: 'center',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.sm,
  },
  /** `1219:4271` — px 8, py 12, 8 between the label and the price. */
  contentFocused: {
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.md,
  },
  /** `1219:4402` — the price and the struck original, 8 apart on one baseline. */
  price: { flexDirection: 'row', alignItems: 'baseline', gap: lightTheme.space.sm },
  /** `1219:4404` — black at half strength, struck through. */
  strike: { textDecorationLine: 'line-through', opacity: 0.5 },
  /** `1217:6640` — 4pt dots, 4 apart; the one in the centre is a 12 × 4 bar in ink. */
  dots: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: lightTheme.colors.textDisabledSoft,
  },
  dotActive: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: lightTheme.colors.textPrimary,
  },
});
