import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_ICON_BOLT, HOME_ICON_CALENDAR } from '../assets';
import { HOME_DESIGN } from '../layout';
import type { HomeBookingTileViewModel } from '../types';

/**
 * Instant / Schedule tiles — Figma Page 3a `1:576` / `129:29` (re-read on Page 3b `209:1236`
 * and `209:1245`, which are the same component instances).
 *
 * This is the component the designer called out. Geometry, verbatim from the frame:
 *
 *   row      `209:1234`  flex, justify-between, 4.5pt vertical padding
 *   grid     `209:1235`  flex row, 18pt gap
 *   tile     `209:1236`  160 × 142, px 10, py 22, radius 24, shadow 0 0 4 rgba(0,0,0,0.15)
 *   stack    `209:1237`  6pt gap: 40pt icon → title → subtitle
 *
 * RESPONSIVENESS (task §8): the tile WIDTH is NOT fixed at 160 and is NOT a scaled 390pt canvas
 * value. It is `flex: 1` inside a row with the real 18pt Figma gutter, so at the reference column
 * (340pt) each tile resolves to 161pt — converging on the measured Figma size — and it narrows
 * gracefully on a 320dp phone instead of overflowing.
 *
 * The HEIGHT is fixed at 142 and does NOT follow the width. It previously used
 * `aspectRatio: 160/142`, which measured **152.5dp** on a 393dp handset — the tile grew by 10dp
 * purely because the screen was wider than the design. That is the global-scaling this task
 * forbids, and it is a large part of why Home read as heavier than the frame.
 *
 * 142 is safe at every width because the stack inside it is fixed-size type: `1:578` is 100pt tall
 * and starts at 22, so the tile is never overflowed. The two tiles differ in what is LEFT below
 * that stack — Instant 20 (100pt stack), Schedule 28 (92pt stack) — so the padding is stated as a
 * top inset and the remainder simply falls out of the fixed height, exactly as the frame draws it.
 *
 * The two tiles are deliberately NOT symmetric — the frame sets "Instant" at Black 18/28 and
 * "Schedule" at Black 16/24 with −0.4 tracking, and the Instant subtitle carries a second, larger
 * emphasised run. Equalising them was part of the reported mismatch.
 */
export interface HomeBookingTilesProps {
  readonly tiles: readonly HomeBookingTileViewModel[];
  readonly onPressInstant: () => void;
  readonly onPressSchedule: () => void;
}

const {
  tile: TILE,
  gap: TILE_GAP,
  icon: ICON,
  rowPaddingVertical,
  iconGlyphWidth,
} = HOME_DESIGN.tiles;

export function HomeBookingTiles({
  tiles,
  onPressInstant,
  onPressSchedule,
}: HomeBookingTilesProps) {
  return (
    <View style={styles.row} testID="home-tiles">
      {tiles.map((tile) => {
        const instant = tile.id === 'instant';
        return (
          <Pressable
            key={tile.id}
            onPress={instant ? onPressInstant : onPressSchedule}
            disabled={tile.disabled ?? false}
            accessibilityRole="button"
            accessibilityLabel={`${tile.title}. ${tile.subtitle}${tile.subtitleEmphasis ?? ''}`}
            accessibilityState={{ disabled: tile.disabled ?? false }}
            testID={`home-tile-${tile.id}`}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: instant
                  ? lightTheme.colors.surfacePositive
                  : lightTheme.colors.surfaceAccentBold,
              },
              tile.disabled === true ? styles.disabled : null,
              pressed && tile.disabled !== true ? styles.pressed : null,
            ]}
          >
            <View style={styles.stack}>
              <View style={styles.iconWrap}>
                <Image
                  source={instant ? HOME_ICON_BOLT : HOME_ICON_CALENDAR}
                  style={styles.iconGlyph}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>

              <Text variant={instant ? 'headingTile' : 'heading'} color="textOnAccent">
                {tile.title}
              </Text>

              {/* `1:585` — one paragraph, two runs. */}
              <Text variant="bodyStrong" color="textSecondary">
                {tile.subtitle}
                {tile.subtitleEmphasis === undefined ? null : (
                  <Text
                    variant="title"
                    color="textSecondary"
                    testID={`home-tile-${tile.id}-emphasis`}
                  >
                    {tile.subtitleEmphasis}
                  </Text>
                )}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  /** `209:1234` — 4.5pt of vertical padding sits between the section gap and the tiles. */
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    gap: TILE_GAP,
    paddingVertical: rowPaddingVertical,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    /**
     * `1:576` / `129:29` — 142, independent of how wide the column is. Stated as a MINIMUM, not a
     * fixed height: at the reference the stack is 122 so the tile resolves to exactly 142, but on
     * a 320dp phone the Instant subtitle wraps to two lines and the stack reaches 142 exactly.
     * A hard height would clip the moment the server sent one word more; `alignItems: 'stretch'`
     * on the row keeps the pair equal if it ever does grow.
     */
    minHeight: TILE.height,
    alignItems: 'flex-start',
    paddingHorizontal: TILE.paddingHorizontal,
    paddingTop: TILE.paddingVertical,
    borderRadius: lightTheme.layout.tileRadius,
    overflow: 'hidden',
    ...lightTheme.elevation.tile,
  },
  stack: { alignSelf: 'stretch', gap: TILE.gap },
  /** `209:1238` — a 40pt white disc; the glyph inside is 30 × 40, inset 5pt. */
  iconWrap: {
    width: ICON,
    height: ICON,
    borderRadius: ICON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
    overflow: 'hidden',
  },
  iconGlyph: { width: iconGlyphWidth, height: ICON },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
