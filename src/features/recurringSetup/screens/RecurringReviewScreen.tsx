import { Fragment, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button, Card, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoReviewPlan, buildDemoVisitCharges } from '../data';

/**
 * Recurring setup — Step 4 "Review plan".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state `2g`
 * ("Step 4 · Review plan"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md. Top to bottom, as drawn:
 * plan totals and date range, one line per visit (time · duration · which days · price excl.
 * tax) and "Edit days or times" in one grey card; then "Day by day" — every chosen day with each
 * visit's time as its own pill; then "Keep my plan going"; and above the CTA the per-visit charge
 * incl. tax.
 *
 * Layout, sizes and copy are read off the wireframe's markup; COLOURS are the app's own, as on
 * Steps 1–3. Built from `Card`, `Text`, `Button` and React Native's `Switch` (no toggle exists in
 * `@ui`).
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

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Review plan" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <Text variant="hint" color="textSecondary">
            Nothing is charged today. Each visit is charged before it happens:{' '}
            {charges.map((charge, index) => (
              <Fragment key={charge.visitLabel}>
                {index === 0 ? '' : ' · '}
                <Text variant="hintBold" color="textPrimary">
                  {charge.amount}
                </Text>{' '}
                ({charge.visitLabel})
              </Fragment>
            ))}
            , incl. 5% tax.
          </Text>
          <Button
            label="Set up autopay"
            onPress={() => onContinue?.(keepPlanGoing)}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      <Card tone="muted" padded={false} style={styles.summary} testID={`${testID}-summary`}>
        <View style={styles.summaryHeader}>
          <Text variant="titleLarge" color="textPrimary">
            {summary.daysCount} days · {summary.visitsCount} visits
          </Text>
          <Text variant="labelMedium" color="textSecondary" style={styles.range}>
            {summary.rangeLabel}
          </Text>
        </View>
        {summary.visits.map((visit) => (
          <View key={visit.label} style={styles.visitLine}>
            <Text variant="bodyLarge" color="textPrimary" style={styles.visitDetail}>
              <Text variant="title" color="textPrimary">
                {visit.label}
              </Text>
              {` · ${visit.detail}`}
            </Text>
            <Text variant="bodyLarge" color="textPrimary">
              {visit.price}
            </Text>
          </View>
        ))}
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          hitSlop={lightTheme.space.sm}
          style={styles.editLink}
          testID={`${testID}-edit`}
        >
          <Text variant="hint" color="textPrimary" style={styles.underline}>
            Edit days or times
          </Text>
        </Pressable>
      </Card>

      <Text variant="title" color="textSecondary">
        Day by day
      </Text>

      {dates.map((row) => (
        <Card
          key={row.id}
          tone="surface"
          padded={false}
          style={styles.dayCard}
          testID={`${testID}-day-${row.id}`}
        >
          <Text variant="title" color="textPrimary">
            {row.label}
          </Text>
          <View style={styles.times}>
            {row.times.map((time, index) => (
              <View key={`${row.id}-${index}`} style={styles.timePill}>
                <Text variant="labelBold" color="textPrimary">
                  {time}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ))}

      <Card
        tone="surface"
        padded={false}
        style={styles.keepGoing}
        testID={`${testID}-keep-going-card`}
      >
        <View style={styles.keepGoingText}>
          <Text variant="title" color="textPrimary">
            Keep my plan going
          </Text>
          <Text variant="hint" color="textSecondary">
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
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  /** `2g` — the body opens 6 under the header; its blocks sit 12 apart. */
  body: { paddingTop: lightTheme.space.s6, gap: lightTheme.space.md },
  /** `2g` — the grey summary card: 14 padding, a 16pt radius, 10 between lines. */
  summary: { padding: 14, borderRadius: lightTheme.radius.md, gap: lightTheme.space.s10 },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },
  range: { fontSize: 13 },
  visitLine: { flexDirection: 'row', justifyContent: 'space-between', gap: lightTheme.space.sm },
  visitDetail: { flexShrink: 1 },
  editLink: { alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  /** `2g` — a day row: py 10 / px 12, a 12pt radius and a 1.5pt edge. */
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingVertical: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    borderRadius: lightTheme.radius.sm,
    borderWidth: 1.5,
  },
  times: { flexDirection: 'row', gap: lightTheme.space.s6 },
  /** `2g` — a time pill: py 4 / px 8 at an 8pt radius. */
  timePill: {
    paddingVertical: lightTheme.space.xs,
    paddingHorizontal: lightTheme.space.sm,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  keepGoing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  keepGoingText: { flex: 1, gap: lightTheme.space.xxs },
  /** `2g` — the footer's own top rule, edge to edge, as on Steps 2–3. */
  footer: {
    gap: lightTheme.space.sm,
    marginHorizontal: -lightTheme.layout.screenPaddingHorizontal,
    marginTop: -lightTheme.space.sm,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.s10,
    borderTopWidth: 1.5,
    borderTopColor: lightTheme.colors.surfaceMuted,
  },
});
