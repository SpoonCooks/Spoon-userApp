import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * "How to choose a duration?" — Figma `135:79`, table `135:93`.
 *
 * A 21pt `#FFE666` header row over 18pt data rows alternating `#FFF7CC` / `#FFEF99`, each at a
 * 5pt radius with a 6pt gap. Header type is Livvic SemiBold 10/15 uppercase at +0.5 tracking;
 * cells are Livvic Regular 10/15, centred. Columns are 84 / 84 / 85 at a 40pt gutter.
 *
 * ## Why this lives in `@ui`
 *
 * The final file draws this same table in TWO places: Home's marketing stack (`135:79`) and the
 * "Help me pick" sheet (`333:3643`) raised from the Duration step of Scheduled and Instant. One
 * drawing, one component — the alternative was a second copy in the booking features that would
 * be free to drift from Home's.
 *
 * RESPONSIVENESS: 84 + 40 + 84 + 40 + 85 needs 333pt. On a 320dp phone the column is 288, so a
 * fixed 40pt gutter would squeeze "Snacks/ sides/ roti" to nothing. The gutter therefore
 * COLLAPSES from the design 40 down to a 10pt floor as the column narrows, and the three tracks
 * divide what remains — the type is never shrunk to fit.
 *
 * The width is MEASURED rather than required as a prop, so a caller in a bottom sheet and a
 * caller in Home's fixed column both get the correct gutter without either of them computing it.
 *
 * This table is CONTENT, not logic. It does not drive, validate or constrain the duration options
 * offered anywhere in the booking flows — those are backend-owned.
 */

/** `135:98` — one row of the guide. Three cells, in drawn order. */
export interface DurationGuideRow {
  readonly people: string;
  readonly dish: string;
  readonly time: string;
}

export interface DurationGuideTableProps {
  readonly columns: readonly [string, string, string];
  readonly rows: readonly DurationGuideRow[];
  /**
   * Supplied by a caller that already knows its content width (Home measures its own column
   * once for the whole page). Omitted, the table measures itself.
   */
  readonly contentWidth?: number;
  readonly testID?: string;
}

/** `135:93` — the drawn geometry. */
const ROW_GAP = 6;
const HEADER_HEIGHT = 21;
const ROW_HEIGHT = 18;
const COLUMN_GAP = 40;
const MIN_COLUMN_GAP = 10;
/** 84 + 84 + 85 — the three tracks, without gutters. */
const TRACK_TOTAL = 253;

export function DurationGuideTable({
  columns,
  rows,
  contentWidth,
  testID = 'duration-guide-table',
}: DurationGuideTableProps) {
  const [measured, setMeasured] = useState<number | null>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasured(event.nativeEvent.layout.width);
  }, []);

  const width = contentWidth ?? measured;
  // Before the first layout the drawn gutter is used, so the first paint is the design's own
  // spacing rather than the 10pt floor flashing into 40.
  const columnGap =
    width === null
      ? COLUMN_GAP
      : Math.min(COLUMN_GAP, Math.max(MIN_COLUMN_GAP, (width - TRACK_TOTAL) / 2));

  return (
    <View style={styles.table} onLayout={onLayout} testID={testID}>
      <View style={[styles.row, styles.headerRow, { gap: columnGap }]}>
        {columns.map((column) => (
          <Text
            key={column}
            variant="labelUpper"
            color="textOnAccent"
            align="center"
            numberOfLines={1}
            style={styles.cell}
          >
            {column}
          </Text>
        ))}
      </View>

      {rows.map((row, index) => (
        <View
          key={`${row.people}-${row.dish}-${row.time}`}
          style={[
            styles.row,
            styles.dataRow,
            index % 2 === 0 ? styles.rowEven : styles.rowOdd,
            { gap: columnGap },
          ]}
          accessible
          accessibilityLabel={`${row.people} people, ${row.dish}, ${row.time}`}
        >
          {[row.people, row.dish, row.time].map((value, cellIndex) => (
            <Text
              key={value + String(cellIndex)}
              variant="caption"
              color="textOnAccent"
              align="center"
              numberOfLines={1}
              style={styles.cell}
            >
              {value}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { alignSelf: 'stretch', gap: ROW_GAP, ...lightTheme.elevation.hairline },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRadius: lightTheme.layout.rowRadius,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  dataRow: { height: ROW_HEIGHT },
  cell: { flex: 1, minWidth: 0 },
  rowEven: { backgroundColor: lightTheme.colors.surfaceAccent },
  rowOdd: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
});
