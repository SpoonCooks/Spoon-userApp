import { StyleSheet, View } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_DESIGN, useHomeContentWidth } from '../layout';
import type { HomeDurationGuideRow } from '../types';
import { SectionTitle, sectionStyles } from './SectionTitle';

const { matrix: DESIGN } = HOME_DESIGN;

/**
 * "How to choose a duration?" — Figma Page 3a `135:79`, re-read on `209:1305`.
 *
 * A 21pt `#FFE666` header row over 18pt data rows alternating `#FFF7CC` / `#FFEF99`, each at a
 * 5pt radius with a 6pt gap. Header type is Livvic SemiBold 10/15 uppercase at +0.5 tracking;
 * cells are Livvic Regular 10/15, centred. Columns are 84 / 84 / 85 at a 40pt gutter.
 *
 * RESPONSIVENESS: 84 + 40 + 84 + 40 + 85 needs 333pt. On a 320dp phone the column is 288, so a
 * fixed 40pt gutter would squeeze "Snacks/ sides/ roti" to nothing. The gutter therefore
 * COLLAPSES from the design 40 down to a 10pt floor as the column narrows, and the three tracks
 * divide what remains — the type is never shrunk to fit (task §7). At the reference column the
 * gutter is the full 40 and the tracks land on 84.3 / 84.3 / 84.3.
 *
 * This table is CONTENT, not logic. It does not drive, validate or constrain the duration options
 * offered anywhere in the booking flows — those are backend-owned.
 */
export interface HomeDurationMatrixProps {
  readonly title: string;
  readonly columns: readonly [string, string, string];
  readonly rows: readonly HomeDurationGuideRow[];
}

export function HomeDurationMatrix({ title, columns, rows }: HomeDurationMatrixProps) {
  const content = useHomeContentWidth();
  const spare = content - 2 * DESIGN.rowPaddingHorizontal - DESIGN.trackTotal;
  const columnGap = Math.min(DESIGN.columnGap, Math.max(DESIGN.minColumnGap, spare / 2));

  return (
    <View style={sectionStyles.section} testID="home-duration-guide">
      <SectionTitle>{title}</SectionTitle>

      <View style={styles.table}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  table: { alignSelf: 'stretch', gap: DESIGN.rowGap, ...lightTheme.elevation.hairline },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: DESIGN.rowPaddingHorizontal,
    borderRadius: lightTheme.layout.rowRadius,
  },
  headerRow: {
    height: DESIGN.headerHeight,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  dataRow: { height: DESIGN.rowHeight },
  cell: { flex: 1, minWidth: 0 },
  rowEven: { backgroundColor: lightTheme.colors.surfaceAccent },
  rowOdd: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
});
