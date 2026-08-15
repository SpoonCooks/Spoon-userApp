import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

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
 * Geometry, verbatim: chips are 23 × 40 at a 5pt radius with `0 2 2 rgba(0,0,0,0.06)` and a
 * Livvic Black 12/16 −0.35 numeral. The "5+" row above (`143:253`) is a WIDER 42 × 40 chip at a
 * 6pt radius with `0 2 10 rgba(0,0,0,0.07)`, a Livvic Black 14/20 −0.35 label and a Livvic
 * Regular 9/13.5 caption beside it — it is a legend, not a tenth selectable value.
 *
 * RESPONSIVENESS: nine 23pt chips plus eight 9pt gutters need 279pt. On a 320dp phone the column
 * is ~238pt, so the GUTTER collapses toward a 3pt floor and the chips keep their size and type —
 * the same rule the Home duration matrix follows. Nothing is scaled.
 *
 * Controlled component: `value` + `onChange`. No submission, no persistence, no network — there
 * is no rating endpoint and none is invented here.
 */

export const RATING_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export type RatingValue = (typeof RATING_VALUES)[number];

/** `143:277` … `143:259` — one ramp, read at rest as a border and on selection as a fill. */
function rampFor(value: RatingValue): { border: string; fill: string } {
  if (value >= 5) return { border: ratingBorder.highest, fill: ratingFill.highest };
  if (value >= 4) return { border: ratingBorder.high, fill: ratingFill.high };
  if (value >= 3) return { border: ratingBorder.mid, fill: ratingFill.mid };
  if (value >= 2) return { border: ratingBorder.low, fill: ratingFill.low };
  return { border: ratingBorder.lowest, fill: ratingFill.lowest };
}

const CHIP_WIDTH = 23;
const GUTTER = 9;
const GUTTER_FLOOR = 3;

function gutterFor(rowWidth: number): number {
  if (rowWidth <= 0) return GUTTER;
  const spare = (rowWidth - RATING_VALUES.length * CHIP_WIDTH) / (RATING_VALUES.length - 1);
  return Math.max(GUTTER_FLOOR, Math.min(GUTTER, spare));
}

export interface RatingWidgetProps {
  readonly value: RatingValue | null;
  readonly onChange: (value: RatingValue) => void;
  /** `143:253` — the lime `5+` legend above the scale. */
  readonly showExceptionalPrompt?: boolean;
  readonly promptText?: string;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

export function RatingWidget({
  value,
  onChange,
  showExceptionalPrompt = false,
  promptText = 'Reward the cook if the service exceeded your expectations to keep them motivated!',
  disabled = false,
  accessibilityLabel = 'Rate this service',
  testID = 'rating-widget',
}: RatingWidgetProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.container} testID={testID}>
      {showExceptionalPrompt ? (
        <View style={styles.prompt} testID={`${testID}-prompt`}>
          <View style={styles.plusChip}>
            <Text variant="ratingPlus" color="textPrimary" align="center">
              5+
            </Text>
          </View>
          <Text variant="micro" color="textSecondary" style={styles.promptText}>
            {promptText}
          </Text>
        </View>
      ) : null}

      <View
        style={[styles.scale, { gap: gutterFor(rowWidth) }]}
        onLayout={onLayout}
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
              // `hitSlop` restores the 44pt target; the chip stays 23 × 40 as drawn.
              hitSlop={{ top: 2, bottom: 2, left: 4, right: 4 }}
              style={({ pressed }) => [
                styles.chip,
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
    </View>
  );
}

const styles = StyleSheet.create({
  /** `143:252` — the legend and the scale sit 8pt apart. */
  container: { alignSelf: 'stretch', gap: lightTheme.space.sm },
  /** `143:253` — the chip and its caption, 11pt apart (chip at x 4, caption at x 57). */
  prompt: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  promptText: { flex: 1 },
  /** `143:254` — 42 × 40 at a 6pt radius with a `#CFFF04` outline and a soft 10pt lift. */
  plusChip: {
    width: 42,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r6,
    borderWidth: lightTheme.stroke.thin,
    borderColor: ratingBorder.highest,
    backgroundColor: lightTheme.colors.surface,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  scale: { flexDirection: 'row', alignItems: 'center' },
  /** `143:259` — 23 × 40 at a 5pt radius with `0 2 2 rgba(0,0,0,0.06)`. */
  chip: {
    flex: 1,
    minWidth: 0,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r5,
    borderWidth: lightTheme.stroke.thin,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
});
