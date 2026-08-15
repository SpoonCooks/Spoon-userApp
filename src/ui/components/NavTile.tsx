import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@ui/primitives/Icon';
import type { IconName } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Navigation tile — the 2×2 grid on Profile (`6:663`): My orders · Addresses · My refunds · Help,
 * and the two booking tiles on Home (Instant Cook / Schedule Later).
 *
 * Note the Profile grid deliberately has no "Payment methods" tile: payment opens Razorpay
 * directly, so no payment-management surface exists (ruling R-1).
 */

export type NavTileTone = 'surface' | 'accent' | 'positive';

export interface NavTileProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: IconName;
  readonly tone?: NavTileTone;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

export function NavTile({
  title,
  subtitle,
  icon,
  tone = 'surface',
  onPress,
  disabled = false,
  testID,
}: NavTileProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={subtitle === undefined ? title : `${title}, ${subtitle}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.tile,
        TONE[tone],
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {icon === undefined ? null : (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color="textPrimary" />
        </View>
      )}
      <Text variant="bodyStrong" color={disabled ? 'textDisabled' : 'textPrimary'}>
        {title}
      </Text>
      {subtitle === undefined ? null : (
        <Text variant="caption" color="textSecondary">
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

const TONE = StyleSheet.create({
  surface: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.border,
  },
  accent: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
  positive: { backgroundColor: lightTheme.colors.surfacePositive },
});

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'center',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.layout.cardRadius,
  },
  iconWrap: {
    width: lightTheme.space.xxl,
    height: lightTheme.space.xxl,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  disabled: { backgroundColor: lightTheme.colors.surfaceMuted, borderColor: 'transparent' },
  pressed: { opacity: 0.85 },
});
