import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * A horizontally scrolling strip of pill tabs — first drawn as the Meal Library's meal strip
 * (Figma `cCQlzTeiObQkpVBzwI8mZi` `1:540`: Breakfast, Lunch, Dinner, …).
 *
 * Pills 6 apart, each 14 / 6 inside a full radius with a Livvic Bold 12/12 label: white behind
 * `#57534E` idle, `#FFD600` behind `#1C1917` with a `0 1 1 rgba(0,0,0,0.05)` lift selected. The
 * strip is 34 tall with the pills sitting 8 below its top.
 *
 * Renders exactly the `items` it is given, in order — the count is the data's, not the design's.
 *
 * `bleed` cancels the parent's horizontal gutter so the strip scrolls out from under the screen
 * edge (as "Drinks" does in the frame) while its first pill still lines up with that gutter.
 */
export interface PillTabItem {
  readonly id: string;
  readonly label: string;
}

export interface PillTabsProps {
  readonly items: readonly PillTabItem[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** The parent's horizontal padding, which the strip bleeds through. */
  readonly bleed?: number;
  readonly testID?: string;
}

/** A 24pt pill needs 10 each side to reach the 44pt minimum. */
const TOUCH_SLOP = { top: 10, bottom: 10, left: 3, right: 3 };

export function PillTabs({ items, selectedId, onSelect, bleed = 0, testID }: PillTabsProps) {
  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.strip, { marginHorizontal: -bleed }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: bleed }]}
      accessibilityRole="tablist"
      testID={testID}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            hitSlop={TOUCH_SLOP}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={testID === undefined ? undefined : `${testID}-${item.id}`}
            style={[styles.tab, selected ? styles.tabSelected : null]}
          >
            <Text variant="mealTab" color={selected ? 'textWarmInk' : 'textWarmMuted'}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 0 },
  /** `1:541` — the pills' centre sits 3 below the strip's: 8 above them, 2 below, in 34. */
  content: {
    gap: lightTheme.space.s6,
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
