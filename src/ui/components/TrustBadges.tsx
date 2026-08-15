import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { CookBadgesViewModel } from '@ui/types/viewModels';

import { COOK_BADGE_ART } from './cookAssets';

/**
 * The trust row: Spoon Trained · Background Verified · On-time — Figma `94:1012`.
 *
 * Geometry, verbatim: `rgba(236,255,155,0.7)` at a 16pt radius with `0 0 2 rgba(0,0,0,0.08)`,
 * 49pt tall, ~15pt horizontal padding, 9.889pt vertical, 11pt between items. Each item is an 18pt
 * exported glyph over a Livvic 10/13.33 label, and the separators are 3.3pt `rgba(0,0,0,0.8)`
 * dots — not the flat lime `#ECFF9B` strip with Feather icons that was drawn before.
 *
 * RENDERS CONDITIONALLY. Every sample card in Figma happens to show all three, which the audit
 * explicitly warns is not evidence that every cook has all three. A missing or `false` flag hides
 * that badge, and `onTime` is never assumed true — it is the one most likely to vary per cook.
 * The whole row disappears when nothing is earned, rather than rendering an empty strip.
 */

export interface TrustBadgesProps {
  readonly badges?: CookBadgesViewModel;
  readonly testID?: string;
}

const DEFINITIONS: readonly { key: keyof CookBadgesViewModel; label: string }[] = [
  { key: 'spoonTrained', label: 'Spoon Trained' },
  { key: 'backgroundVerified', label: 'Background Verified' },
  { key: 'onTime', label: 'On-time' },
];

export function TrustBadges({ badges, testID = 'trust-badges' }: TrustBadgesProps) {
  const earned = DEFINITIONS.filter((definition) => badges?.[definition.key] === true);

  if (earned.length === 0) {
    return null;
  }

  return (
    <View style={styles.row} testID={testID}>
      {earned.map((definition, index) => (
        <View key={definition.key} style={styles.slot}>
          {index === 0 ? null : <View style={styles.dot} />}
          <View
            style={styles.item}
            accessible
            accessibilityLabel={definition.label}
            testID={`${testID}-${definition.key}`}
          >
            <Image
              source={COOK_BADGE_ART[definition.key]}
              style={styles.glyph}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text variant="captionStrong" color="textPrimary" align="center" numberOfLines={2}>
              {definition.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: lightTheme.space.s15,
    paddingVertical: 9.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceTrust,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  slot: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 11 },
  item: { alignItems: 'center', gap: 1, flexShrink: 1 },
  glyph: { width: 18, height: 18 },
  /** `94:1020` — a 3.3pt `rgba(0,0,0,0.8)` separator dot. */
  dot: {
    width: 3.3,
    height: 3.3,
    borderRadius: 3.3 / 2,
    backgroundColor: lightTheme.colors.textSeparator,
  },
});
