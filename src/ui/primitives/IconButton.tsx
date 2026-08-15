import { Pressable, StyleSheet } from 'react-native';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

/**
 * Circular icon-only control — the back arrow and close ✕ documented by the Figma "Icons"
 * frame (`54:280`), plus the circular `→` on the active-booking card.
 *
 * GEOMETRY (`1:738`, and the same control on every screen header): the file draws a **32 × 32**
 * box — `p-[6px]` around a 20 × 20 glyph — at a pill radius, with NO fill.
 *
 * This used to be forced to `minWidth`/`minHeight` 44 to satisfy the touch minimum. That inflated
 * it by 12pt in both axes, which is why the sheet and screen headers rendered ~11pt taller than
 * the frames and pushed every following element right. The drawn size is now the designed 32 and
 * the 44pt target is restored with `hitSlop`, exactly as `Button` already does for its short bars.
 *
 * An icon-only control has no visible text, so `label` is REQUIRED: without it the button is
 * unusable with a screen reader.
 */

export type IconButtonVariant = 'plain' | 'outlined' | 'accent';

export interface IconButtonProps {
  readonly name: IconName;
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: IconButtonVariant;
  readonly disabled?: boolean;
  readonly size?: number;
  /** `1:739` is stroked in `#314158`, not black. Per-node, so call sites state it. */
  readonly color?: ColorToken;
  /** `1:738` — 6pt of padding around the glyph. Overridable for the larger circular controls. */
  readonly padding?: number;
  readonly testID?: string;
}

export function IconButton({
  name,
  label,
  onPress,
  variant = 'plain',
  disabled = false,
  size = 20,
  color = 'textPrimary',
  padding = lightTheme.space.s6,
  testID,
}: IconButtonProps) {
  const box = size + padding * 2;
  const slop = Math.max(0, (lightTheme.layout.minTouchTarget - box) / 2);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={slop}
      style={({ pressed }) => [
        styles.base,
        { width: box, height: box },
        variant === 'outlined' ? styles.outlined : null,
        variant === 'accent' ? styles.accent : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Icon name={name} size={size} color={disabled ? 'textDisabled' : color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.layout.pillRadius,
  },
  /**
   * `37:5266` — the screen header's back disc: white with a very light ring. Sampled off the
   * `3:1658` render, the ring bottoms out at (241,241,241), which is `borderHairline` `#F1F5F9`,
   * not the much bluer `border` `#CAD5E2`.
   */
  outlined: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderHairline,
  },
  accent: { backgroundColor: lightTheme.colors.accentPrimary },
  pressed: { opacity: 0.7 },
});
