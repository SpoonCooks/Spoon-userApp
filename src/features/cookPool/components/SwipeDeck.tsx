import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import {
  CHEVRON_LEFT,
  CHEVRON_RIGHT,
  CLOSE_ICON,
  GLOW_ADD,
  GLOW_SKIP,
  HEART_FILL,
  HEART_OUTLINE,
  HEART_SMALL,
  RESTART_ICON,
} from '../art';
import type { CookProfile } from '../types';
import { DeckCard } from './DeckCard';

/**
 * The swipe deck — Figma `755:2337` (idle), `848:6318` (dragged toward skip) and `848:6611`
 * (dragged toward add), with the design's swipe rules:
 *
 *  - left skips the cook, right adds them to the pool; Skip and Add do the same, with the same
 *    fly-off;
 *  - a drag commits past 35 % of the screen's width, or on a flick faster than 600 pt/s;
 *    otherwise the card springs back in about 350 ms with a slight bounce;
 *  - the card tilts with the drag, up to 12°, and flies off in 250 ms;
 *  - while dragged, the card takes the side's tint, edge and indicator, the matching button and
 *    edge tab light up, and the next cook's card shows beneath;
 *  - Undo skip flies the last skipped card back in from the left, left to right;
 *  - the cards loop (`deck.ts`): the cards behind are always the next ones round;
 *  - the card scrolls down through its menu, each menu row sideways, without moving the card.
 */
export type SwipeDirection = 'skip' | 'add';

export interface SwipeDeckProps {
  /** The cards still to decide, top first; after the last, the first again. */
  readonly cards: readonly CookProfile[];
  /** Counts the deck's moves: a cook coming round again is dealt as a new card. */
  readonly turn: number;
  /** The top card's cook, when it should fly back in from the left (an undone skip). */
  readonly enteringId: string | null;
  readonly canUndo: boolean;
  readonly onSwiped: (cookId: string, direction: SwipeDirection) => void;
  readonly onUndo: () => void;
  readonly testID?: string;
}

export function SwipeDeck({
  cards,
  turn,
  enteringId,
  canUndo,
  onSwiped,
  onUndo,
  testID = 'swipe-deck',
}: SwipeDeckProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const topRef = useRef<TopCardHandle>(null);
  /** The top card's horizontal offset, for everything outside the card that follows it. */
  const drag = useSharedValue(0);
  const feedbackAt = screenWidth * COMMIT_FRACTION * FEEDBACK_FRACTION;
  const skipProgress = useDerivedValue(() =>
    interpolate(drag.get(), [-feedbackAt, -FEEDBACK_START], [1, 0], Extrapolation.CLAMP),
  );
  const addProgress = useDerivedValue(() =>
    interpolate(drag.get(), [FEEDBACK_START, feedbackAt], [0, 1], Extrapolation.CLAMP),
  );

  const top = cards[0];
  /** In a loop there is always a next card — the top one again, when it is the last left. */
  const next = cards[1] ?? top;

  /* `848:6325` / `848:6327` — the dragged side's tab widens to 28; the other fades to 25 %. */
  const skipTabStyle = useAnimatedStyle(() => ({
    width: TAB_WIDTH + TAB_GROWTH * skipProgress.get(),
    opacity: 1 - TAB_FADE * addProgress.get(),
  }));
  const skipTabActiveStyle = useAnimatedStyle(() => ({ opacity: skipProgress.get() }));
  const addTabStyle = useAnimatedStyle(() => ({
    width: TAB_WIDTH + TAB_GROWTH * addProgress.get(),
    opacity: 1 - TAB_FADE * skipProgress.get(),
  }));
  /* `848:6597` / `848:6601` — Skip greys; Add loses its gold, or fills its heart. */
  const skipActiveStyle = useAnimatedStyle(() => ({ opacity: skipProgress.get() }));
  // The grey is translucent and borderless: the idle edge fades out under it rather than tinting it.
  const skipIdleStyle = useAnimatedStyle(() => ({ opacity: 1 - skipProgress.get() }));
  const addHollowStyle = useAnimatedStyle(() => ({ opacity: skipProgress.get() }));
  const heartFillStyle = useAnimatedStyle(() => ({ opacity: addProgress.get() }));
  const heartOutlineStyle = useAnimatedStyle(() => ({ opacity: 1 - addProgress.get() }));
  /* `755:2338` → `848:6323` / `848:6616`, `755:2339` → `848:6324` / `848:6617`. */
  const glowSkipStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity(SKIP_GLOW.opacity, skipProgress.get(), addProgress.get()),
  }));
  const glowAddStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity(ADD_GLOW.opacity, skipProgress.get(), addProgress.get()),
  }));

  const cardWidth = area === null ? 0 : area.width - CARD_INSET * 2;

  return (
    <View style={styles.content}>
      <View
        style={styles.swipes}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setArea({ width, height });
        }}
        testID={testID}
      >
        {area === null ? null : (
          <>
            {/* `755:2338` / `755:2339` — two blurred glows past the screen's edges. */}
            <Animated.Image
              source={GLOW_SKIP}
              resizeMode="stretch"
              style={[styles.glowSkip, glowFrame(area, SKIP_GLOW), glowSkipStyle]}
            />
            <Animated.Image
              source={GLOW_ADD}
              resizeMode="stretch"
              style={[
                styles.glowAdd,
                glowFrame(area, ADD_GLOW),
                { left: area.width + GLOW_ADD_OVERHANG - ADD_GLOW.width / 2 },
                glowAddStyle,
              ]}
            />
            {/* The deck loops, so it is empty only when no cook has ever served the household. */}
            {top === undefined ? null : (
              <>
                <Animated.View style={[styles.tab, styles.tabSkip, skipTabStyle]}>
                  <View style={[StyleSheet.absoluteFill, styles.tabSkipIdle]} />
                  <Animated.View
                    style={[StyleSheet.absoluteFill, styles.tabSkipActive, skipTabActiveStyle]}
                  />
                  <Image source={CHEVRON_LEFT} style={styles.tabChevron} />
                </Animated.View>
                <Animated.View style={[styles.tab, styles.tabAdd, addTabStyle]}>
                  <Image source={CHEVRON_RIGHT} style={styles.tabChevron} />
                </Animated.View>
                {/* `755:2345` / `755:2346` — two cards fanned behind; the loop never runs out. */}
                <View
                  style={[
                    styles.behind,
                    styles.behindTwo,
                    behindFrame(area, cardWidth, BEHIND_TWO),
                  ]}
                />
                <View
                  style={[
                    styles.behind,
                    styles.behindOne,
                    behindFrame(area, cardWidth, BEHIND_ONE),
                  ]}
                />
                {next === undefined ? null : (
                  <View style={[styles.frame, { width: cardWidth }]} pointerEvents="none">
                    <DeckCard profile={next} />
                  </View>
                )}
                <TopCard
                  key={`${top.cookId}:${turn}`}
                  ref={topRef}
                  profile={top}
                  entering={enteringId === top.cookId}
                  drag={drag}
                  width={cardWidth}
                  screenWidth={screenWidth}
                  onSwiped={onSwiped}
                />
              </>
            )}
          </>
        )}
      </View>

      {/* `755:2477` — Skip, Add and Undo skip: 32 apart, foot-aligned, labels 6 below. */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => topRef.current?.fly('skip')}
          disabled={top === undefined}
          accessibilityRole="button"
          accessibilityLabel="Skip"
          style={styles.action}
          testID={`${testID}-skip`}
        >
          <View style={styles.round48}>
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.roundIdle, styles.radius48, skipIdleStyle]}
            />
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.skipActive, styles.radius48, skipActiveStyle]}
            />
            <Image source={CLOSE_ICON} style={styles.icon24} />
          </View>
          <Text variant="microSemibold" color="textPrimary">
            Skip
          </Text>
        </Pressable>
        <Pressable
          onPress={() => topRef.current?.fly('add')}
          disabled={top === undefined}
          accessibilityRole="button"
          accessibilityLabel="Add to your Cook Pool"
          style={styles.action}
          testID={`${testID}-add`}
        >
          <View style={styles.round64}>
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.roundIdle, styles.radius64, addHollowStyle]}
            />
            <Animated.Image source={HEART_OUTLINE} style={[styles.heart, heartOutlineStyle]} />
            <Animated.Image source={HEART_FILL} style={[styles.heart, heartFillStyle]} />
          </View>
          <Text variant="microSemibold" color="textPrimary">
            Add
          </Text>
        </Pressable>
        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          accessibilityRole="button"
          accessibilityLabel="Undo skip"
          style={styles.action}
          testID={`${testID}-undo`}
        >
          <View style={styles.round48}>
            <View style={[StyleSheet.absoluteFill, styles.roundIdle, styles.radius48]} />
            {/* `755:2480` — a 20pt box clipping the 24pt icon frame, so the glyph draws at 24. */}
            <Image source={RESTART_ICON} style={styles.icon24} />
          </View>
          <Text variant="microSemibold" color="textPrimary">
            Undo skip
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface TopCardHandle {
  readonly fly: (direction: SwipeDirection) => void;
}

interface TopCardProps {
  readonly profile: CookProfile;
  readonly entering: boolean;
  readonly drag: SharedValue<number>;
  readonly width: number;
  readonly screenWidth: number;
  readonly onSwiped: (cookId: string, direction: SwipeDirection) => void;
}

/** The card on top: dragged, flown off, sprung back, or flown in by Undo. */
const TopCard = forwardRef<TopCardHandle, TopCardProps>(function TopCard(
  { profile, entering, drag, width, screenWidth, onSwiped },
  ref,
) {
  const offscreen = screenWidth * OFFSCREEN_FRACTION;
  const commitAt = screenWidth * COMMIT_FRACTION;
  const feedbackAt = commitAt * FEEDBACK_FRACTION;
  const tiltAt = screenWidth / 2;
  const x = useSharedValue(entering ? -offscreen : 0);
  const y = useSharedValue(0);
  const flying = useSharedValue(false);
  /** Off while the card flies back in, so it doesn't show "Skipped" on its way. */
  const armed = useSharedValue(!entering);
  const rowGestures = useMemo(() => profile.menu.map(() => Gesture.Native()), [profile.menu]);

  /**
   * The skip's fly-off played backwards: in from the left, tilt easing out, no overshoot. It
   * starts once the card is laid out, not on mount — a card takes a few frames to draw, and a
   * fly-in started on mount is nearly over by the time it is first seen.
   */
  const flownIn = useRef(!entering);
  const onLayout = useCallback(() => {
    if (flownIn.current) return;
    flownIn.current = true;
    requestAnimationFrame(() =>
      x.set(
        withTiming(0, { duration: UNDO_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) armed.set(true);
        }),
      ),
    );
  }, [armed, x]);

  useAnimatedReaction(
    () => (armed.get() ? x.get() : 0),
    (value) => {
      drag.set(value);
    },
  );

  const finish = useCallback(
    (direction: SwipeDirection) => onSwiped(profile.cookId, direction),
    [onSwiped, profile.cookId],
  );

  const flyOff = useCallback(
    (sign: number) => {
      'worklet';
      flying.set(true);
      armed.set(true);
      x.set(
        withTiming(sign * offscreen, { duration: FLY_MS }, (finished) => {
          if (finished) scheduleOnRN(finish, sign > 0 ? 'add' : 'skip');
        }),
      );
    },
    [armed, finish, flying, offscreen, x],
  );

  useImperativeHandle(
    ref,
    () => ({
      fly: (direction) => {
        if (flying.get()) return;
        flyOff(direction === 'add' ? 1 : -1);
      },
    }),
    [flyOff, flying],
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-PAN_SLOP, PAN_SLOP])
    .failOffsetY([-PAN_SLOP, PAN_SLOP])
    .requireExternalGestureToFail(...rowGestures)
    .onUpdate((event) => {
      if (flying.get()) return;
      armed.set(true);
      x.set(event.translationX);
      y.set(event.translationY * VERTICAL_FOLLOW);
    })
    .onEnd((event) => {
      if (flying.get()) return;
      const sign = Math.sign(x.get());
      const flicked =
        Math.abs(event.velocityX) > FLICK_VELOCITY && Math.sign(event.velocityX) === sign;
      if (sign !== 0 && (Math.abs(x.get()) > commitAt || flicked)) {
        flyOff(sign);
        return;
      }
      x.set(withSpring(0, SPRING_BACK));
      y.set(withSpring(0, SPRING_BACK));
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      {
        rotate: `${interpolate(x.get(), [-tiltAt, 0, tiltAt], [-MAX_TILT, 0, MAX_TILT], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));
  const skipStyle = useAnimatedStyle(() => ({
    opacity: armed.get()
      ? interpolate(x.get(), [-feedbackAt, -FEEDBACK_START], [1, 0], Extrapolation.CLAMP)
      : 0,
  }));
  const addStyle = useAnimatedStyle(() => ({
    opacity: armed.get()
      ? interpolate(x.get(), [FEEDBACK_START, feedbackAt], [0, 1], Extrapolation.CLAMP)
      : 0,
  }));
  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(x.get()), [0, FEEDBACK_START * 2], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.frame, { width }, cardStyle]} onLayout={onLayout}>
        <DeckCard profile={profile} rowGestures={rowGestures} pillStyle={pillStyle}>
          {/* `848:6591` — the skip side's tint and edge, then its indicator. */}
          <Animated.View
            style={[styles.wash, styles.washBacking, skipStyle]}
            pointerEvents="none"
          />
          <Animated.View style={[styles.wash, styles.washSkip, skipStyle]} pointerEvents="none" />
          <Animated.View style={[styles.wash, styles.washAdd, addStyle]} pointerEvents="none" />
          <Animated.View style={[styles.indicatorSlot, skipStyle]} pointerEvents="none">
            <View style={[styles.indicator, styles.indicatorSkip]}>
              <Image source={CLOSE_ICON} style={styles.icon14} />
              <Text variant="bodyStrong" color="textPrimary">
                Skipped
              </Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.indicatorSlot, addStyle]} pointerEvents="none">
            <View style={[styles.indicator, styles.indicatorAdd]}>
              <Image source={HEART_SMALL} style={styles.icon14} />
              <Text variant="bodyStrong" color="textPrimary">
                Added to pool
              </Text>
            </View>
          </Animated.View>
        </DeckCard>
      </Animated.View>
    </GestureDetector>
  );
});

/**
 * A fanned card behind the deck, from its Figma container (`755:2345` / `755:2346`): narrower and
 * shorter than the top card by `shrink`, its centre shifted by `shift`, turned by `rotate`.
 */
function behindFrame(
  area: { width: number; height: number },
  cardWidth: number,
  spec: typeof BEHIND_ONE | typeof BEHIND_TWO,
) {
  const width = cardWidth - spec.shrink.width;
  const height = area.height - CARD_INSET_Y * 2 - spec.shrink.height;
  return {
    width,
    height,
    left: (area.width - width) / 2 + spec.shift.x,
    top: (area.height - height) / 2 + spec.shift.y,
    transform: [{ rotate: `${spec.rotate}deg` }],
  };
}

/** The swipe rules (attached spec): commit at 35 % of the width or at 600 pt/s. */
const COMMIT_FRACTION = 0.35;
const FLICK_VELOCITY = 600;
const MAX_TILT = 12;
const FLY_MS = 250;
/** A little longer than the fly-off, so the card is seen coming back the way it went. */
const UNDO_MS = 320;
/** Far enough that a tilted card clears the screen. */
const OFFSCREEN_FRACTION = 1.5;
/** ~350 ms with a slight bounce: Reanimated's spring `duration` is perceptual, ×1.5 real. */
const SPRING_BACK = { duration: 240, dampingRatio: 0.7 } as const;
/** The drag's feedback starts after this much travel and is full by 60 % of the way to commit. */
const FEEDBACK_START = 8;
const FEEDBACK_FRACTION = 0.6;
const PAN_SLOP = 10;
/** The card follows the finger up and down a little, so the drag feels held. */
const VERTICAL_FOLLOW = 0.2;

/** `755:2347` — the card is 365 of 402, 22 in from the deck's top and foot. */
const CARD_INSET = 18.5;
const CARD_INSET_Y = 22;
const TAB_WIDTH = 20;
const TAB_GROWTH = 8;
const TAB_FADE = 0.75;

/** `755:2346` — white, −3.16°, its centre 4 left and 6 down. */
const BEHIND_ONE = { shrink: { width: 16, height: 6 }, shift: { x: -4, y: 6 }, rotate: -3.16 };
/** `755:2345` — `#FFF7CC`, 4.51°, its centre 6 right and 10 down. */
const BEHIND_TWO = { shrink: { width: 28, height: 13 }, shift: { x: 6, y: 10 }, rotate: 4.51 };

/**
 * A glow: a blurred ellipse whose height is a fixed share of the deck's (the same in `755:*` and
 * `848:*`), drawn from a full-strength raster with its blur's margin on every side. Its strength
 * follows the drag: at rest, dragged toward skip, dragged toward add.
 */
interface Glow {
  readonly width: number;
  readonly ellipseShare: number;
  readonly blurMargin: number;
  readonly centre: number;
  readonly opacity: { readonly rest: number; readonly skip: number; readonly add: number };
}

/** `755:2338` — grey, 300 wide, 83 % of the deck's height, centred 40 left of it, 47 % down. */
const SKIP_GLOW: Glow = {
  width: 480,
  ellipseShare: 0.8268,
  blurMargin: 90,
  centre: 0.4724,
  opacity: { rest: 0.05, skip: 0.16, add: 0.02 },
};
/** `755:2339` — gold, 340 wide, 91 % of the deck's height, centred 18 past its edge, 45 % down. */
const ADD_GLOW: Glow = {
  width: 560,
  ellipseShare: 0.9055,
  blurMargin: 110,
  centre: 0.4528,
  opacity: { rest: 0.45, skip: 0.12, add: 0.8 },
};
const GLOW_ADD_OVERHANG = 18;

function glowFrame(area: { readonly height: number }, glow: Glow) {
  const height = area.height * glow.ellipseShare + glow.blurMargin * 2;
  return { width: glow.width, height, top: area.height * glow.centre - height / 2 };
}

function glowOpacity(opacity: Glow['opacity'], skip: number, add: number) {
  'worklet';
  return opacity.rest + (opacity.skip - opacity.rest) * skip + (opacity.add - opacity.rest) * add;
}

const styles = StyleSheet.create({
  /** `755:2336` — py 16, 16 between the deck and the buttons. */
  content: {
    flex: 1,
    alignItems: 'center',
    gap: lightTheme.space.lg,
    paddingVertical: lightTheme.space.lg,
  },
  swipes: { flex: 1, alignSelf: 'stretch' },
  glowSkip: { position: 'absolute', left: -40 - SKIP_GLOW.width / 2 },
  glowAdd: { position: 'absolute' },
  /** `755:2340` / `755:2342` — 20×72, centred on the deck's height. */
  tab: {
    position: 'absolute',
    top: '50%',
    height: 72,
    marginTop: -36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabSkip: { left: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  tabSkipIdle: { backgroundColor: lightTheme.colors.surfaceSkipTab },
  tabSkipActive: { backgroundColor: lightTheme.colors.surfaceSkipTabActive },
  tabAdd: {
    right: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: lightTheme.colors.surfaceBrand,
  },
  tabChevron: { width: 16, height: 16 },
  behind: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: lightTheme.colors.borderAccent,
    borderRadius: lightTheme.radius.lg,
    boxShadow: innerShadows.elevation1,
  },
  behindOne: { backgroundColor: lightTheme.colors.surface },
  behindTwo: { backgroundColor: lightTheme.colors.surfaceAccent },
  frame: { position: 'absolute', top: CARD_INSET_Y, bottom: CARD_INSET_Y, left: CARD_INSET },
  /** `848:6591` — over the card's own edge: a 2pt edge and a wash in the side's colour. */
  wash: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: 2,
    borderRadius: lightTheme.radius.md,
  },
  /**
   * The skip edge is translucent and REPLACES the card's `#FFEF99` one in the frame, so it reads
   * grey over white, never olive over yellow: an opaque white ring goes under it first.
   */
  washBacking: { borderColor: lightTheme.colors.surface },
  washSkip: {
    borderColor: lightTheme.colors.borderSkip,
    backgroundColor: lightTheme.colors.surfaceSkipWash,
  },
  /** `848:6611` — gold at 12 %, edged in gold. */
  washAdd: {
    borderColor: lightTheme.colors.surfaceBrand,
    backgroundColor: lightTheme.colors.surfaceAddWash,
  },
  /** `848:6592` — 11.5 above the card's foot, centred. */
  indicatorSlot: { position: 'absolute', left: 0, right: 0, bottom: 11.5, alignItems: 'center' },
  /** pl 10 / pr 12 / py 5, 4 between the glyph and the label, `Elevation/1`. */
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingLeft: lightTheme.space.s10,
    paddingRight: lightTheme.space.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: lightTheme.radius.pill,
    boxShadow: innerShadows.elevation1,
  },
  indicatorSkip: {
    borderColor: lightTheme.colors.borderAccent,
    backgroundColor: lightTheme.colors.surface,
  },
  indicatorAdd: {
    borderColor: lightTheme.colors.surfaceBrand,
    backgroundColor: lightTheme.colors.surfaceBrand,
  },
  icon14: { width: 14, height: 14 },
  actions: { flexDirection: 'row', alignItems: 'flex-end', gap: lightTheme.space.xxl },
  action: { alignItems: 'center', gap: lightTheme.space.s6 },
  round48: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  /** `755:2483` — the 64pt gold Add button. */
  round64: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceBrand,
  },
  radius48: { borderRadius: 24 },
  radius64: { borderRadius: 32 },
  /** `755:2487` — white inside a 1.5pt `#FFEF99` edge. */
  roundIdle: {
    borderWidth: 1.5,
    borderColor: lightTheme.colors.borderAccent,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `848:6597` — `#00000040`, no edge. */
  skipActive: { backgroundColor: lightTheme.colors.surfaceDisabledStrong },
  heart: { position: 'absolute', width: 32, height: 32 },
  icon24: { width: 24, height: 24 },
});
