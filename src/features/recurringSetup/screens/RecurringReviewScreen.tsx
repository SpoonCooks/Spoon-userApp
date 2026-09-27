import { Fragment, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RecurringFooter } from '../components/RecurringFooter';
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
 * Figma `ZIJf639gTWHXshaa2YOeCT` frame `4:1802` (`2g`) — an import of that wireframe. Layout,
 * sizes, copy AND colours follow it, as on Steps 1–3. Built from `Card`, `Text` and the shared footer; the
 * "Keep my plan going" toggle is drawn locally at Figma's 46 × 28, since no toggle exists in `@ui`
 * and React Native's `Switch` is a fixed 51 × 31.
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
      showsScrollIndicator={false}
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <ScreenHeader
          density="step"
          title="Review plan"
          onBack={onBack}
          testID={`${testID}-header`}
        />
      }
      footer={
        <RecurringFooter
          label="Set up autopay"
          onPress={() => onContinue?.(keepPlanGoing)}
          testID={`${testID}-continue`}
        >
          <Text variant="footnote" color="textStone">
            Nothing is charged today. Each visit is charged before it happens:{' '}
            {charges.map((charge, index) => (
              <Fragment key={charge.visitLabel}>
                {index === 0 ? '' : ' · '}
                <Text variant="footnoteBold" color="textInk">
                  {charge.amount}
                </Text>{' '}
                ({charge.visitLabel})
              </Fragment>
            ))}
            , incl. 5% tax.
          </Text>
        </RecurringFooter>
      }
    >
      <Card tone="muted" padded={false} style={styles.summary} testID={`${testID}-summary`}>
        <View style={styles.summaryHeader}>
          <Text variant="titleLarge" color="textInk">
            {summary.daysCount} days · {summary.visitsCount} visits
          </Text>
          <Text variant="captionStep" color="textStoneCaption">
            {summary.rangeLabel}
          </Text>
        </View>
        {summary.visits.map((visit) => (
          <View key={visit.label} style={styles.visitLine}>
            <Text variant="bodyTight" color="textInk" style={styles.visitDetail}>
              <Text variant="labelStrong" color="textInk">
                {visit.label}
              </Text>
              {` · ${visit.detail}`}
            </Text>
            <Text variant="bodyTight" color="textInk">
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
          <Text variant="captionStep" color="textInk" style={styles.underline}>
            Edit days or times
          </Text>
        </Pressable>
      </Card>

      <Text variant="labelStrong" color="textStone">
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
          <Text variant="labelStrong" color="textInk">
            {row.label}
          </Text>
          <View style={styles.times}>
            {row.times.map((time, index) => (
              <View key={`${row.id}-${index}`} style={styles.timePill}>
                <Text variant="labelBold" color="textInk">
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
          <Text variant="title" color="textInk">
            Keep my plan going
          </Text>
          <Text variant="bodyLarge" color="textStoneCaption">
            When a day is done, add the next one on the same pattern (stays within 14 days)
          </Text>
        </View>
        <Pressable
          onPress={() => setKeepPlanGoing((on) => !on)}
          accessibilityRole="switch"
          accessibilityLabel="Keep my plan going"
          accessibilityState={{ checked: keepPlanGoing }}
          hitSlop={lightTheme.space.sm}
          style={[styles.toggle, keepPlanGoing ? styles.toggleOn : styles.toggleOff]}
          testID={`${testID}-keep-going`}
        >
          <View style={styles.toggleThumb} />
        </Pressable>
      </Card>
    </Screen>
  );
}

/** `4:1808` — a 20pt gutter (not the app's 16), as on Steps 1–3. */
const GUTTER = 20;

const styles = StyleSheet.create({
  /** `4:1813` — the body opens 6 under the header; its blocks sit 12 apart. */
  body: { paddingHorizontal: GUTTER, paddingTop: lightTheme.space.s6, gap: lightTheme.space.md },
  /** `4:1814` — the `#F2F1EC` summary card: 14 padding, a 16pt radius, 10 between lines. */
  summary: {
    padding: 14,
    borderRadius: lightTheme.radius.md,
    gap: lightTheme.space.s10,
    backgroundColor: lightTheme.colors.surfaceStoneSoft,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },
  visitLine: { flexDirection: 'row', justifyContent: 'space-between', gap: lightTheme.space.sm },
  visitDetail: { flexShrink: 1 },
  editLink: { alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  /**
   * `4:1837` — a day row: a 1pt `#E4E2DA` edge, py 10 / px 12 inside it (Figma's 11 / 13 include
   * the edge), a 12pt radius: 46 tall.
   */
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingVertical: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    borderRadius: lightTheme.radius.sm,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderStone,
  },
  /** `4:1841` — time pills 6 apart. */
  times: { flexDirection: 'row', gap: lightTheme.space.s6 },
  /** `4:1842` — py 4 / px 8 at an 8pt radius, on stone. */
  timePill: {
    paddingVertical: lightTheme.space.xs,
    paddingHorizontal: lightTheme.space.sm,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceStone,
  },
  /** `4:1924` — a 1pt `#CFCDC4` edge, 14 inside it (Figma's 15 includes the edge), a 14pt radius. */
  keepGoing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderStoneMid,
  },
  /** `4:1925` — the copy column keeps 14 clear of the toggle. */
  keepGoingText: { flex: 1, paddingRight: 14 },
  /** `4:1927` — a 46 × 28 ink track, 3 inset, around a 22pt white thumb. */
  toggle: {
    width: 46,
    height: 28,
    padding: 3,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: lightTheme.colors.surfaceInk, alignItems: 'flex-end' },
  toggleOff: { backgroundColor: lightTheme.colors.borderStoneMid, alignItems: 'flex-start' },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: lightTheme.colors.surface,
  },
});
