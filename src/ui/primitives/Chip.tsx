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
      <View style={styles.content}>
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
  /** `34:3155` — px **14.02**, and the vertical padding is asymmetric: pt 6.9 / pb 7.8. */
  slotBase: { paddingHorizontal: 14.02, paddingTop: 6.9, paddingBottom: 7.8 },
  slotDisabled: { opacity: 0.4 },
  content: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.s6 },
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
