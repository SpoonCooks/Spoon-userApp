import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * A vertical, scrolling rail of categories down a screen's left edge — first drawn as the Meal
 * Library's ingredient rail (Figma `cCQlzTeiObQkpVBzwI8mZi` `1:557`, "Fridge Ingredients").
 *
 * 92 wide on `#FAF8EE`, items 6 apart from 8 below its top, 4 in from each side. Each item is
 * 10 / 4 inside a 16pt radius: a 36pt art slot over a one-line Livvic 11/13.75 label, 6 apart.
 * Selected, the item fills `#FFF7CC` with a `0 1 1 rgba(0,0,0,0.05)` lift and the label turns
 * Black `#1C1917`; idle it is SemiBold `#57534E` on no fill.
 *
 * Renders exactly the `items` it is given — the count is the data's, not the design's.
 *
 * ART. A remote `imageUrl` drawn at 28pt (`1:562`) wins; otherwise an `emoji` (`1:569`), which is
 * how the frame draws most rows. With neither the slot stays empty — nothing is bundled and no
 * artwork is guessed from the label.
 */
export interface CategoryRailItem {
  readonly id: string;
  readonly label: string;
  readonly imageUrl?: string | undefined;
  readonly emoji?: string | undefined;
}

export interface CategoryRailProps {
  readonly items: readonly CategoryRailItem[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Extra room under the last item so it scrolls clear of the device's bottom inset. */
  readonly bottomInset?: number;
  readonly testID?: string;
}

export function CategoryRail({
  items,
  selectedId,
  onSelect,
  bottomInset = 0,
  testID,
}: CategoryRailProps) {
  return (
    <ScrollView
      style={styles.rail}
      contentContainerStyle={[styles.content, { paddingBottom: lightTheme.space.sm + bottomInset }]}
      showsVerticalScrollIndicator={false}
      accessibilityRole="tablist"
      testID={testID}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            testID={testID === undefined ? undefined : `${testID}-${item.id}`}
            style={[styles.item, selected ? styles.itemSelected : null]}
          >
            <View style={styles.art}>
              {item.imageUrl !== undefined ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              ) : item.emoji !== undefined ? (
                <Text
                  variant="railEmoji"
                  color="textWarmQuiet"
                  align="center"
                  importantForAccessibility="no"
                  style={styles.emoji}
                >
                  {item.emoji}
                </Text>
              ) : null}
            </View>
            <Text
              variant={selected ? 'railLabelActive' : 'railLabel'}
              color={selected ? 'textWarmInk' : 'textWarmMuted'}
              align="center"
              numberOfLines={1}
            >
              {item.label}
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
    paddingTop: lightTheme.space.sm,
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
  /**
   * The glyph's line box fills the slot (`railEmoji`) so iOS no longer clips it. Android's extra
   * font padding would push that box past the slot again, so it is dropped there.
   */
  emoji: { includeFontPadding: false, textAlignVertical: 'center' },
});
