import { Image, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { LINE_ICONS } from '../art';
import { CookPortrait } from './CookPortrait';
import type { CookProfile, CookProfileLine } from '../types';

/**
 * `Cook profile header` — Figma `867:1670` (on the deck card) and `848:7911` (on the profile).
 *
 * p 16. On the left, pr 8 and 8 between two groups: the name (SemiBold 18/26) over its caption
 * lines (Regular 12/16), 4 apart; then the stat lines (SemiBold 14/20), 4 apart, each with the
 * glyph it asks for at 12pt. On the right, the photo: 100×100 at a 16pt radius, on `#FFF7CC`, the
 * cook standing full height (`CookPortrait`), pinned 16 from the top and right OUTSIDE the flow — the header is as tall as its
 * text (130 for one caption and two stats), never less than the photo needs. Every line is the
 * backend's, in its order.
 */
export interface CookProfileHeaderProps {
  readonly profile: CookProfile;
  readonly onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
  readonly testID?: string;
}

export function CookProfileHeader({
  profile,
  onLayout,
  testID = 'cook-profile-header',
}: CookProfileHeaderProps) {
  return (
    <View style={styles.header} onLayout={onLayout} testID={testID}>
      <View style={styles.description}>
        <View style={styles.group}>
          <Text variant="headingSection" color="textPrimary" accessibilityRole="header">
            {profile.name}
          </Text>
          {profile.details.map((line) => (
            <Line key={line.id} line={line} variant="body" />
          ))}
        </View>
        {profile.stats.length === 0 ? null : (
          <View style={styles.group}>
            {profile.stats.map((line) => (
              <Line key={line.id} line={line} variant="bodyLargeStrong" />
            ))}
          </View>
        )}
      </View>
      <View style={styles.photo}>
        {profile.photo === undefined ? null : <CookPortrait source={profile.photo} size={PHOTO} />}
      </View>
    </View>
  );
}

function Line({
  line,
  variant,
}: {
  readonly line: CookProfileLine;
  readonly variant: 'body' | 'bodyLargeStrong';
}) {
  const icon = line.icon === undefined ? undefined : LINE_ICONS[line.icon];
  return (
    <View style={styles.line}>
      <Text variant={variant} color="textPrimary" style={styles.lineText}>
        {line.label}: {line.value}
      </Text>
      {icon === undefined ? null : <Image source={icon} style={styles.lineIcon} />}
    </View>
  );
}

const PHOTO = 100;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: lightTheme.space.lg,
    paddingRight: lightTheme.space.lg + PHOTO,
    minHeight: lightTheme.space.lg + PHOTO,
  },
  description: { flex: 1, gap: lightTheme.space.sm, paddingRight: lightTheme.space.sm },
  group: { gap: lightTheme.space.xs },
  /** `867:1677` — the glyph 4 after its line. */
  line: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  lineText: { flexShrink: 1 },
  lineIcon: { width: 12, height: 12 },
  photo: {
    position: 'absolute',
    top: lightTheme.space.lg,
    right: lightTheme.space.lg,
    width: PHOTO,
    height: PHOTO,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
    overflow: 'hidden',
  },
});
