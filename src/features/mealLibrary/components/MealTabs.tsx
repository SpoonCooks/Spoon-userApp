import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { MealSlot } from '../types';

/**
 * The horizontal meal strip under the header — Figma `1:540`.
 *
 * Pills 6 apart, each 14 / 6 inside a full radius with a Livvic Bold 12/12 label: white behind
 * `#57534E` idle, `#FFD600` behind `#1C1917` with a `0 1 1 rgba(0,0,0,0.05)` lift selected. The
 * strip is 34 tall with the pills sitting 8 below its top.
 *
 * It bleeds to the screen edges, so the last tab scrolls out from under the edge (as "Drinks"
 * does in the frame) rather than stopping at the header's 12pt gutter.
 */
export interface MealTabsProps {
  readonly meals: readonly MealSlot[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly testID?: string;
}

/** A 24pt pill needs 10 each side to reach the 44pt minimum. */
const TOUCH_SLOP = { top: 10, bottom: 10, left: 3, right: 3 };

export function MealTabs({ meals, selectedId, onSelect, testID }: MealTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      {meals.map((meal) => {
        const selected = meal.id === selectedId;
        return (
          <Pressable
            key={meal.id}
            onPress={() => onSelect(meal.id)}
            hitSlop={TOUCH_SLOP}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={testID === undefined ? undefined : `${testID}-${meal.id}`}
            style={[styles.tab, selected ? styles.tabSelected : null]}
          >
            <Text variant="mealTab" color={selected ? 'textWarmInk' : 'textWarmMuted'}>
              {meal.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** The header's own 12pt gutter, which the strip cancels and then re-applies inside itself. */
const GUTTER = lightTheme.space.md;

const styles = StyleSheet.create({
  strip: { flexGrow: 0, marginHorizontal: -GUTTER },
  /** `1:541` — the pills' centre sits 3 below the strip's: 8 above them, 2 below, in 34. */
  content: {
    gap: lightTheme.space.s6,
    paddingHorizontal: GUTTER,
    paddingTop: lightTheme.space.sm,
    paddingBottom: lightTheme.space.xxs,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surface,
  },
  tabSelected: {
    backgroundColor: lightTheme.colors.surfaceCta,
    ...lightTheme.elevation.badge,
  },
});
