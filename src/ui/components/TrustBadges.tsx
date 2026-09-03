import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { CookBadgesViewModel } from '@ui/types/viewModels';

import { COOK_BADGE_ART } from './cookAssets';

/**
 * The trust row: Spoon Trained · Background Verified · Hygienic — Figma `289:7616`.
 *
 * CHANGED this pass. The third badge is no longer "On-time" with a clock; the current file draws
 * **Hygienic** with the Clean Hands mark, and every one of the eight cook cards agrees.
 *
 * Geometry, verbatim: `rgba(236,255,155,0.7)` at a 16pt radius with `0 0 2 rgba(0,0,0,0.08)`,
 * 49pt tall, ~15pt horizontal padding, 9.889pt vertical, 11pt between items, and 3.3pt
 * `rgba(0,0,0,0.8)` separator dots.
 *
 * Each item is an 18pt **`rgba(0,0,0,0.8)` disc** (`289:7622`) carrying a lime glyph at a
 * per-badge size — 16 / 15 / 13 — over a Livvic SemiBold 10/13.33 label, also at 80 % black. The
 * disc was missing from the implementation entirely, which drew the lime glyphs straight onto the
 * lime row.
 *
 * RENDERS CONDITIONALLY. Every sample card in Figma happens to show all three, which the audit
 * explicitly warns is not evidence that every cook has all three. A missing or `false` flag hides
 * that badge; nothing here is assumed true. The whole row disappears when nothing is earned,
 * rather than rendering an empty strip.
 */

export interface TrustBadgesProps {
  readonly badges?: CookBadgesViewModel;
  readonly testID?: string;
}

/** `289:7623` / `289:7631` / `289:7639` — the glyph sizes inside the shared 18pt disc. */
const DEFINITIONS: readonly { key: keyof CookBadgesViewModel; label: string; glyph: number }[] = [
  { key: 'spoonTrained', label: 'Spoon Trained', glyph: 16 },
  { key: 'backgroundVerified', label: 'Background Verified', glyph: 15 },
  { key: 'hygienic', label: 'Hygienic', glyph: 13 },
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
            <View style={styles.disc}>
              <Image
                source={COOK_BADGE_ART[definition.key]}
                style={{ width: definition.glyph, height: definition.glyph }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <Text
              variant="labelUpperQuiet"
              color="textTrust"
              align="center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
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
    justifyContent: 'space-between',
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
  slot: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  item: { alignItems: 'center', gap: 1 },
  /** `289:7622` — an 18pt `rgba(0,0,0,0.8)` disc, with 2pt of clearance beneath it. */
  disc: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceTrustDisc,
  },
  /** `94:1020` — a 3.3pt `rgba(0,0,0,0.8)` separator dot. */
  dot: {
    width: 3.3,
    height: 3.3,
    borderRadius: 3.3 / 2,
    backgroundColor: lightTheme.colors.textSeparator,
  },
});
