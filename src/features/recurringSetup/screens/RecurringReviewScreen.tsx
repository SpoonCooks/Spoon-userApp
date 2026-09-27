import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  DetailRows,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
} from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoReviewPlan, buildDemoVisitCharges } from '../data';

/**
 * Recurring setup — Step 4 "Review plan".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state `2g`
 * ("Step 4 · Review plan"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md — a wireframe, not a
 * pixel-accurate mock. Top to bottom, as drawn: plan totals and date range, one summary line per
 * visit (time · duration · which days · price excl. tax), "Edit days or times", then "Day by day" —
 * every chosen day with each visit's time as its own pill — then "Keep my plan going" and the
 * per-visit charge incl. tax above the CTA.
 *
 * Built from existing pieces: `DetailRows` for the per-visit lines (the app's label/value table),
 * `ListRow` + `Badge` for each day and its time pills, `SectionHeader`, `Card`, `Button`.
 *
 * STATIC ONLY, per task: the plan and the charges are fixture data (`buildDemoReviewPlan`,
 * `buildDemoVisitCharges`) — this step isn't wired to Steps 1–3. "Edit days or times" is left
 * unwired, and "Keep my plan going" is local UI state that nothing persists.
 */

export interface RecurringReviewScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (keepPlanGoing: boolean) => void;
  /** "Edit days or times" — back into Steps 1–3. Left unwired for now, like `onContinue`. */
  readonly onEdit?: () => void;
  readonly testID?: string;
}

export function RecurringReviewScreen({
  onBack,
  onContinue,
  onEdit,
  testID = 'recurring-review-screen',
}: RecurringReviewScreenProps) {
  const { summary, dates } = useMemo(() => buildDemoReviewPlan(), []);
  const charges = useMemo(() => buildDemoVisitCharges(), []);
  const [keepPlanGoing, setKeepPlanGoing] = useState(true);

  const chargeNote = `Nothing is charged today. Each visit is charged before it happens: ${charges
    .map((charge) => `${charge.amount} (${charge.visitLabel})`)
    .join(' · ')}, incl. 5% tax.`;

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Review plan" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <Text variant="caption" color="textSecondary">
            {chargeNote}
          </Text>
          <Button
            label="Set up autopay"
            onPress={() => onContinue?.(keepPlanGoing)}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      <Card tone="surface" style={styles.summaryCard} testID={`${testID}-summary`}>
        <View style={styles.totals}>
          <Text variant="titleBlack" color="textPrimary">
            {summary.daysCount} days · {summary.visitsCount} visits
          </Text>
          <Text variant="caption" color="textSecondary">
            {summary.rangeLabel}
          </Text>
        </View>
        <DetailRows
          rows={summary.visits.map((visit) => ({ label: visit.label, value: visit.price }))}
          variant="booking"
          testID={`${testID}-visit-lines`}
        />
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          hitSlop={lightTheme.space.sm}
          style={styles.editLink}
          testID={`${testID}-edit`}
        >
          <Text variant="label" color="textPrimary" style={styles.underline}>
            Edit days or times
          </Text>
        </Pressable>
      </Card>

      <View>
        <SectionHeader title="Day by day" />
        <View style={styles.days}>
          {dates.map((row) => (
            <Card
              key={row.id}
              tone="surface"
              padded={false}
              style={styles.dayCard}
              testID={`${testID}-day-${row.id}`}
            >
              <ListRow
                title={row.label}
                trailing={
                  <View style={styles.times}>
                    {row.times.map((time, index) => (
                      <Badge key={`${row.id}-${index}`} label={time} />
                    ))}
                  </View>
                }
              />
            </Card>
          ))}
        </View>
      </View>

      <Card tone="surface" testID={`${testID}-keep-going-card`}>
        <View style={styles.keepGoingRow}>
          <View style={styles.keepGoingText}>
            <Text variant="bodyStrong" color="textPrimary">
              Keep my plan going
            </Text>
            <Text variant="caption" color="textSecondary">
              When a day is done, add the next one on the same pattern (stays within 14 days)
            </Text>
          </View>
          <Switch
            value={keepPlanGoing}
            onValueChange={setKeepPlanGoing}
            trackColor={{
              false: lightTheme.colors.surfaceMuted,
              true: lightTheme.colors.surfaceTileSelected,
            }}
            thumbColor={lightTheme.colors.surface}
            testID={`${testID}-keep-going`}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  summaryCard: { gap: lightTheme.space.md },
  totals: { gap: lightTheme.space.xxs },
  editLink: { alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  days: { gap: lightTheme.space.sm },
  /** `Card` without its 16pt padding: `ListRow` brings its own vertical rhythm. */
  dayCard: { paddingHorizontal: lightTheme.space.md },
  times: { flexDirection: 'row', gap: lightTheme.space.xs },
  keepGoingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  keepGoingText: { flex: 1, gap: lightTheme.space.xxs },
  footer: { gap: lightTheme.space.sm },
});
