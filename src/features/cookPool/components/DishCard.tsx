import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { DISH_HEART } from '../art';
import type { CookDish } from '../types';

/**
 * `Dish Card` — Figma `848:7809` (heart idle, `#D9D9D9`) and `848:7804` (favourited, `#FFD600`),
 * the same card on a cook's profile and on the deck card (`755:2333`, e.g.
 * `I1384:2942;1380:3081`).
 *
 * White, p 8, 4 between a 120pt photo and a Regular 12/16 `#333` name, at a 13pt radius: 136×156.
 * The heart (`848:7803`) sits on the photo's top-right corner; it shows only where the household
 * can favourite a dish (`onToggleFavourite`), and fills while the dish is a favourite.
 */
export interface DishCardProps {
  readonly dish: CookDish;
  readonly favourite?: boolean;
  /** Omit to draw the card with no heart. */
  readonly onToggleFavourite?: (() => void) | undefined;
  readonly testID?: string;
}

export function DishCard({
  dish,
  favourite = false,
  onToggleFavourite,
  testID = `dish-card-${dish.id}`,
}: DishCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.photo}>
        {dish.image === undefined ? null : (
          <Image source={dish.image} style={styles.image} resizeMode="contain" />
        )}
        {onToggleFavourite === undefined ? null : (
          <Pressable
            onPress={onToggleFavourite}
            hitSlop={HEART_SLOP}
            accessibilityRole="button"
            accessibilityLabel={`Favourite ${dish.name}`}
            accessibilityState={{ selected: favourite }}
            style={styles.heart}
            testID={`${testID}-favourite`}
          >
            <Image
              source={DISH_HEART}
              style={[styles.heartIcon, favourite ? styles.heartOn : styles.heartOff]}
            />
          </Pressable>
        )}
      </View>
      <Text variant="body" color="textDish" align="center" numberOfLines={2} style={styles.name}>
        {dish.name}
      </Text>
    </View>
  );
}

/** The 13×12 heart is far below a 44pt target; its touch area reaches past it on every side. */
const HEART_SLOP = { top: 12, right: 12, bottom: 16, left: 16 };

const PHOTO = 120;

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.sm,
    borderRadius: 13,
    backgroundColor: lightTheme.colors.surface,
    overflow: 'hidden',
  },
  photo: { width: PHOTO, height: PHOTO },
  image: { width: PHOTO, height: PHOTO },
  /** `848:7803` — 13×12 at x 107 / y 0 on the photo. */
  heart: { position: 'absolute', left: 107, top: 0 },
  heartIcon: { width: 13, height: 12 },
  heartOff: { tintColor: lightTheme.colors.iconIdle },
  /** `848:7806` — a favourited dish's heart, `#FFD600`. */
  heartOn: { tintColor: lightTheme.colors.surfaceBrand },
  /** `848:7802` — a long name wraps under the photo rather than widening the card. */
  name: { width: PHOTO },
});
