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
 * "Cooks for every family and every need" — Figma Page 3a `1:595`, re-read on `209:1254`.
 *
 * A deliberately ASYMMETRIC mosaic: a tall 162×194 "daily" card at the left, two 162×89/90 cards
 * stacked at the right (16pt column gutter, 15pt row gutter), and a full-width 340×90 band
 * beneath. Each card carries the real Figma photography, a vertical scrim and a Livvic Bold 9/13.5
 * white caption pinned near the bottom-left.
 *
 * RESPONSIVENESS: the mosaic was previously four ABSOLUTELY-positioned boxes whose every
 * coordinate was multiplied by `contentWidth / 340`. It is now two flex columns whose widths come
 * from the available column, with each card's designed proportion held by `aspectRatio`. The tall
 * card's height (aspect 162:194) equals the stacked pair's (89 + 15 + 90) at ANY column width, so
 * the mosaic stays square-edged on every phone without arithmetic.
 */
export interface HomeCuisinesProps {
  readonly title: string;
  readonly cuisines: readonly HomeMediaTileViewModel[];
}

/** `144:472` / `144:463` — lime over the cool photographs, yellow over the warm ones. */
const SCRIM_LIME = ['rgba(236,255,155,0.35)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)'] as const;
const SCRIM_YELLOW = ['rgba(255,214,0,0.1)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)'] as const;
const SCRIM_STOPS = [0.004, 0.786, 0.996] as const;

/** `209:1264` — the caption's vertical CENTRE is measured from the card's bottom edge. */
const CAPTION_LINE_HEIGHT = 13.5;

interface Slot {
  readonly id: string;
  readonly aspectRatio: number;
  readonly captionLeft: number;
  readonly captionCentreFromBottom: number;
  readonly scrim: readonly [string, string, string];
}

const SLOTS: Record<'daily' | 'north' | 'south' | 'asian', Slot> = {
  daily: { id: 'daily', ...DESIGN.daily, scrim: SCRIM_LIME },
  north: { id: 'north', ...DESIGN.north, scrim: SCRIM_YELLOW },
  south: { id: 'south', ...DESIGN.south, scrim: SCRIM_YELLOW },
  asian: { id: 'asian', ...DESIGN.asian, scrim: SCRIM_LIME },
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
        colors={[slot.scrim[0], slot.scrim[1], slot.scrim[2]]}
        locations={[SCRIM_STOPS[0], SCRIM_STOPS[1], SCRIM_STOPS[2]]}
        style={styles.fill}
      />
      <Text
        variant="microStrong"
        color="textInverse"
        numberOfLines={1}
        style={{
          position: 'absolute',
          left: slot.captionLeft,
          right: slot.captionLeft,
          bottom: slot.captionCentreFromBottom - CAPTION_LINE_HEIGHT / 2,
        }}
      >
        {tile.label}
      </Text>
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
    <View style={sectionStyles.section} testID="home-cuisines">
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

  mosaic: { alignSelf: 'stretch', gap: DESIGN.rowGap },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DESIGN.columnGap },
  stack: { flex: 1, minWidth: 0, gap: DESIGN.rowGap },
  column: { flex: 1, minWidth: 0 },
  band: { alignSelf: 'stretch' },

  card: {
    borderRadius: lightTheme.layout.photoRadius,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
});
