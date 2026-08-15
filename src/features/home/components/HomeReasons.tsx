import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_REASON_ART } from '../assets';
import { HOME_DESIGN, useHomeContentWidth } from '../layout';
import type { HomeMediaTileViewModel } from '../types';
import { SectionTitle, sectionStyles } from './SectionTitle';

const { reasons: DESIGN } = HOME_DESIGN;
/** `209:1279` — Livvic Medium 10/13.33. */
const LABEL_LINE_HEIGHT = 13.33;

/**
 * "Reasons to rely on Spoon cooks" — Figma Page 3a `135:53`, re-read on `209:1276`.
 *
 * A 3 × 2 grid on `#FFEF99` at a 10pt radius, 10pt gutters, rows 125pt tall. Each tile holds an
 * illustration at top 12 — sized PER TILE, 85 / 85 / 80 / 80 / 75 / 78, not uniformly — with its
 * Livvic Medium 10/13.33 label vertically centred on y 109 (110 for the two the frame nudges).
 *
 * This grid REPLACES the three-item "Homely / Fresh / Trustworthy" trust row the previous Home
 * rendered — that row does not exist anywhere in the new file.
 *
 * RESPONSIVENESS: the three columns are `flex: 1` with the real 10pt gutters, so at the reference
 * column they resolve to 106.667pt each — the measured Figma width — and they narrow on a small
 * phone instead of wrapping. Row height and artwork stay fixed, because they are fixed in the
 * design and hold fixed-size type.
 */
export interface HomeReasonsProps {
  readonly title: string;
  readonly reasons: readonly HomeMediaTileViewModel[];
}

const artSize = (id: string): number =>
  (DESIGN.art as Record<string, number | undefined>)[id] ?? DESIGN.artDefault;

const labelCentre = (id: string): number =>
  (DESIGN.labelCentre as Record<string, number | undefined>)[id] ?? DESIGN.labelCentreDefault;

export function HomeReasons({ title, reasons }: HomeReasonsProps) {
  const content = useHomeContentWidth();
  /**
   * A wrapping grid cannot express "three per row" with flex alone, so the track width comes from
   * the AVAILABLE COLUMN — not from a `screenWidth / 390` scale factor. At the reference column
   * (340) this is exactly the 106.667 the frame measures. Floored, because three tracks plus two
   * gutters fill the column exactly and a sub-pixel rounding error wraps the third tile.
   */
  const tileWidth = Math.floor((content - DESIGN.gap * (DESIGN.columns - 1)) / DESIGN.columns);

  return (
    <View style={sectionStyles.section} testID="home-reasons">
      <SectionTitle>{title}</SectionTitle>

      <View style={styles.grid}>
        {reasons.map((tile) => {
          const art =
            tile.imageUrl === undefined ? HOME_REASON_ART[tile.id] : { uri: tile.imageUrl };
          const size = artSize(tile.id);

          return (
            <View
              key={tile.id}
              style={[styles.tile, { width: tileWidth }]}
              testID={`home-reason-${tile.id}`}
              accessible
              accessibilityLabel={tile.label}
            >
              {art === undefined ? null : (
                <Image
                  source={art as ImageSourcePropType}
                  style={{ width: size, height: size, marginTop: DESIGN.artTop }}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              )}
              <Text
                variant="captionStrong"
                color="textPrimary"
                align="center"
                numberOfLines={1}
                style={[styles.label, { top: labelCentre(tile.id) - LABEL_LINE_HEIGHT / 2 }]}
              >
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'stretch', gap: DESIGN.gap },
  tile: {
    height: DESIGN.tileHeight,
    alignItems: 'center',
    borderRadius: lightTheme.layout.thumbRadius,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    overflow: 'hidden',
  },
  label: { position: 'absolute', left: 0, right: 0 },
});
