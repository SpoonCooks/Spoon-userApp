import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { LibraryDish } from '../types';

/**
 * A dish in the Meal Library grid — Figma `1:655`.
 *
 * A white card (6 inside, 12pt radius) holding a SQUARE photo tile — the frame's 113.22 × 113.22
 * in a 125.22 column — with the cook-time badge bottom-left and the add button bottom-right, and
 * the dish name 6 below it. The photo comes from the backend; until it does the tile keeps the
 * frame's plain `#FFF7CC`, which is all `1:658` draws.
 */
export interface DishCardProps {
  readonly dish: LibraryDish;
  readonly onAdd?: ((dish: LibraryDish) => void) | undefined;
  readonly testID?: string;
}

export function DishCard({ dish, onAdd, testID }: DishCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.photo}>
        {dish.imageUrl === undefined ? null : (
          <Image
            source={{ uri: dish.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        )}

        <View style={styles.timeBadge}>
          <Icon name="clock" size={10} color="textPrimary" />
          <Text variant="microStrong" color="textPrimary">
            {dish.cookMinutes}m
          </Text>
        </View>

        <Pressable
          onPress={() => onAdd?.(dish)}
          hitSlop={9}
          accessibilityRole="button"
          accessibilityLabel={`Add ${dish.name}`}
          testID={testID === undefined ? undefined : `${testID}-add`}
          style={({ pressed }) => [styles.add, pressed ? styles.pressed : null]}
        >
          <Icon name="plus" size={14} color="textWarmInk" />
        </Pressable>
      </View>

      <Text variant="dishName" color="textWarmDish" align="center" numberOfLines={1}>
        {dish.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `1:655` — white, 6 inside, a 12pt radius, `0 1 0 rgba(0,0,0,0.05)`; `1:656` gaps 6. */
  card: {
    flex: 1,
    gap: lightTheme.space.s6,
    padding: lightTheme.space.s6,
    borderRadius: lightTheme.radius.r12,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.ledge,
  },
  /** `1:657` — `#FFF7CC` at an 8pt radius, clipped. */
  photo: {
    aspectRatio: 1,
    borderRadius: lightTheme.radius.xs,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /**
   * `1:659` — 6 in from the left, 5.5 up; `#FFF7CC` at 95% inside a 1pt `#FFE666` edge, a 6pt
   * radius, 5.889 / 1.889 inside the edge, glyph and label 4 apart.
   */
  timeBadge: {
    position: 'absolute',
    left: lightTheme.space.s6,
    bottom: 5.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingHorizontal: 5.889,
    paddingVertical: 1.889,
    borderRadius: lightTheme.radius.r6,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderTimeBadge,
    backgroundColor: lightTheme.colors.surfaceTimeBadge,
  },
  /** `1:665` — a 26pt `#FFD600` square, 1pt `#F0C800` edge, 6pt radius, 6 in from the corner. */
  add: {
    position: 'absolute',
    right: lightTheme.space.s6,
    bottom: lightTheme.space.s6,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r6,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderAddButton,
    backgroundColor: lightTheme.colors.surfaceCta,
    ...lightTheme.elevation.addButton,
  },
  pressed: { opacity: 0.8 },
});
