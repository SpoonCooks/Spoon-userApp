import { Image, StyleSheet, View } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_DESIGN } from '../layout';
import type { HomePromoViewModel } from '../types';

/**
 * Promo carousel — Figma Page 3a `1:479` ("header 1").
 *
 * Geometry is exact: a 238pt-tall centre panel (217 wide, 20pt radius, `0 0 4 rgba(0,0,0,0.25)`
 * — the strongest shadow on Home) flanked by two 210pt side panels that are 75 wide, each
 * rounded on its inner edge only and carrying a horizontal `1 0 2 rgba(0,0,0,0.1)` drop shadow.
 * The row overflows the 340pt column by design and is clipped, producing the peek.
 *
 * DESIGN_PENDING: the panels in Page 3a are empty colour fields — the frame carries no promo
 * artwork, copy or slide indicators. Rather than carry forward the previous design's badge and
 * headline, this renders the designed panels and shows copy ONLY if a view model supplies it.
 * Nothing is invented, and no offer or discount is computed here.
 */
export interface HomePromoCarouselProps {
  readonly promo?: HomePromoViewModel;
}

export function HomePromoCarousel({ promo }: HomePromoCarouselProps) {
  return (
    <View
      style={styles.viewport}
      testID="home-promo"
      accessible={promo !== undefined}
      accessibilityLabel={
        promo === undefined
          ? undefined
          : [promo.badge, promo.title, promo.subtitle].filter(Boolean).join('. ')
      }
    >
      <View style={[styles.sidePanel, styles.sideLeft]} />

      <View style={styles.centrePanel}>
        {promo?.imageUrl === undefined ? null : (
          <Image
            source={{ uri: promo.imageUrl }}
            style={styles.fill}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        )}
        {promo?.title === undefined ? null : (
          <View style={styles.copy}>
            <Text variant="heading" color="textOnAccent">
              {promo.title}
            </Text>
            {promo.subtitle === undefined ? null : (
              <Text variant="micro" color="textSecondary">
                {promo.subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={[styles.sidePanel, styles.sideRight]} />
    </View>
  );
}

const { promo: DESIGN } = HOME_DESIGN;

const styles = StyleSheet.create({
  /**
   * Explicit leaf dimensions, not `StyleSheet.absoluteFill` alone: an Image with only insets can
   * fall back to its intrinsic pixel size, which renders the asset zoomed and top-left anchored
   * instead of covering the box.
   */
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  /**
   * The row is WIDER than the column by design (`209:1228` starts at x −30), so the side panels
   * are clipped to a peek. Keeping the panels at their real Figma sizes and clipping — rather than
   * scaling them to the device — is what makes the peek grow on a wide phone and shrink on a
   * narrow one, which is how a peek carousel is supposed to behave.
   */
  viewport: {
    alignSelf: 'stretch',
    height: DESIGN.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DESIGN.gap,
    overflow: 'hidden',
  },
  sidePanel: {
    width: DESIGN.side.width,
    height: DESIGN.side.height,
    backgroundColor: lightTheme.colors.surfaceAccent,
    ...lightTheme.elevation.side,
  },
  sideLeft: {
    borderTopRightRadius: lightTheme.layout.photoRadius,
    borderBottomRightRadius: lightTheme.layout.photoRadius,
  },
  sideRight: {
    borderTopLeftRadius: lightTheme.layout.photoRadius,
    borderBottomLeftRadius: lightTheme.layout.photoRadius,
  },
  centrePanel: {
    width: DESIGN.centre.width,
    height: DESIGN.centre.height,
    borderRadius: lightTheme.layout.photoRadius,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...lightTheme.elevation.raised,
  },
  copy: { padding: lightTheme.space.md, gap: lightTheme.space.xxs },
});
