import { Fragment } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { SummaryHistoryRow, SummaryHistoryStatus } from '../../data/summary';
import { SUMMARY_CANCELLED_GLYPH, SUMMARY_CHEVRON_GLYPH, SUMMARY_DONE_GLYPH } from './assets';

/**
 * `Visit history` — Figma `1017:557`: a heading row ("Visit history" left, the count right, both at
 * line-height normal), 8 above a list in a 1pt `#FFEF99` outline at a 16pt radius (px 12 / py 4).
 * Each row is py 10 with 12 gaps: a 36pt status disc — `Glyph/done` (`1017:563`, `#CFFF04` behind
 * a 20pt tick) or `Glyph/cancelled` (`1017:6047`, 3 % black behind an 18pt cross) — the date line
 * over a `#6B6B6B` meta line (2 apart), and a 20pt chevron. Rows are split by a 1pt `#FFEF99` rule.
 */
export interface VisitHistoryProps {
  readonly countLabel: string;
  readonly rows: readonly SummaryHistoryRow[];
  readonly onRowPress?: (rowId: string) => void;
  readonly testID?: string;
}

const STATUS_DISC = {
  done: { glyph: SUMMARY_DONE_GLYPH, size: 20, fill: lightTheme.colors.surfacePositiveBright },
  cancelled: {
    glyph: SUMMARY_CANCELLED_GLYPH,
    size: 18,
    fill: lightTheme.colors.surfaceSummaryCancelled,
  },
} as const satisfies Record<SummaryHistoryStatus, unknown>;

export function VisitHistory({
  countLabel,
  rows,
  onRowPress,
  testID = 'summary-visit-history',
}: VisitHistoryProps) {
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.header}>
        <Text variant="summaryHistoryTitle" color="textPrimary">
          Visit history
        </Text>
        <Text variant="recurringMeta" color="textRecurringMeta">
          {countLabel}
        </Text>
      </View>

      <View style={styles.list}>
        {rows.map((row, index) => {
          const disc = STATUS_DISC[row.status];
          return (
            <Fragment key={row.id}>
              {index === 0 ? null : <View style={styles.divider} />}
              <Pressable
                onPress={() => onRowPress?.(row.id)}
                accessibilityRole="button"
                style={styles.row}
                testID={`${testID}-row-${row.id}`}
              >
                <View style={[styles.disc, { backgroundColor: disc.fill }]}>
                  <Image source={disc.glyph} style={{ width: disc.size, height: disc.size }} />
                </View>
                <View style={styles.lines}>
                  <Text variant="summaryRowTitle" color="textPrimary" numberOfLines={1}>
                    {row.title}
                  </Text>
                  <Text variant="recurringMeta" color="textRecurringMeta" numberOfLines={1}>
                    {row.meta}
                  </Text>
                </View>
                <Image source={SUMMARY_CHEVRON_GLYPH} style={styles.chevron} />
              </Pressable>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: lightTheme.space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.xs,
    borderWidth: 1,
    borderColor: lightTheme.colors.surfaceAccentStrong,
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingVertical: lightTheme.space.s10,
  },
  disc: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lines: { flex: 1, gap: lightTheme.space.xxs },
  chevron: { width: 20, height: 20 },
  divider: { height: 1, backgroundColor: lightTheme.colors.surfaceAccentStrong },
});
