import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { keyframedStyle } from '@ui/motion/keyframes';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { VISIT_RATING_PLUS, ratingTier } from '../../data/rating';
import type { VisitRatingValue } from '../../data/rating';
import { RATING_ART } from './assets';
import { PLUS_IDLE, PLUS_PICKED, starPops } from './ratingMotion';

/**
 * The rate card's input row — `1501:6661` (idle) / `1501:6759` (rated): five 42pt stars at a 6pt
 * gap, a 1.5 × 30 rule at black 12 %, then the 56pt `5+` burst.
 *
 * Each star frame draws the 31 × 30 star vector inset 13.87 % / 12.49 % (`inset-[12.49%_13.87%_
 * 17.91%_13.87%]`), i.e. at (5.83, 5.25); a half star (`1501:6799`) is its own 42pt frame. Two
 * empty tints exist: `#F1EEE3` while idle or at 4–5, `#F9F5E1` at 1–3.5 (`1501:7424`).
 *
 * The `5+` burst has three looks: idle `1501:6683` (solid lime, black label), a numeric score
 * picked `1501:6805` (lime at 55 %, label at 60 %), 5+ picked `1501:7160` (outlined). At 1–3.5 the
 * whole button also drops to 35 % (`1501:7426`).
 *
 * Motion (`ratingMotion.ts`), on the card's `clock`: on the first look the 5+ button wiggles
 * every loop; once rated the five stars pop in turn, and picking 5+ jolts the button.
 *
 * Input, per the idle caption "Single tap for 0.5. Fast double tap for full star": a tap on star
 * N picks N − 0.5, a second tap on the same star within `DOUBLE_TAP_MS` upgrades it to N.
 */

const DOUBLE_TAP_MS = 300;
const STAR_SIZE = 42;
/** `inset-[12.49%_13.87%…]` of a 42pt frame. */
const STAR_INSET_LEFT = 42 * 0.1387;
const STAR_INSET_TOP = 42 * 0.1249;
const STARS = [1, 2, 3, 4, 5] as const;

type StarFill = 'full' | 'half' | 'empty';

function starFill(index: number, value: VisitRatingValue | null): StarFill {
  if (value === null) return 'empty';
  if (value === VISIT_RATING_PLUS) return 'full';
  if (value >= index) return 'full';
  if (value >= index - 0.5) return 'half';
  return 'empty';
}

function toRating(score: number): VisitRatingValue {
  return score as VisitRatingValue;
}

export interface RatingStarsProps {
  readonly value: VisitRatingValue | null;
  readonly onChange: (value: VisitRatingValue) => void;
  /**
   * The last star tap, owned by the CARD: the first tap swaps the idle layout for the rated one,
   * which remounts this row, and the double-tap window has to survive that.
   */
  readonly tapRef?: MutableRefObject<StarTap | null>;
  /** The first look's loop while idle, the entrance once rated. */
  readonly clock?: Animated.Value | undefined;
  readonly testID: string;
}

export interface StarTap {
  readonly index: number;
  readonly at: number;
}

export function RatingStars({ value, onChange, tapRef, clock, testID }: RatingStarsProps) {
  const ownTap = useRef<StarTap | null>(null);
  const lastTap = tapRef ?? ownTap;
  const tier = ratingTier(value);
  const low = tier === 'belowPar' || tier === 'disappointing' || tier === 'veryPoor';

  /** `now` is the press event's own timestamp, so the double-tap window is measured on taps. */
  const onStar = (index: number, now: number) => {
    const last = lastTap.current;
    if (last !== null && last.index === index && now - last.at < DOUBLE_TAP_MS) {
      lastTap.current = null;
      onChange(toRating(index));
      return;
    }
    lastTap.current = { index, at: now };
    onChange(toRating(index - 0.5));
  };

  const burst =
    tier === 'idle'
      ? RATING_ART.plusBurstIdle
      : tier === 'magic'
        ? RATING_ART.plusBurstActive
        : RATING_ART.plusBurstMuted;
  const plusInk = tier === 'idle' || tier === 'magic' ? 'textPrimary' : 'textSecondarySoft';
  const pops = tier === 'idle' ? null : starPops(tier);
  const plusMotion = tier === 'idle' ? PLUS_IDLE : tier === 'magic' ? PLUS_PICKED : null;

  return (
    <View style={styles.row} accessibilityRole="radiogroup" testID={testID}>
      {STARS.map((index) => {
        const fill = starFill(index, value);
        const empty = low ? RATING_ART.starEmptyLow : RATING_ART.starEmptyHigh;
        const half = low ? RATING_ART.starHalfLow : RATING_ART.starHalfHigh;
        return (
          <Pressable
            key={index}
            onPress={(event) => onStar(index, event.nativeEvent.timestamp)}
            accessibilityRole="radio"
            accessibilityLabel={`${index} star`}
            accessibilityState={{ selected: fill !== 'empty' }}
            style={styles.star}
            testID={`${testID}-star-${index}`}
          >
            <Animated.View
              style={[
                styles.starFrame,
                clock && pops?.[index - 1] ? keyframedStyle(clock, pops[index - 1]!) : null,
              ]}
            >
              {fill === 'half' ? (
                <Image source={half} style={styles.starHalf} />
              ) : (
                <Image
                  source={fill === 'full' ? RATING_ART.starFull : empty}
                  style={styles.starGlyph}
                />
              )}
            </Animated.View>
          </Pressable>
        );
      })}
      <View style={styles.divider} />
      <Pressable
        onPress={() => onChange(VISIT_RATING_PLUS)}
        accessibilityRole="radio"
        accessibilityLabel="5 plus — went above and beyond"
        accessibilityState={{ selected: tier === 'magic' }}
        style={[styles.plus, low ? styles.plusDimmed : null]}
        testID={`${testID}-plus`}
      >
        <Animated.View
          style={[styles.plusFace, clock && plusMotion ? keyframedStyle(clock, plusMotion) : null]}
        >
          <Image
            source={burst}
            style={tier === 'magic' ? styles.plusBurstActive : styles.plusBurst}
          />
          <Text variant="spoonButton" color={plusInk} align="center">
            5+
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `1501:6661` — 6pt gap, centred. */
  row: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.s6 },
  star: { width: STAR_SIZE, height: STAR_SIZE },
  /** The star's 42pt frame, scaled about its centre as it pops. */
  starFrame: { width: STAR_SIZE, height: STAR_SIZE },
  /** The 31 × 30 export of the star vector, at its inset inside the 42pt frame. */
  starGlyph: {
    position: 'absolute',
    left: STAR_INSET_LEFT,
    top: STAR_INSET_TOP,
    width: 31,
    height: 30,
  },
  starHalf: { width: STAR_SIZE, height: STAR_SIZE },
  /** `1501:6667` — 1.5 × 30 at black 12 %. */
  divider: {
    width: 1.5,
    height: 30,
    backgroundColor: lightTheme.colors.surfaceRatingDivider,
  },
  /** `1501:6682` — 56pt; the label centred on it. */
  plus: { width: 56, height: 56 },
  /** The burst and label together, turned and scaled about the button's centre. */
  plusFace: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  /** `1501:7426` — 35 % on a 1–3.5 score. */
  plusDimmed: { opacity: 0.35 },
  /** `1501:6683` — the burst box (54.6 × 56, exported 55 × 56) at the button's origin. */
  plusBurst: { position: 'absolute', left: 0, top: 0, width: 55, height: 56 },
  /** `1501:7160` — the outlined burst's stroke sits ~1pt outside the box on the left. */
  plusBurstActive: { position: 'absolute', left: -1, top: 0, width: 57, height: 56 },
});
