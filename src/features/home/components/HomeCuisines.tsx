import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, ViewStyle } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_CUISINE_ART } from '../assets';
import { HOME_DESIGN } from '../layout';
import type { HomeMediaTileViewModel } from '../types';
import { SectionTitle, sectionStyles } from './SectionTitle';

const { cuisines: DESIGN } = HOME_DESIGN;

/**
 * "Cooks for every family and every need" — Figma `1:595`, mosaic `132:48`.
 *
 * A deliberately ASYMMETRIC mosaic inside a 330 × 283 box: a tall 158 × 183 "daily" card at the
 * left, two 158 × 89 cards stacked at the right (**14pt** column gutter, **5pt** row gutter), and
 * a full-width 330 × 89 band **11pt** beneath. Each card carries the real Figma photography at a
 * 20pt radius, its own vertical scrim, and a Livvic Bold 9/13.5 white caption pinned bottom-left
 * at px 10 / pb 6.
 *
 * RESPONSIVENESS: the mosaic is two flex columns whose widths come from the available column,
 * with each card's designed proportion held by `aspectRatio`. The tall card's height
 * (158 : 183) equals the stacked pair's (89 + 5 + 89) at ANY column width, so the mosaic stays
 * square-edged on every phone without arithmetic.
 */
export interface HomeCuisinesProps {
  readonly title: string;
  readonly cuisines: readonly HomeMediaTileViewModel[];
}

/**
 * `140:186` … `140:189` — FOUR distinct scrims, not the two the superseded revision drew. Each is
 * a founder colour at a stated opacity fading into black, read verbatim off its node:
 *
 *   daily    `#FFD600` 7 %  → black 50 %   (`bg-gradient-to-b`, i.e. exactly 180°)
 *   north    `#FFD600` 7 %  → black 70 %   at 179.716°
 *   south    `#FFD600` 7 %  → black 70 %   (180°)
 *   chinese  `#FFD600` 10 % → black 40 %   at 179.703°, from 4.486 % to 99.057 %
 *
 * The two measured angles are within 0.3° of vertical — across the widest card the file draws
 * (330pt) that displaces the band by 1.7pt, below the width of the softest stop transition — so
 * the vertical axis is used and the measurement is recorded rather than silently rounded away.
 */
const SCRIMS = lightTheme.gradients;

type Scrim = {
  readonly colors: readonly [string, string, ...string[]];
  readonly locations?: readonly [number, number, ...number[]];
};

interface Slot {
  readonly id: string;
  readonly aspectRatio: number;
  readonly scrim: Scrim;
}

const SLOTS: Record<'daily' | 'north' | 'south' | 'asian', Slot> = {
  daily: { id: 'daily', aspectRatio: DESIGN.daily.aspectRatio, scrim: SCRIMS.cuisineDaily },
  north: { id: 'north', aspectRatio: DESIGN.north.aspectRatio, scrim: SCRIMS.cuisineIndian },
  south: { id: 'south', aspectRatio: DESIGN.south.aspectRatio, scrim: SCRIMS.cuisineIndian },
  asian: { id: 'asian', aspectRatio: DESIGN.asian.aspectRatio, scrim: SCRIMS.cuisineAsian },
};

function CuisineCard({
  tile,
  slot,
  style,
}: {
  readonly tile: HomeMediaTileViewModel;
  readonly slot: Slot;
  readonly style?: ViewStyle;
}) {
  const art = tile.imageUrl === undefined ? HOME_CUISINE_ART[tile.id] : { uri: tile.imageUrl };

  return (
    <View
      style={[styles.card, { aspectRatio: slot.aspectRatio }, style]}
      testID={`home-cuisine-${tile.id}`}
      accessible
      accessibilityLabel={tile.label}
    >
      {art === undefined ? null : (
        <Image
          source={art as ImageSourcePropType}
          style={styles.fill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}
      <LinearGradient
        colors={slot.scrim.colors}
        {...(slot.scrim.locations === undefined ? {} : { locations: slot.scrim.locations })}
        style={styles.fill}
      />
      <View style={styles.caption}>
        <Text variant="microStrong" color="textInverse" numberOfLines={1}>
          {tile.label}
        </Text>
      </View>
    </View>
  );
}

export function HomeCuisines({ title, cuisines }: HomeCuisinesProps) {
  const byId = (id: string) => cuisines.find((candidate) => candidate.id === id);
  const daily = byId('daily');
  const north = byId('north');
  const south = byId('south');
  const asian = byId('asian');

  return (
    <View style={[sectionStyles.section, sectionStyles.gapWide]} testID="home-cuisines">
      <SectionTitle>{title}</SectionTitle>

      <View style={styles.mosaic}>
        <View style={styles.topRow}>
          {daily === undefined ? null : (
            <CuisineCard tile={daily} slot={SLOTS.daily} style={styles.column} />
          )}
          <View style={styles.stack}>
            {north === undefined ? null : (
              <CuisineCard tile={north} slot={SLOTS.north} style={styles.column} />
            )}
            {south === undefined ? null : (
              <CuisineCard tile={south} slot={SLOTS.south} style={styles.column} />
            )}
          </View>
        </View>

        {asian === undefined ? null : (
          <CuisineCard tile={asian} slot={SLOTS.asian} style={styles.band} />
        )}
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

  mosaic: { alignSelf: 'stretch', gap: DESIGN.bandGap },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DESIGN.columnGap },
  stack: { flex: 1, minWidth: 0, gap: DESIGN.rowGap },
  column: { flex: 1, minWidth: 0 },
  band: { alignSelf: 'stretch' },

  /**
   * The card is the PHOTOGRAPH's box, and carries no padding of its own.
   *
   * It used to hold the caption's px 10 / pb 6 directly. That padding is what `styles.fill`
   * resolves its `100%` against — Yoga sizes a percentage against the parent's CONTENT box — so
   * the artwork and its scrim came out 20pt narrower and 12pt shorter than the card and sat
   * anchored top-left, leaving the yellow `surfaceAccentStrong` backing visible as a strip down
   * the right edge and along the bottom of every tile. The inset belongs to the caption, not to
   * the picture, so it now lives on `styles.caption` and the photograph covers the whole card.
   */
  card: {
    borderRadius: lightTheme.layout.photoRadius,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },

  /** `140:188` — the caption sits bottom-left, px 10 / pb 6, over the photograph. */
  caption: {
    alignItems: 'flex-start',
    paddingHorizontal: DESIGN.captionPaddingHorizontal,
    paddingBottom: DESIGN.captionPaddingBottom,
  },
});
