import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { LibraryIngredient } from '../types';

/**
 * The vertical ingredient rail down the left edge — Figma `1:557` ("Fridge Ingredients").
 *
 * 92 wide on `#FAF8EE`, items 6 apart from 8 below its top, 4 in from each side. Each item is
 * 10 / 4 inside a 16pt radius: a 36pt art slot over a one-line Livvic 11/13.75 label, 6 apart.
 * Selected, the item fills `#FFF7CC` with a `0 1 1 rgba(0,0,0,0.05)` lift and the label turns
 * Black `#1C1917`; idle it is SemiBold `#57534E` on no fill.
 *
 * The art is a backend image drawn at 28pt (`1:562`), or — as the frame draws most rows — an
 * emoji at 30/30 (`1:569`). With neither, the slot stays empty, which is what `1:562` shows.
 */
export interface IngredientRailProps {
  readonly ingredients: readonly LibraryIngredient[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  /** Extra room under the last item so it scrolls clear of the device's bottom inset. */
  readonly bottomInset?: number;
  readonly testID?: string;
}

export function IngredientRail({
  ingredients,
  selectedId,
  onSelect,
  bottomInset = 0,
  testID,
}: IngredientRailProps) {
  return (
    <ScrollView
      style={styles.rail}
      contentContainerStyle={[styles.content, { paddingBottom: lightTheme.space.sm + bottomInset }]}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {ingredients.map((ingredient) => {
        const selected = ingredient.id === selectedId;
        return (
          <Pressable
            key={ingredient.id}
            onPress={() => onSelect(ingredient.id)}
            accessibilityRole="tab"
            accessibilityLabel={ingredient.label}
            accessibilityState={{ selected }}
            testID={testID === undefined ? undefined : `${testID}-${ingredient.id}`}
            style={[styles.item, selected ? styles.itemSelected : null]}
          >
            <View style={styles.art}>
              {ingredient.imageUrl !== undefined ? (
                <Image
                  source={{ uri: ingredient.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              ) : ingredient.emoji !== undefined ? (
                <Text variant="railEmoji" color="textWarmQuiet" importantForAccessibility="no">
                  {ingredient.emoji}
                </Text>
              ) : null}
            </View>
            <Text
              variant={selected ? 'railLabelActive' : 'railLabel'}
              color={selected ? 'textWarmInk' : 'textWarmMuted'}
              align="center"
              numberOfLines={1}
            >
              {ingredient.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: { width: 92, flexGrow: 0, backgroundColor: lightTheme.colors.surfaceRail },
  content: {
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.sm,
  },
  item: {
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s10,
    borderRadius: lightTheme.radius.md,
  },
  itemSelected: {
    backgroundColor: lightTheme.colors.surfaceAccent,
    ...lightTheme.elevation.badge,
  },
  /** `1:560` — a 36pt slot (a 32pt box with 2 above and below). */
  art: { height: 36, minWidth: 32, alignItems: 'center', justifyContent: 'center' },
  image: { width: 28, height: 28 },
});
