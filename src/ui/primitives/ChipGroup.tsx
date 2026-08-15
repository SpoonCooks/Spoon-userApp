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
 * `34:3485` — the start-time grid is drawn on a **85.5pt column pitch** over 75.55pt chips, so its
 * gutter is **10**, and its **40.1pt row pitch** over 31.2pt chips makes the row gap **8.9**.
 * Neither matches the 8/8 the Day and Time rows use.
 *
 * The slot chips are also CONTENT-SIZED in the frame, not stretched onto a 4-column track. That
 * distinction is what makes the grid responsive: forcing four equal columns onto a 320dp screen
 * leaves 64.5pt per chip against a 75.55pt chip, and every label ellipsized to "05:0…" on the
 * handset. Left at their drawn size they simply wrap — four per row at the 370pt reference and at
 * 393/412/430, three per row below ~365 — and no time is ever truncated and no type is scaled.
 */
const SLOT_HALF_GAP = 5;
const SLOT_ROW_GAP = 8.9;

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
  // Slot chips keep their drawn width and wrap; every other group may use a fixed column track.
  const width: DimensionValue = typeof columns === 'number' && !slot ? `${100 / columns}%` : 'auto';

  return (
    <View
      testID={testID}
      accessibilityRole="radiogroup"
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      style={[styles.container, slot ? styles.slotContainer : null]}
    >
      {options.map((option) => (
        <View
          key={option.id}
          style={[
            styles.cell,
            slot ? styles.slotCell : null,
            slot ? null : typeof columns === 'number' ? { width } : styles.auto,
          ]}
        >
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
  slotContainer: { marginHorizontal: -SLOT_HALF_GAP, marginBottom: -SLOT_ROW_GAP },
  cell: {
    paddingHorizontal: HALF_GAP,
    paddingBottom: lightTheme.space.sm,
  },
  slotCell: { paddingHorizontal: SLOT_HALF_GAP, paddingBottom: SLOT_ROW_GAP },
  auto: { flexGrow: 1, flexShrink: 1 },
});
