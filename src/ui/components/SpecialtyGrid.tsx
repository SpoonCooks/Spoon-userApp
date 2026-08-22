import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { DishViewModel } from '@ui/types/viewModels';

import { DISH_GLYPHS, DISH_GLYPH_BOX, dishGlyphBox } from './dishGlyphs';

/**
 * The "cooks best" dish grid — Figma `289:7552`: 3 columns × 3 rows of 96 × 50 cells at an
 * **8pt gutter in BOTH axes** (the superseded revision drew 8.111 across and 7.333 down).
 *
 * Each cell (`289:7553`) is NOT a plain chip. A `#FFE666` plate sits at the cell's BOTTOM — top
 * 16.111, height 34, radius 12, px 7.889 — carrying a Livvic Regular 9/13.5 centred label whose
 * box starts **18pt** below the plate's top edge (`289:7555`), and a 31pt circle holding the dish
 * glyph overlaps that top edge by 14.889.
 *
 * The circle is `Ellipse 8` (`289:7558`): **white with a 1pt `#FFE666` stroke**, not the flat
 * `#FFEF99` fill the implementation drew. On a white card the difference is the ring itself,
 * which is what separates the glyph from the plate behind it.
 *
 * Nine is treated as a DISPLAY CAP, not a data guarantee: the grid truncates a longer list and
 * renders fewer chips for a shorter one, rather than assuming the server always sends nine.
 *
 * GLYPHS (task §10): the marks are the bundled Figma set — see `dishGlyphs.ts` for why they are a
 * catalogue rather than scattered `require()` calls, and for the rule that this component never
 * chooses a glyph. A remote `glyphUrl` wins; otherwise the supplied `glyph` key is resolved; if
 * neither is given the disc stays empty, and no glyph is invented from the label.
 */

/** `289:7552` — three tracks, and the cap is three rows of them. */
const DISPLAY_CAP = 9;

/** `289:7558` — the 31pt circle overlapping the plate. */
const CIRCLE = 31;
/** `289:7553` / `289:7554` — a 50pt cell whose 34pt plate starts at 16.111. */
const CELL_HEIGHT = 50;
const PLATE_HEIGHT = 34;
const PLATE_TOP = 16.111;
/** `289:7555` — the label box sits 18pt below the plate's top edge. */
const LABEL_TOP = 18;
/** `289:7552` — `gap-x-[8px] gap-y-[8px]`. */
const COLUMN_GAP = 8;
const ROW_GAP = 8;

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
  /**
   * Real `columnGap` / `rowGap` rather than per-cell padding: the previous form added a trailing
   * `ROW_GAP` beneath the LAST row, which the frame does not draw (`289:7552` measures
   * 3 × 50 + 2 × 8 = 166, not 174).
   */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    columnGap: COLUMN_GAP,
    rowGap: ROW_GAP,
  },
  /**
   * A 30 % basis that GROWS. Three cells plus two 8pt gutters always fit (90 % + 16pt ≤ 100 % for
   * any row wider than 160pt) and a fourth never can (120 % > 100 %), so the wrap lands on three
   * per row at every width without measuring, and the three then share the row exactly.
   */
  cell: { flexBasis: '30%', flexGrow: 1, minWidth: 0, height: CELL_HEIGHT },
  /** `289:7554` — the `#FFE666` plate, pinned to the cell's bottom 34pt. */
  plate: {
    position: 'absolute',
    top: PLATE_TOP,
    left: 0,
    right: 0,
    height: PLATE_HEIGHT,
    paddingTop: LABEL_TOP,
    paddingHorizontal: 7.889,
    borderRadius: lightTheme.layout.optionRadius,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  /**
   * `289:7558` — centred horizontally, overlapping the plate's top edge by 14.889: white, with
   * the 1pt `#FFE666` ring the frame draws.
   */
  circle: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfaceAccentBold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
});
