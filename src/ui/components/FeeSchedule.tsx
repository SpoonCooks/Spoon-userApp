import { StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The cancellation fee schedule — Figma `6:17`.
 *
 * An `#FFF7CC` card at a 24pt radius with 15.889pt padding and a `0 0 1 rgba(0,0,0,0.15)` lift.
 * Inside: a 21pt header row in Livvic SemiBold 10/15 at +0.5, uppercased, then one row per tier —
 * Livvic Medium 11/16.5 in `#0F172B` against a right-aligned Livvic Bold 12/16 in black, 6pt
 * apart with NO separators.
 *
 * BOUNDARY: this is published policy CONTENT, supplied whole. The client never evaluates which
 * tier applies to a booking, and never turns a percentage into an amount — the fee that is
 * actually charged is a server value shown on the refund step
 * (FRONTEND_FOUNDATION_PLAN.md §20).
 *
 * Defect D-12 is CLOSED by the current file: the first tier no longer reads an absolute `₹0`
 * under a "Fee as percentage" column — `6:22` now reads **"Free"** in `#01CF8F`. The tone is a
 * property of the supplied row, not something this component infers from the string.
 */
export interface FeeScheduleRow {
  readonly label: string;
  readonly value: string;
  /** `6:22` — render the value in the "free" green. Supplied; never derived from the text. */
  readonly free?: boolean;
}

export interface FeeScheduleProps {
  readonly columns: readonly [string, string];
  readonly rows: readonly FeeScheduleRow[];
  readonly testID?: string;
}

export function FeeSchedule({ columns, rows, testID = 'fee-schedule' }: FeeScheduleProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text variant="labelUpper" color="textPrimary" style={styles.label}>
            {columns[0]}
          </Text>
          <Text
            variant="labelUpper"
            color="textPrimary"
            align="right"
            numberOfLines={1}
            style={styles.headerValue}
          >
            {columns[1]}
          </Text>
        </View>

        {rows.map((row) => (
          <View
            key={row.label}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.label}: ${row.value}`}
          >
            <Text variant="labelMedium" color="textStrong" style={styles.label}>
              {row.label}
            </Text>
            <Text
              variant="bodyBold"
              color={row.free === true ? 'textFree' : 'textPrimary'}
              align="right"
              style={styles.value}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `6:17` — `#FFF7CC`, 24pt radius, 15.889pt padding. */
  card: {
    alignSelf: 'stretch',
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfaceAccent,
    ...lightTheme.elevation.hairline,
  },
  /** `6:25` — 6pt between rows, 4pt of lead-in. */
  table: { gap: lightTheme.space.s6, paddingTop: lightTheme.space.xs },
  /** `6:26` — a 21pt header band, 8pt gutter. */
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.sm },
  /** `107:2567` — the 182pt measure the tier descriptions wrap inside. */
  label: { flex: 1 },
  value: { width: 64 },
  /**
   * The COLUMN is 64pt, which fits "50%" but not the header "FEE AS PERCENTAGE" — on the handset
   * it wrapped to "FEE AS PER / CENTAGE", which the frame does not do. The header sizes to its own
   * content and right-aligns to the same edge; only the data column is fixed.
   */
  headerValue: { flexShrink: 0 },
});
