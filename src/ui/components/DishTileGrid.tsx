import { StyleSheet, View } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

import { DishTile } from './DishTile';
import type { DishTileItem } from './DishTile';

/**
 * A two-column grid of `DishTile`s — Figma `cCQlzTeiObQkpVBzwI8mZi` `1:654`: two equal columns
 * 8 apart in both axes.
 *
 * Renders every dish it is given, however many that is; an odd last dish keeps half the width,
 * as a grid cell would, rather than stretching across both columns. It does not scroll — the
 * screen that holds it does.
 */
export interface DishTileGridProps<T extends DishTileItem> {
  readonly dishes: readonly T[];
  /** Omit to draw the tiles without add buttons. */
  readonly onAdd?: ((dish: T) => void) | undefined;
  /** Each tile's testID is this plus `-<dish id>`. */
  readonly testID?: string;
}

export function DishTileGrid<T extends DishTileItem>({
  dishes,
  onAdd,
  testID,
}: DishTileGridProps<T>) {
  const rows: (readonly [T, T | undefined])[] = [];
  for (let i = 0; i < dishes.length; i += 2) {
    rows.push([dishes[i] as T, dishes[i + 1]]);
  }

  const tile = (dish: T) => (
    <DishTile
      dish={dish}
      onAdd={onAdd === undefined ? undefined : () => onAdd(dish)}
      testID={testID === undefined ? undefined : `${testID}-${dish.id}`}
    />
  );

  return (
    <View style={styles.grid} testID={testID}>
      {rows.map(([left, right]) => (
        <View key={left.id} style={styles.row}>
          {tile(left)}
          {right === undefined ? <View style={styles.spacer} /> : tile(right)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: lightTheme.space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.sm },
  spacer: { flex: 1 },
});
