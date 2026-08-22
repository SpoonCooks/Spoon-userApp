import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { ratingBorder, ratingFill } from '@ui/tokens/semantic';

/**
 * The rating control — Figma `143:252` (Completion) with `119:2885` as the 9 × 9 state chart.
 *
 * The reference frame settles three things:
 *  1. it is NOT stars — it is a row of 9 numeric chips;
 *  2. half-ratings ARE user-selectable: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5;
 *  3. colour is a FUNCTION OF THE VALUE. At rest each chip is WHITE with a coloured 1pt border
 *     that walks a ramp (`143:277` `#FFEF99` → `143:259` `#CFFF04`); selection fills it.
 *
 * Geometry, RE-READ this pass against the current file's two live instances — Home
 * `336:4240` and the Service-flow rating card `319:3296`. They agree on everything but the lift:
 *
 *   scale   nine EQUAL tracks (`grid-cols-[repeat(9,minmax(0,1fr))]`) at a **6pt** gutter, in a
 *           52pt row padded px 4 / py 6, so each chip is 40 tall at a 5pt radius
 *   numeral Livvic Black 12/16 at **−0.3**, uppercased
 *   border  the value ramp, `#FFEF99` → `#CFFF04`; selection fills the chip with it
 *   lift    Home `0 2 2 rgba(0,0,0,0.06)`; the Service card `0 0 2 rgba(0,0,0,0.15)` — the only
 *           difference between the two, carried as the `lift` prop rather than averaged away
 *
 * The "5+" row (`336:4236`) is a 40pt chip at a **5pt** radius with a `#CFFF04` hairline and NO
 * shadow, 12pt from a Livvic **Medium 10/15** line at 70 % black, in a 48pt row padded the same
 * px 4 / py 6.
 *
 * TWO MODES (task §13). `5+` is SELECTABLE, and choosing it is not a tenth point on the scale:
 * `383:765` draws the card with the chip FILLED `#CFFF04`, the line replaced by "Thank you for
 * appreciating the cook's efforts!", and the nine-chip scale gone entirely, while `319:3284`
 * draws a numeric choice with the scale intact. Reading the row as decoration — which the
 * previous pass did — left the special state unreachable.
 *
 * RESPONSIVENESS: the chips are `flex: 1`, so nine of them plus eight 6pt gutters fill whatever
 * column they are given — at the reference 296pt inner width each lands on 27.55, which is what
 * `336:4241` measures. Type and height never scale.
 *
 * Controlled component: `value` + `onChange`. No submission, no persistence, no network. The
 * rating endpoint exists (`PUT /v1/bookings/:id/rating`) but calling it is the SCREEN's job, so
 * that one place owns the "what does the server accept" question — see `RATING_EXCEPTIONAL`.
 */

export const RATING_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export type RatingValue = (typeof RATING_VALUES)[number];

/**
 * `383:765` — the SPECIAL outcome, and deliberately not the number 5.
 *
 * The file draws two finished states of the same card: `319:3284` keeps the nine-chip scale with
 * the chosen numeral filled, and `383:765` replaces the whole scale with a FILLED `5+` chip and
 * "Thank you for appreciating the cook's efforts!". They are different states, so they get
 * different values — collapsing `5+` onto `5` here would make the two indistinguishable at the
 * one place that still knows which the customer picked.
 *
 * `PUT /v1/bookings/:id/rating` takes `stars` on a 1..5 half-step scale and has no way to carry
 * this, which is recorded as a BACKEND_GAP rather than papered over: nothing in this app converts
 * `exceptional` to `5` silently, and the submit path refuses instead of guessing.
 */
export const RATING_EXCEPTIONAL = 'exceptional';

/** What the customer can choose: one of the nine numerals, or the `5+` appreciation. */
export type RatingSelection = RatingValue | typeof RATING_EXCEPTIONAL;

/** Narrows a selection to the numeric scale the rating endpoint accepts. */
export function isNumericRating(value: RatingSelection | null): value is RatingValue {
  return value !== null && value !== RATING_EXCEPTIONAL;
}

/** `143:277` … `143:259` — one ramp, read at rest as a border and on selection as a fill. */
function rampFor(value: RatingValue): { border: string; fill: string } {
  if (value >= 5) return { border: ratingBorder.highest, fill: ratingFill.highest };
  if (value >= 4) return { border: ratingBorder.high, fill: ratingFill.high };
  if (value >= 3) return { border: ratingBorder.mid, fill: ratingFill.mid };
  if (value >= 2) return { border: ratingBorder.low, fill: ratingFill.low };
  return { border: ratingBorder.lowest, fill: ratingFill.lowest };
}

/** `336:4240` / `319:3296` — the drawn lifts. Averaging them would misdraw both. */
export type RatingLift = 'soft' | 'ring';

export interface RatingWidgetProps {
  readonly value: RatingSelection | null;
  readonly onChange: (value: RatingSelection) => void;
  /**
   * `336:4236` — the lime `5+` row above the scale.
   *
   * It is a CONTROL, not a legend. `383:765` draws it filled with the thank-you line and no scale
   * at all, which only exists if the chip can be chosen; the earlier reading of it as decoration
   * left `5+` unreachable and is what §13 was raised against.
   */
  readonly showExceptionalPrompt?: boolean;
  readonly promptText?: string;
  /** `383:765` — the copy the row carries ONCE `5+` is the selection. */
  readonly appreciationText?: string;
  /** `336:4240` `soft` = `0 2 2 rgba(0,0,0,0.06)`; `319:3296` `ring` = `0 0 2 rgba(0,0,0,0.15)`. */
  readonly lift?: RatingLift;
  /**
   * `319:3217` — Completion's SUBMITTED state keeps the "5+" legend and drops the scale entirely,
   * because the value is already in. Hiding it is a rendering decision made by the screen from
   * server state, never by this component.
   */
  readonly showScale?: boolean;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

export function RatingWidget({
  value,
  onChange,
  showExceptionalPrompt = false,
  promptText = 'Reward the cook if the service exceeded your expectations to keep them motivated!',
  appreciationText = 'Thank you for appreciating the cook’s efforts!',
  lift = 'soft',
  showScale = true,
  disabled = false,
  accessibilityLabel = 'Rate this service',
  testID = 'rating-widget',
}: RatingWidgetProps) {
  const exceptional = value === RATING_EXCEPTIONAL;

  return (
    <View style={styles.container} testID={testID}>
      {showExceptionalPrompt ? (
        <Pressable
          onPress={() => onChange(RATING_EXCEPTIONAL)}
          disabled={disabled}
          accessibilityRole="radio"
          accessibilityLabel="5 plus — exceptional service"
          accessibilityState={{ selected: exceptional, disabled, checked: exceptional }}
          style={({ pressed }) => [styles.prompt, pressed && !disabled ? styles.pressed : null]}
          testID={`${testID}-prompt`}
        >
          {/* `383:765` — chosen, the chip FILLS with the top of the ramp; at rest it is white. */}
          <View
            style={[styles.plusChip, exceptional ? styles.plusChipSelected : null]}
            testID={`${testID}-exceptional`}
          >
            <Text variant="ratingPlus" color="textPrimary" align="center">
              5+
            </Text>
          </View>
          <Text variant="captionMedium" color="textSecondary" style={styles.promptText}>
            {exceptional ? appreciationText : promptText}
          </Text>
        </Pressable>
      ) : null}

      {/*
        `383:765` replaces the scale entirely with the appreciation row — the two never appear
        together, because `5+` is not a tenth chip on the same scale but the state that supersedes
        it. A numeric choice keeps the row above the scale so the customer can still reach `5+`.
      */}
      {showScale && !exceptional ? (
        <View
          style={styles.scale}
          accessibilityRole="radiogroup"
          accessibilityLabel={accessibilityLabel}
        >
          {RATING_VALUES.map((option) => {
            const selected = value === option;
            const ramp = rampFor(option);

            return (
              <Pressable
                key={option}
                onPress={() => onChange(option)}
                disabled={disabled}
                testID={`${testID}-${option}`}
                accessibilityRole="radio"
                accessibilityLabel={`${option} out of 5`}
                accessibilityState={{ selected, disabled, checked: selected }}
                // `hitSlop` restores the 44pt target; the chip stays 40 tall as drawn (task §16).
                hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
                style={({ pressed }) => [
                  styles.chip,
                  lift === 'ring' ? styles.liftRing : styles.liftSoft,
                  {
                    borderColor: ramp.border,
                    backgroundColor: selected ? ramp.fill : lightTheme.colors.surface,
                  },
                  disabled ? styles.disabled : null,
                  pressed && !disabled ? styles.pressed : null,
                ]}
              >
                <Text
                  variant="ratingValue"
                  color={disabled ? 'textDisabled' : 'textPrimary'}
                  align="center"
                  numberOfLines={1}
                >
                  {String(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** `336:4235` — the legend row and the scale row sit 4pt apart, each padded px 4 / py 6. */
const ROW_PADDING_HORIZONTAL = 4;
const ROW_PADDING_VERTICAL = 6;

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', gap: 4 },
  /** `336:4236` — a 48pt row: the chip and its line, 12pt apart. */
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    paddingHorizontal: ROW_PADDING_HORIZONTAL,
    paddingVertical: ROW_PADDING_VERTICAL,
  },
  promptText: { flex: 1, minWidth: 0 },
  /** `336:4237` — 40 wide, full row height, r5, a `#CFFF04` hairline and NO lift. */
  plusChip: {
    width: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r5,
    borderWidth: lightTheme.stroke.thin,
    borderColor: ratingBorder.highest,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `383:765` — selected, it fills with the same `#CFFF04` the `5` chip takes. */
  plusChipSelected: { backgroundColor: ratingFill.highest },
  /** `336:4240` — a 52pt row of nine equal tracks at a 6pt gutter. */
  scale: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    height: 52,
    paddingHorizontal: ROW_PADDING_HORIZONTAL,
    paddingVertical: ROW_PADDING_VERTICAL,
  },
  /** `336:4241` — equal tracks, 40 tall at a 5pt radius. */
  chip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r5,
    borderWidth: lightTheme.stroke.thin,
    shadowColor: lightTheme.colors.textPrimary,
  },
  liftSoft: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  liftRing: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
});
