import { Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Selectable chip — Figma `37:3718` (Day) and `37:3737` (Time), with the same treatment reused
 * for Start time, Dietary preference and Tip.
 *
 * Geometry, verbatim:
 *   chip      px 9.8 / py 7.8, 12pt radius, NO border
 *   idle      `rgba(255,247,204,0.7)`
 *   selected  `rgba(226,255,104,0.7)` plus `0 0 4 rgba(0,0,0,0.15)`
 *   caption   Livvic SemiBold 10/15 uppercase at +0.5 tracking, `rgba(0,0,0,0.7)` at 70% opacity
 *   label     Livvic Black 12/16, black, centred
 *   icon      14pt, 6pt from the label
 *
 * The previous chip carried a 1pt border, a 44pt minimum height, 12/8 padding and a SemiBold
 * label — four separate departures from the frame. The 44pt touch target is preserved through
 * `hitSlop` instead of by inflating the chip, so the drawn size stays exact.
 *
 * Disabled slots are a SERVER decision (per-15-minute availability). This component renders the
 * disabled state; it never decides it.
 */

export type ChipTone = 'accent' | 'surface';

/**
 * `default` is the Day / Time / diet / tip chip. `slot` is the start-time grid, which the
 * `34:*` frames draw differently in three separate ways — see `SLOT` below. Splitting the
 * density rather than compromising between them is the same call `PriceTile` already makes.
 */
export type ChipDensity = 'default' | 'slot';

export interface ChipProps {
  readonly label: string;
  /** Small line above the label — the weekday on Day chips. */
  readonly caption?: string;
  readonly icon?: IconName;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly tone?: ChipTone;
  readonly density?: ChipDensity;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

/** `37:3718` — py 7.8 makes the chip ~38pt tall, so 3pt each side reaches the 44pt minimum. */
const TOUCH_SLOP = 4;

export function Chip({
  label,
  caption,
  icon,
  selected = false,
  disabled = false,
  tone = 'accent',
  density = 'default',
  onPress,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const slot = density === 'slot';

  const surface: ViewStyle = disabled
    ? styles.disabled
    : selected
      ? styles.selected
      : tone === 'surface'
        ? styles.surface
        : styles.idle;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || onPress === undefined}
      testID={testID}
      hitSlop={TOUCH_SLOP}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (caption === undefined ? label : `${caption} ${label}`)
      }
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        slot ? styles.slotBase : null,
        surface,
        // `34:3155` fades the WHOLE disabled slot to 40%, on top of its `rgba(0,0,0,0.07)` fill.
        // The Day / Time chips carry no such fade, so it belongs to the density, not the state.
        slot && disabled ? styles.slotDisabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <View style={[styles.content, slot ? styles.slotContent : null]}>
        {icon === undefined ? null : (
          <Icon name={icon} size={14} color={disabled ? 'textDisabledOnTile' : 'textPrimary'} />
        )}
        <View style={styles.stack}>
          {caption === undefined ? null : (
            <Text
              variant="labelUpper"
              color={disabled ? 'textDisabledMuted' : 'textSecondary'}
              align="center"
              numberOfLines={1}
              style={styles.caption}
            >
              {caption}
            </Text>
          )}
          <Text
            variant={slot ? 'slotLabel' : 'bodyBlack'}
            color={disabled ? 'textDisabledOnTile' : 'textPrimary'}
            align="center"
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    paddingHorizontal: 9.8,
    paddingVertical: 7.8,
    borderRadius: lightTheme.layout.optionRadius,
  },
  /**
   * `34:3155` re-measured against the V8 node tree: the chip is 76.5 x 36–37 and its label frame
   * is 55 x 16 at x 10.75 / y 10. So the drawn insets are **10 on every side**, not the
   * asymmetric 6.9 / 7.8 an earlier pass recorded — which rendered the chip 31.2 tall against the
   * frame's 36.5 and left the grid visibly shallower than the file.
   *
   * Height is stated as padding rather than a fixed value so it follows the label's own line box:
   * 10 + 16.5 (`slotLabel`) + 10 = 36.5, which is the 36/37 the frame rounds to.
   *
   * The HORIZONTAL inset is deliberately NOT the drawn 10.75. Width now comes from the grid's
   * column track (`ChipGroup`), so this padding is only a floor that keeps the label off the
   * edge — and at 320dp, where a cell is 64 wide, a 10.75 inset would leave 42.5 for a label that
   * needs ~55 and truncate every time. At 2 the label has 60 and centring does the rest, so the
   * chip reads identically at the frame's width and stays whole at the narrowest one.
   */
  slotBase: {
    paddingHorizontal: lightTheme.space.xxs,
    paddingVertical: 10,
  },
  /** The label centres in the column track rather than sitting against its leading edge. */
  slotContent: { justifyContent: 'center' },
  slotDisabled: { opacity: 0.4 },
  /**
   * Centred on BOTH axes, at every density.
   *
   * `justifyContent` used to belong to `slotContent` alone, so only the start-time grid centred
   * its label. Day and Time chips are equal-width grid cells too (`ChipGroup` gives them a
   * `33.33%` track), and without it their content sat against the leading edge: "TODAY / Aug 25"
   * and the sunrise + "Morning" lockup were both drawn hard left inside a chip much wider than
   * they are, which reads as a layout fault rather than as a choice.
   */
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s6,
  },
  stack: { alignItems: 'center', flexShrink: 1 },
  /** `37:3719` — the caption is drawn at 70% on top of its already-70% ink. */
  caption: { opacity: 0.7 },
  idle: { backgroundColor: lightTheme.colors.surfaceTileIdle },
  surface: { backgroundColor: lightTheme.colors.surface },
  selected: {
    backgroundColor: lightTheme.colors.surfaceTileSelected,
    ...lightTheme.elevation.tile,
  },
  disabled: { backgroundColor: lightTheme.colors.surfaceTileDisabled },
  pressed: { opacity: 0.8 },
});
