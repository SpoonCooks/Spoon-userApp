import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken, TypographyToken } from '@ui/tokens/semantic';

/**
 * Buttons.
 *
 * Variants come from the audited frames:
 *  - `primary`   — `1:821`: a `#FFD600` bar at a 15pt radius carrying a Livvic Black 16/24 label
 *                  and a `0 0 3 rgba(0,0,0,0.15)` lift. "Book Now • ₹198", "GET OTP →", "Extend".
 *  - `accent`    — lime CTA: "Start Service", "Book NOW", "Call Cook", "Reschedule for free".
 *  - `inverse`   — the dark inset pill sitting inside the primary bar ("Pay →").
 *  - `secondary` — white/outlined ("No" on the cancellation confirmation).
 *  - `link`      — text-only row action ("Reschedule Booking", "Share your requests →").
 *  - `danger`    — the red-on-pink destructive treatment proved by Profile's Log Out.
 *
 * The Figma "Cancel" CTA uses primary yellow for a destructive action (defect D-9); the variant
 * exists so screens can adopt the correct treatment the moment design confirms it. Nothing here
 * decides that.
 */

export type ButtonVariant =
  'primary' | 'accent' | 'bright' | 'inverse' | 'secondary' | 'subtle' | 'link' | 'danger';
/**
 * The file draws three distinct CTA geometries, so `size` is not decoration:
 *  - `lg`  `37:3908` — px 20 / py 14, 12pt radius, Livvic Black 14/20. The standard screen bar.
 *  - `md`  `37:3918` — px 16 / py 10, 12pt radius. The secondary bar under it.
 *  - `bar` `1:821`   — a FIXED 34pt bar at a 15pt radius with a Livvic Black 16/24 label. Only
 *                      the Instant sheet uses this; its 34pt height is below the 44pt touch
 *                      minimum, which `hitSlop` restores without changing the drawn size.
 *  - `pill` `21:1107` / `101:1909` — the service-handover CTA: a FIXED 254 × 40 pill at a 26pt
 *                      radius with a Livvic Bold 18/28 label ("Start Service" / "End Service").
 *  - `pillSm` `101:1858` — the "Extend Time" pill: 31pt tall at a 20pt radius, Livvic Bold 14/20.
 *                      Below 44pt, so `hitSlop` restores the target without redrawing it.
 *  - `barSm` `143:364` — the Extension fallback's "Book NOW": 32pt at a 15pt radius with a Livvic
 *                      **Bold** 16/24 label, where `bar` is Black.
 *  - `form` `53:110` / `60:728` — the address CTA: px 24 / py 12, 16pt radius, Livvic Bold
 *                      14/20. Its `#FEE685` glow is applied by the screen, not the size.
 */
export type ButtonSize = 'md' | 'lg' | 'bar' | 'barSm' | 'form' | 'pill' | 'pillSm';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly leftIcon?: IconName;
  readonly rightIcon?: IconName;
  readonly fullWidth?: boolean;
  /**
   * Overrides the size's label style. The file draws the SAME `#CFFF04` 32pt pill with a Bold
   * 12/16 label on `6:74` and a Bold 16/24 label on `104:2385` / `143:365`, so the label style is
   * not always a function of the geometry.
   */
  readonly labelVariant?: TypographyToken;
  /** Trailing slot inside the bar — `37:3912`, the inset black `Pay →` pill on Scheduled. */
  readonly trailing?: ReactNode;
  /** Overrides the visible label for screen readers when the label alone is ambiguous. */
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const SURFACE: Record<ButtonVariant, ViewStyle> = {
  /** `1:821` — `#FFD600` with a `0 0 3 rgba(0,0,0,0.15)` lift, NOT the `#FFE666` tile yellow. */
  primary: { backgroundColor: lightTheme.colors.surfaceCta, ...lightTheme.elevation.cta },
  accent: { backgroundColor: lightTheme.colors.accentSecondary },
  /** `21:1107` / `101:1858` — `#CFFF04`, the brightest lime. Distinct from `accent`'s `#ECFF9B`. */
  bright: { backgroundColor: lightTheme.colors.surfacePositiveBright },
  inverse: { backgroundColor: lightTheme.colors.surfaceInverse },
  secondary: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.border,
  },
  /** `37:3918` — the flat `#F1F5F9` "Share your requests" bar. No border in the frame. */
  subtle: { backgroundColor: lightTheme.colors.surfaceSubtle },
  link: { backgroundColor: 'transparent' },
  danger: { backgroundColor: lightTheme.colors.dangerSurface },
};

const LABEL_COLOR: Record<ButtonVariant, ColorToken> = {
  primary: 'textOnAccent',
  accent: 'textOnAccent',
  bright: 'textOnAccent',
  inverse: 'textInverse',
  secondary: 'textPrimary',
  subtle: 'textSecondaryStrong',
  link: 'danger',
  danger: 'danger',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  trailing,
  fullWidth = true,
  labelVariant,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const labelColor: ColorToken = inactive ? 'textDisabled' : LABEL_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={SHORT_SIZES.has(size) ? BAR_TOUCH_SLOP : undefined}
      style={({ pressed }) => [
        styles.base,
        // `37:3908` — with the inset pill present the bar is space-between: the label sits at the
        // left inset (x 20) and the pill at the right, not both bunched in the middle.
        trailing === undefined ? null : styles.split,
        variant === 'link' ? styles.link : SHAPE[size],
        SURFACE[variant],
        fullWidth ? styles.fullWidth : null,
        inactive ? styles.inactive : null,
        pressed && !inactive ? styles.pressed : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={lightTheme.colors[labelColor]}
            testID={testID === undefined ? undefined : `${testID}-spinner`}
          />
        ) : null}
        {leftIcon !== undefined && !loading ? <Icon name={leftIcon} color={labelColor} /> : null}
        <Text variant={labelVariant ?? LABEL_VARIANT[size]} color={labelColor} numberOfLines={1}>
          {label}
        </Text>
        {rightIcon !== undefined && !loading ? <Icon name={rightIcon} color={labelColor} /> : null}
      </View>
      {/* The inset pill has its own fill, so it has to be dimmed with the bar — otherwise a
          disabled CTA renders a fully-saturated `Pay ->` chip inside a greyed-out bar. */}
      {trailing === undefined ? null : (
        <View style={inactive ? styles.inactiveTrailing : null}>{trailing}</View>
      )}
    </Pressable>
  );
}

/** `1:821` is 34pt tall; the drawn heights below 44pt keep their size and gain the slop instead. */
const BAR_TOUCH_SLOP = 7;

/** Sizes the file draws SHORTER than the 44pt minimum. `hitSlop` restores the target. */
const SHORT_SIZES: ReadonlySet<ButtonSize> = new Set<ButtonSize>([
  'bar',
  'barSm',
  'pill',
  'pillSm',
]);

const LABEL_VARIANT: Record<ButtonSize, TypographyToken> = {
  lg: 'titleBlack',
  md: 'bodyBold',
  bar: 'headingCta',
  barSm: 'headingBold',
  form: 'title',
  pill: 'titleLead',
  pillSm: 'title',
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  split: { justifyContent: 'space-between' },
  link: {
    minHeight: lightTheme.layout.minTouchTarget,
    paddingHorizontal: lightTheme.space.sm,
  },
  /**
   * `37:3908` — the standard screen CTA: **52** tall. Its label box (`37:3910`) sits at y 16 and
   * is 20 tall, so the vertical padding is 16, not 14. At 14 the bar rendered 48.
   */
  lg: {
    borderRadius: lightTheme.layout.optionRadius,
    paddingHorizontal: 20,
    paddingVertical: lightTheme.space.lg,
  },
  /** `37:3918` — the secondary bar beneath it. */
  md: {
    borderRadius: lightTheme.layout.optionRadius,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.s10,
    gap: lightTheme.space.s6,
  },
  /** `1:821` — the Instant sheet's fixed 34pt bar at a 15pt radius. */
  bar: {
    height: 34,
    borderRadius: lightTheme.layout.ctaRadius,
    paddingHorizontal: lightTheme.space.xl,
  },
  /** `53:110` / `60:728` — the address CTA. */
  form: {
    borderRadius: lightTheme.radius.md,
    paddingHorizontal: lightTheme.space.xl,
    paddingVertical: lightTheme.space.md,
  },
  /** `143:364` — the Extension fallback's 32pt "Book NOW" pill. */
  barSm: {
    height: 32,
    borderRadius: lightTheme.layout.ctaRadius,
    paddingHorizontal: lightTheme.space.xl,
  },
  /**
   * `21:1107` / `101:1909` — the service-handover pill. The frame fixes it at 254 × 40 inside a
   * 338pt column; `maxWidth` keeps it inside a narrower one rather than scaling it.
   */
  pill: {
    width: 254,
    maxWidth: '100%',
    height: 40,
    borderRadius: lightTheme.radius.xl,
  },
  /** `101:1858` — "Extend Time": 31pt at a 20pt radius, filling its row. */
  pillSm: {
    height: 31,
    borderRadius: lightTheme.radius.r20,
    paddingHorizontal: lightTheme.space.md,
    ...lightTheme.elevation.soft,
  },
  fullWidth: { alignSelf: 'stretch' },
  inactive: { backgroundColor: lightTheme.colors.surfaceMuted, borderColor: 'transparent' },
  inactiveTrailing: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    gap: lightTheme.space.sm,
  },
});

const SHAPE: Record<ButtonSize, ViewStyle> = {
  lg: styles.lg,
  md: styles.md,
  bar: styles.bar,
  barSm: styles.barSm,
  form: styles.form,
  pill: styles.pill,
  pillSm: styles.pillSm,
};
