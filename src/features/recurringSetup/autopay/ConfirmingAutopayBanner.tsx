import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { AUTOPAY_TIME_GLYPH } from './assets';

/**
 * Home's "Confirming Autopay" banner (Figma note 2317:13605). NO FRAME: built from the Autopay
 * sheets' own parts — the `color/surface/subtle` card (`2316:3581`), the primary-tint status well
 * and `Icon/Time` (`2317:3650`), Body Strong over Caption at 60 % — so it reads as the same flow.
 * Shown until the bank answers; a tap opens the booking.
 */
export interface ConfirmingAutopayBannerProps {
  readonly onPress: () => void;
  readonly testID?: string;
}

export function ConfirmingAutopayBanner({
  onPress,
  testID = 'confirming-autopay-banner',
}: ConfirmingAutopayBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Confirming Autopay. Your bank is confirming it. Opens your Recurring plan."
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      testID={testID}
    >
      <View style={styles.well}>
        <Image source={AUTOPAY_TIME_GLYPH} style={styles.glyph} />
      </View>
      <View style={styles.copy}>
        <Text variant="spoonBodyStrong">Confirming Autopay</Text>
        <Text variant="spoonCaption" color="textSecondarySoft">
          Your bank is confirming it. We’ll notify you once it’s set.
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.space.md,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  pressed: { opacity: 0.85 },
  well: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceBrandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { width: 22, height: 22 },
  copy: { flex: 1, gap: lightTheme.space.xxs },
});
