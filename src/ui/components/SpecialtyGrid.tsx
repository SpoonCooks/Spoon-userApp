import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { DishViewModel } from '@ui/types/viewModels';

import { DISH_GLYPHS, DISH_GLYPH_BOX, dishGlyphBox } from './dishGlyphs';

/**
 * The "cooks best" dish grid — Figma `94:947`, a 304.222pt block: 3 columns × 3 rows of 96 × 51
 * cells at an 8.111 column gutter and a **7.333** row gutter (the rows pitch at 58.333).
 *
 * Each cell (`94:948`) is NOT a plain chip. A `#FFE666` plate sits at the cell's BOTTOM — top
 * 16.111, height 34, radius 12, px 7.889 — carrying a Livvic Regular 9/13.5 centred label whose
 * box starts **18pt** below the plate's top edge (`94:950`), and a 31pt circle holding the dish
 * glyph overlaps that top edge by 14.889.
 *
 * The label used to be pinned 7.889 from the plate's BOTTOM, which floated it ~7pt high inside
 * the plate; it is now anchored at the designed 18.
 *
 * Nine is treated as a DISPLAY CAP, not a data guarantee: the grid truncates a longer list and
 * renders fewer chips for a shorter one, rather than assuming the server always sends nine.
 *
 * GLYPHS (task §10): the marks are the bundled Figma set — see `dishGlyphs.ts` for why they are a
 * catalogue rather than scattered `require()` calls, and for the rule that this component never
 * chooses a glyph. A remote `glyphUrl` wins; otherwise the supplied `glyph` key is resolved; if
 * neither is given the disc stays empty, and no glyph is invented from the label.
 */

const COLUMNS = 3;
const DISPLAY_CAP = 9;

/** `94:952` — the 31pt circle overlapping the plate. */
const CIRCLE = 31;
/** `94:948` / `94:949` — a 51pt cell whose 34pt plate starts at 16.111. */
const CELL_HEIGHT = 51;
const PLATE_HEIGHT = 34;
const PLATE_TOP = 16.111;
/** `94:950` — the label box sits 18pt below the plate's top edge. */
const LABEL_TOP = 18;
/** `94:947` — 8.111 between columns, 7.333 between rows. They are not the same value. */
const COLUMN_GAP = 8.111;
const ROW_GAP = 7.333;

export interface SpecialtyGridProps {
  readonly dishes: readonly DishViewModel[];
  readonly testID?: string;
}

export function SpecialtyGrid({ dishes, testID = 'specialty-grid' }: SpecialtyGridProps) {
  const visible = dishes.slice(0, DISPLAY_CAP);

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid} testID={testID}>
      {visible.map((dish) => {
        const box = dish.glyph === undefined ? DISH_GLYPH_BOX : dishGlyphBox(dish.glyph);
        const source =
          dish.glyphUrl !== undefined
            ? { uri: dish.glyphUrl }
            : dish.glyph === undefined
              ? undefined
              : DISH_GLYPHS[dish.glyph];

        return (
          <View key={dish.id} style={styles.cell} accessible accessibilityLabel={dish.label}>
            <View style={styles.plate}>
              <Text variant="micro" color="textPrimary" align="center" numberOfLines={1}>
                {dish.label}
              </Text>
            </View>

            <View style={styles.circle}>
              {source === undefined ? null : (
                <Image
                  source={source}
                  style={{ width: box, height: box }}
                  resizeMode="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    marginHorizontal: -COLUMN_GAP / 2,
  },
  cell: {
    width: `${100 / COLUMNS}%`,
    height: CELL_HEIGHT + ROW_GAP,
    paddingHorizontal: COLUMN_GAP / 2,
    paddingBottom: ROW_GAP,
  },
  /** `94:949` — the `#FFE666` plate, pinned to the cell's bottom 34pt. */
  plate: {
    position: 'absolute',
    top: PLATE_TOP,
    left: COLUMN_GAP / 2,
    right: COLUMN_GAP / 2,
    height: PLATE_HEIGHT,
    paddingTop: LABEL_TOP,
    paddingHorizontal: 7.889,
    borderRadius: lightTheme.layout.optionRadius,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  /** `94:952` — centred horizontally, overlapping the plate's top edge by 14.889. */
  circle: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
});
