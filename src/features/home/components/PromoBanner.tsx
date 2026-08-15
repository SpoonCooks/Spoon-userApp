import { Image, StyleSheet, View } from 'react-native';

import { Badge, Text, lightTheme } from '@ui';

import type { HomePromoViewModel } from '../types';

/**
 * Promo banner — Figma `59:520`.
 *
 * Deviation: the banner artwork is a Figma image that has not been exported, so the card falls
 * back to a token-coloured surface behind the copy. Layout, badge, copy and the slide indicators
 * match; only the photograph is missing.
 *
 * The offer copy and the slide count are server content — no discount is computed here.
 */
export interface PromoBannerProps {
  readonly promo: HomePromoViewModel;
}

export function PromoBanner({ promo }: PromoBannerProps) {
  return (
    <View
      style={styles.card}
      testID="home-promo"
      accessible
      accessibilityLabel={[promo.badge, promo.title, promo.subtitle].filter(Boolean).join('. ')}
    >
      {promo.imageUrl === undefined ? null : (
        <Image source={{ uri: promo.imageUrl }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.content}>
        <Badge label={promo.badge} tone="positive" uppercase />
        <Text variant="heading" color="textInverse">
          {promo.title}
        </Text>
        {promo.subtitle === undefined ? null : (
          <Text variant="caption" color="textInverse">
            {promo.subtitle}
          </Text>
        )}
      </View>

      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
        {Array.from({ length: promo.slideCount }, (_unused, index) => (
          <View
            key={index}
            style={[styles.dot, index === promo.activeSlide ? styles.dotActive : null]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 168,
    justifyContent: 'flex-end',
    borderRadius: lightTheme.layout.cardRadius,
    backgroundColor: lightTheme.colors.surfaceInverse,
    overflow: 'hidden',
  },
  image: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  content: { padding: lightTheme.layout.cardPadding, gap: lightTheme.space.xs },
  dots: {
    position: 'absolute',
    right: lightTheme.space.lg,
    bottom: lightTheme.space.lg,
    flexDirection: 'row',
    gap: lightTheme.space.xs,
  },
  dot: {
    width: lightTheme.space.sm,
    height: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceMuted,
    opacity: 0.5,
  },
  dotActive: { backgroundColor: lightTheme.colors.accentPrimary, opacity: 1, width: 16 },
});
