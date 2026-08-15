import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_EXCLUSION_ART } from '../assets';
import { HOME_DESIGN, useHomeContentWidth } from '../layout';
import type { HomeMediaTileViewModel } from '../types';
import { SectionTitle, sectionStyles } from './SectionTitle';

const { exclusions: DESIGN } = HOME_DESIGN;

/**
 * "What's not included?" — Figma Page 3a `139:169`, re-read on `209:1357`.
 *
 * A 2 × 2 grid at a 15pt gutter. Each cell is a 162-wide photograph 67.5pt tall at a 10pt radius,
 * darkened by a flat 40% black scrim (`209:1362`), with a Livvic Regular 9pt caption CENTRED
 * BENEATH the image — 6pt below it, not 8.
 *
 * RESPONSIVENESS: the track width comes from the available column (two tracks + one gutter fill
 * it exactly) and the image holds the designed 162:67.5 proportion with `aspectRatio`, so the
 * photography never stretches. Captions wrap rather than truncate — the frame's longest is
 * "Cleaning entire kitchen" at 104pt inside a 162pt cell, so there is no headroom to ellipsise.
 */
export interface HomeExclusionsProps {
  readonly title: string;
  readonly exclusions: readonly HomeMediaTileViewModel[];
}

export function HomeExclusions({ title, exclusions }: HomeExclusionsProps) {
  const content = useHomeContentWidth();
  // Two tracks plus the gutter fill the column exactly — floor so rounding cannot force a wrap.
  const tileWidth = Math.floor((content - DESIGN.gap) / 2);

  return (
    <View style={sectionStyles.section} testID="home-exclusions">
      <SectionTitle>{title}</SectionTitle>

      <View style={styles.grid}>
        {exclusions.map((tile) => {
          const art =
            tile.imageUrl === undefined ? HOME_EXCLUSION_ART[tile.id] : { uri: tile.imageUrl };

          return (
            <View
              key={tile.id}
              style={{ width: tileWidth }}
              testID={`home-exclusion-${tile.id}`}
              accessible
              accessibilityLabel={`Not included: ${tile.label}`}
            >
              <View style={styles.media}>
                {art === undefined ? null : (
                  <Image
                    source={art as ImageSourcePropType}
                    style={styles.fill}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                )}
                <View style={styles.scrim} />
              </View>
              <Text variant="micro" color="textPrimary" align="center" style={styles.caption}>
                {tile.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Explicit leaf dimensions, not `StyleSheet.absoluteFill` alone: an Image with only insets can
   * fall back to its intrinsic pixel size, which renders the asset zoomed and top-left anchored
   * instead of covering the box.
   */
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'stretch', gap: DESIGN.gap },
  media: {
    alignSelf: 'stretch',
    aspectRatio: DESIGN.imageAspectRatio,
    borderRadius: lightTheme.layout.thumbRadius,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: lightTheme.colors.surfaceScrim,
  },
  caption: { marginTop: DESIGN.captionGap },
});
