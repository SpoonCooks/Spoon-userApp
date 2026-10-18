import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';
import { GestureDetector, ScrollView } from 'react-native-gesture-handler';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { CookMenuSection } from '../types';
import { DishCard } from './DishCard';

/**
 * `Carousel list` — Figma `I1384:2942;1380:3076` (the deck card, `755:2333`) and `719:1582` (the
 * profile): the same list in both.
 *
 * py 16, 24 between sections, each a title and a row of dish cards that scrolls sideways: px 16,
 * 10 between cards, running past the right edge; 12 between the title and the row. Sections and
 * dishes are drawn in the order the backend sends them; a section with no dishes is left out.
 *
 * A section's title is SemiBold 14/20 black (`I1384:2942;1380:3079`, `719:1585`).
 */
export interface CookMenuProps {
  readonly sections: readonly CookMenuSection[];
  /** Hearts on, with these dishes filled. Omit for no hearts. */
  readonly favourites?: ReadonlySet<string> | undefined;
  readonly onToggleFavourite?: ((dishId: string) => void) | undefined;
  /**
   * One native gesture per section, for a parent whose own pan must give way to a row's sideways
   * scroll (the deck card).
   */
  readonly rowGestures?: readonly GestureType[] | undefined;
  readonly testID?: string;
}

export function CookMenu({
  sections,
  favourites,
  onToggleFavourite,
  rowGestures,
  testID = 'cook-menu',
}: CookMenuProps) {
  return (
    <View style={styles.list} testID={testID}>
      {sections.map((section, index) => {
        if (section.dishes.length === 0) return null;
        const row: ReactElement = (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            testID={`${testID}-${section.id}`}
          >
            {section.dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                favourite={favourites?.has(dish.id) ?? false}
                onToggleFavourite={
                  onToggleFavourite === undefined ? undefined : () => onToggleFavourite(dish.id)
                }
              />
            ))}
          </ScrollView>
        );
        const gesture = rowGestures?.[index];
        return (
          <View key={section.id} style={styles.section}>
            <Text
              variant="bodyLargeStrong"
              color="textPrimary"
              style={styles.title}
              accessibilityRole="header"
            >
              {section.title}
            </Text>
            {gesture === undefined ? (
              row
            ) : (
              <GestureDetector gesture={gesture}>{row}</GestureDetector>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: lightTheme.space.xl, paddingVertical: lightTheme.space.lg },
  section: { gap: lightTheme.space.md },
  title: { paddingHorizontal: lightTheme.space.lg },
  /** `stretch`: cards in a row share the tallest one's height when a name wraps. */
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.lg,
  },
});
