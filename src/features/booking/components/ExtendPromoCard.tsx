import { Image, StyleSheet, View } from 'react-native';

import { BOOKING_EXTEND_PROMO_ART, Button, Text, lightTheme } from '@ui';

/**
 * "Need more food prepared?" — Figma `101:1857`, the extension promo on In service.
 *
 * A 195pt card outlined in `#E2FF68` at a 24pt radius, 12pt padding, 12pt gap: a 119pt banner
 * image (`128:28`, cropped to fill) over a 42pt row holding a Livvic SemiBold 11/14.67 prompt and
 * the `#CFFF04` "Extend Time" pill (`101:1858`, 31pt at a 20pt radius, Livvic Bold 14/20).
 *
 * BOUNDARY: this only opens the extension sheet. Extension options, their prices and the
 * resulting end time are all server values (FRONTEND_FOUNDATION_PLAN.md §19).
 */
export interface ExtendPromoCardProps {
  readonly prompt: string;
  readonly ctaLabel: string;
  readonly onExtend: () => void;
  readonly testID?: string;
}

export function ExtendPromoCard({
  prompt,
  ctaLabel,
  onExtend,
  testID = 'extend-promo',
}: ExtendPromoCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <Image
        source={BOOKING_EXTEND_PROMO_ART}
        style={styles.art}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      <View style={styles.row}>
        <Text variant="promptStrong" color="textPrimary" align="center" style={styles.prompt}>
          {prompt}
        </Text>
        <Button
          label={ctaLabel}
          onPress={onExtend}
          variant="bright"
          size="pillSm"
          fullWidth={false}
          style={styles.cta}
          testID={`${testID}-cta`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `101:1857` — 1pt `#E2FF68` outline, 24pt radius, 12pt padding, 12pt gap. */
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.space.md,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfaceEta,
    overflow: 'hidden',
  },
  /**
   * `120:3501` — a 119pt band; the artwork fills it and is cropped, never stretched.
   *
   * `width: '100%'`, NOT `alignSelf: 'stretch'`. An `Image` has an intrinsic size, and stretching
   * it inside this `alignItems: 'center'` card resolved to zero width — the banner rendered as a
   * blank 119pt band on device with no decode error to explain it.
   */
  art: { width: '100%', height: 119 },
  /** `120:3500` — a 42pt row, 10pt gap, 10/6 padding. */
  row: {
    alignSelf: 'stretch',
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.s10,
    paddingVertical: lightTheme.space.s6,
  },
  /** `101:1861` — a 139pt measure; it shrinks before the pill does. */
  prompt: { width: 139, flexShrink: 1 },
  cta: { flex: 1 },
});
