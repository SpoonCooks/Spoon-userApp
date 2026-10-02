import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';
import { GestureDetector, ScrollView } from 'react-native-gesture-handler';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { CookMenuSection } from '../types';
import { DishCard } from './DishCard';

/**
 * `Carousel list` — Figma `755:2359` (the deck card) and `719:1582` (the profile).
 *
 * py 16, 24 between sections, each a title and a row of dish cards that scrolls sideways: px 16,
 * 10 between cards, running past the right edge. Sections and dishes are drawn in the order the
 * backend sends them; a section with no dishes is left out.
 *
 * The deck titles its sections SemiBold 18/26 `#142C44` (`755:2362`); the profile, SemiBold
 * 14/20 black (`719:1585`).
 */
export interface CookMenuProps {
  readonly sections: readonly CookMenuSection[];
  readonly tone: 'card' | 'page';
  /** Hearts on, with these dishes filled. Omit for no hearts (`755:2364`). */
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
  tone,
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
                tone={tone}
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
              variant={tone === 'card' ? 'headingSection' : 'bodyLargeStrong'}
              color={tone === 'card' ? 'textMenuSection' : 'textPrimary'}
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
