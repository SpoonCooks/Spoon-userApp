import { StyleSheet, View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { Chip } from './Chip';
import type { ChipDensity } from './Chip';
import type { IconName } from './Icon';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Single-select group of chips, laid out as a wrapping row or a fixed-column grid.
 *
 * Used by Day / Time / Start time / Dietary preference / Tip. The available options and their
 * enabled state are always supplied by the caller — this component performs no availability,
 * pricing or scheduling logic.
 */

export interface ChipOption {
  /** Opaque id supplied by the caller. Never generated or interpreted here. */
  readonly id: string;
  readonly label: string;
  readonly caption?: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
}

export interface ChipGroupProps {
  readonly options: readonly ChipOption[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** `row` wraps horizontally; a number lays out a fixed-column grid (4 for Start time). */
  readonly columns?: number | 'row';
  /** `slot` switches to the start-time grid's own chip and gutter geometry (`34:3485`). */
  readonly density?: ChipDensity;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

/** `34:3049` — the Day / Time rows are drawn at an 8pt gutter. */
const HALF_GAP = lightTheme.space.xs;

/**
 * `34:3485` in the V8 file, measured node by node.
 *
 * The grid is 330 wide and holds FOUR chips of **76.5** at x 0 / 84.5 / 169 / 253.5, seven rows
 * deep at y 6 / 50 / 95 / 140 / 185 / 230 / 275, each chip 36–37 tall. Both gutters are therefore
 * **8**, and the arithmetic closes exactly: 4 x 76.5 + 3 x 8 = 330, the frame's own width.
 *
 * That last identity is the point. The columns FILL their container; 76.5 is not an intrinsic
 * chip width, it is what a quarter of 330 comes to once the three gutters are removed. Every chip
 * in the frame is the same width whatever time it carries.
 *
 * ## Why the chips are no longer content-sized
 *
 * They used to be, to avoid truncating "05:00 AM" on a 320dp handset. It solved that by
 * abandoning the grid: a row of chips whose widths follow their labels has ragged columns, uneven
 * gaps wherever a row wraps early, and no alignment down the screen — which is exactly the defect
 * this replaces.
 *
 * Laying each row out as a flex row of equal `flex: 1` cells keeps BOTH properties. At the
 * frame's own 330 the cells come to 76.5 and the grid is pixel-identical to Figma; at 320dp they
 * come to 64, which still clears the ~55pt a time label needs, so nothing is truncated and no
 * type is scaled. The gutters stay 8 at every width because `gap` is not part of the division.
 *
 * A short final row is padded with empty cells rather than letting its chips stretch, so the last
 * row aligns to the same column track as every row above it.
 */
const SLOT_GAP = lightTheme.space.sm;

/** Splits the options into fixed-size rows so each row can own its own column track. */
function rowsOf<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

export function ChipGroup({
  options,
  selectedId,
  onSelect,
  columns = 'row',
  density = 'default',
  accessibilityLabel,
  testID = 'chip-group',
}: ChipGroupProps) {
  const slot = density === 'slot';
  const width: DimensionValue = typeof columns === 'number' ? `${100 / columns}%` : 'auto';
  const group = {
    testID,
    accessibilityRole: 'radiogroup' as const,
    ...(accessibilityLabel === undefined ? {} : { accessibilityLabel }),
  };

  const chipFor = (option: ChipOption) => (
    <Chip
      label={option.label}
      {...(option.caption === undefined ? {} : { caption: option.caption })}
      {...(option.icon === undefined ? {} : { icon: option.icon })}
      selected={selectedId === option.id}
      disabled={option.disabled ?? false}
      density={density}
      onPress={() => onSelect(option.id)}
      testID={`${testID}-${option.id}`}
    />
  );

  if (slot) {
    // `columns` is the frame's own track count (4 on `34:3485`); a `row` caller falls back to it.
    const perRow = typeof columns === 'number' ? columns : 4;

    return (
      <View {...group} style={styles.slotGrid}>
        {rowsOf(options, perRow).map((row, rowIndex) => (
          <View key={`slot-row-${rowIndex}`} style={styles.slotRow}>
            {row.map((option) => (
              <View key={option.id} style={styles.slotCell}>
                {chipFor(option)}
              </View>
            ))}
            {/* Holds the track open so a short last row does not stretch across it. */}
            {Array.from({ length: perRow - row.length }, (_, spacer) => (
              <View key={`slot-spacer-${rowIndex}-${spacer}`} style={styles.slotCell} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  /**
   * The row-gutter correction below is only correct when there IS a row to correct.
   *
   * With no options the group has no cell carrying `paddingBottom`, so the negative margin has
   * nothing to cancel and instead shortens the group to −8. Its parent section then measures 8pt
   * shorter than its own label, and the label is drawn CLIPPED THROUGH THE MIDDLE — which is the
   * "Start time is cut off" defect in task §2: an empty slot list (a day/daypart the server
   * offers nothing for) cropped the heading above it rather than simply showing nothing.
   */
  const empty = options.length === 0;

  return (
    <View {...group} style={[styles.container, empty ? styles.empty : null]}>
      {options.map((option) => (
        <View
          key={option.id}
          style={[styles.cell, typeof columns === 'number' ? { width } : styles.auto]}
        >
          {chipFor(option)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Row spacing is carried as `paddingBottom` on each cell, which means the LAST row pads the
   * bottom of the group too. That trailing space is not drawn in any frame — on the handset it
   * added 8pt under every chip row — so it is pulled back off the container.
   */
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -HALF_GAP,
    marginBottom: -lightTheme.space.sm,
  },
  cell: {
    paddingHorizontal: HALF_GAP,
    paddingBottom: lightTheme.space.sm,
  },
  /**
   * `gap` rather than the negative-margin trick the wrapping groups use: the rows are explicit
   * here, so the gutters can be stated once and cannot leave a trailing row of padding to cancel.
   * It also removes the empty-list hazard entirely — no cells, no margin to pull back, nothing to
   * shorten the section and clip the label above it.
   */
  slotGrid: { rowGap: SLOT_GAP },
  slotRow: { flexDirection: 'row', columnGap: SLOT_GAP },
  /** Equal quarters of whatever the row is wide, with the gutters already taken out by `gap`. */
  slotCell: { flex: 1 },
  /** No cells, no trailing row padding, so nothing to pull back off. */
  empty: { marginBottom: 0 },
  auto: { flexGrow: 1, flexShrink: 1 },
});
