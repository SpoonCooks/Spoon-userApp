import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui';

import { HOME_REASON_ART } from '../assets';
import { HOME_DESIGN, useHomeContentWidth } from '../layout';
import type { HomeMediaTileViewModel } from '../types';
import { SectionTitle, sectionStyles } from './SectionTitle';

const { reasons: DESIGN, section: SECTION } = HOME_DESIGN;

/**
 * "Reasons to rely on Spoon cooks" — Figma `135:53`, grid `135:71`.
 *
 * REWORKED in the current file. The superseded grid was six 125pt `#FFEF99` tiles with the label
 * vertically centred at y 109, BELOW the artwork. `135:71` is a 150pt-tall 3 × 2 grid of **67pt**
 * tiles with **no fill at all**, the Livvic **Bold 12/16** label at the TOP and the illustration
 * beneath it — 10pt column gutters, **16pt** row gutters.
 *
 * Five of the six artworks changed with it, and the labels and order changed too:
 * Trained · Verified · Hygienic / Reliable · Available · Compliant. Only "Trained" survives.
 *
 * Each illustration is sized PER TILE — 63 × 54, 63 × 52, 54 × 53, 57 × 54, 60 × 54, 60 × 53 —
 * and each asset already carries its node's own crop (see `assets.ts`).
 *
 * RESPONSIVENESS: the three columns come from the AVAILABLE COLUMN, not from a
 * `screenWidth / 390` scale factor. At the reference (330 inner) they resolve to 103.33 each —
 * the measured Figma width. Row height and artwork stay fixed, because they are fixed in the
 * design and hold fixed-size type.
 */
export interface HomeReasonsProps {
  readonly title: string;
  readonly reasons: readonly HomeMediaTileViewModel[];
}

type ArtSize = { readonly width: number; readonly height: number };

const artSize = (id: string): ArtSize =>
  (DESIGN.art as Record<string, ArtSize | undefined>)[id] ?? DESIGN.artDefault;

export function HomeReasons({ title, reasons }: HomeReasonsProps) {
  const content = useHomeContentWidth() - SECTION.paddingHorizontal * 2;
  /**
   * A wrapping grid cannot express "three per row" with flex alone, so the track width comes from
   * the section's inner column. Floored, because three tracks plus two gutters fill it exactly and
   * a sub-pixel rounding error wraps the third tile.
   */
  const tileWidth = Math.floor(
    (content - DESIGN.columnGap * (DESIGN.columns - 1)) / DESIGN.columns,
  );

  return (
    <View style={[sectionStyles.section, sectionStyles.gapWide]} testID="home-reasons">
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
              <Text variant="bodyBold" color="textPrimary" align="center" numberOfLines={1}>
                {tile.label}
              </Text>
              {art === undefined ? null : (
                <Image
                  source={art as ImageSourcePropType}
                  style={{ width: size.width, height: size.height }}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    columnGap: DESIGN.columnGap,
    rowGap: DESIGN.rowGap,
  },
  /**
   * `153:500` — 103 × 67, no fill, no border. The artwork overflows the 67pt box by design
   * (16 + 54 = 70), and the frame does NOT clip it, so neither does this.
   */
  tile: { height: DESIGN.tileHeight, alignItems: 'center' },
});
