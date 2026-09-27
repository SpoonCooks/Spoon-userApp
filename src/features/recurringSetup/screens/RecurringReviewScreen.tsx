import { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Button, Card, DetailRows, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoReviewDates, buildDemoVisitCharges } from '../data';

/**
 * Recurring setup — Step 4 "Review plan".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state 2g
 * ("Step 4 · Review plan"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md — a wireframe, not a
 * pixel-accurate mock, so the date/time table reuses `DetailRows` (the app's existing
 * label/value list, already used for the booking and refund summaries) rather than a bespoke row.
 *
 * STATIC ONLY, per task: the eight demo dates and the two visit charges are local fixture data
 * (`buildDemoReviewDates`, `buildDemoVisitCharges`) — this step has nothing to read yet, since it
 * isn't wired to Steps 1–3. "Keep my plan going" is local UI state only; nothing persists it.
 */

export interface RecurringReviewScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (keepPlanGoing: boolean) => void;
  readonly testID?: string;
}

export function RecurringReviewScreen({
  onBack,
  onContinue,
  testID = 'recurring-review-screen',
}: RecurringReviewScreenProps) {
  const dateRows = useMemo(() => buildDemoReviewDates(), []);
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
      <Card tone="surface" testID={`${testID}-dates`}>
        <DetailRows
          rows={dateRows.map((row) => ({ label: row.label, value: row.timeSummary }))}
          variant="booking"
        />
      </Card>

      <View style={styles.keepGoingRow}>
        <View style={styles.keepGoingText}>
          <Text variant="bodyStrong" color="textPrimary">
            Keep my plan going
          </Text>
          <Text variant="caption" color="textSecondary">
            When a day is done, add the next one on the same pattern (stays within 14 days).
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  keepGoingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  keepGoingText: { flex: 1, gap: lightTheme.space.xxs },
  footer: { gap: lightTheme.space.sm },
});
