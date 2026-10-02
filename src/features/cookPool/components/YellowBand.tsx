import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * `Yellow band` — Figma `755:2348` (the deck card) and `719:1569` (the profile).
 *
 * Behind a cook's menu: a 35pt curved edge in `#FFF7CC`, then a `#FFF7CC` → `#FFE666` fall from 34
 * below its top to the end of the content. Drawn absolutely inside the scroll content, so it
 * scrolls with the menu and stretches as far as the menu does.
 */
export interface YellowBandProps {
  /** The curved edge, stretched to the band's width. */
  readonly curve: ImageSourcePropType;
  /** Where the band starts, from the top of the scroll content. */
  readonly top: number;
}

export function YellowBand({ curve, top }: YellowBandProps) {
  return (
    <View style={[styles.band, { top }]} pointerEvents="none">
      <Image source={curve} style={styles.curve} resizeMode="stretch" />
      <LinearGradient
        colors={[lightTheme.colors.surfaceAccent, lightTheme.colors.surfaceBrandTint]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.body}
      />
    </View>
  );
}

const CURVE = 35;

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  curve: { width: '100%', height: CURVE },
  /** `755:2350` — from 34, 1pt under the curve's foot, so no seam shows between them. */
  body: { position: 'absolute', top: CURVE - 1, left: 0, right: 0, bottom: 0 },
});
