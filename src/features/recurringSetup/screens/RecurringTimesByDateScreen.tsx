import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, ListRow, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoDateRows, buildDemoVisitPlans, formatClock } from '../data';
import type { RecurringDateRow, RecurringDateVisitTime } from '../types';

/**
 * Recurring setup — Step 3 "Times by date (optional)".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, states
 * 2f-1 / 2f-2 / 2f-3 ("Times by date · 1/2/3 visits a day"). See
 * docs/CLAUDE_DESIGN_RECURRING_SETUP.md — a wireframe, not a pixel-accurate mock.
 *
 * The wireframe drew three separate screens, one per visit count. That's the SAME screen with a
 * different number of rows per date, so it's built once here and takes however many visit plans
 * it's given (`visitCount` picks the demo fixture; the real screen just renders `visitPlans.length`
 * rows per date either way) rather than as three near-duplicate components.
 *
 * STATIC ONLY, per task: dates, default times and which dates fall back to "Not available" are
 * local fixture data (`buildDemoDateRows`). Each time cell is a plain pressable placeholder — no
 * time-picker sheet exists yet to open from it, and building one is wiring, not this step's job.
 */

export interface RecurringTimesByDateScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (dates: readonly RecurringDateRow[]) => void;
  /** Demo-only lever so the dev preview can show the wireframe's 1/2/3-visit variants. */
  readonly visitCount?: 1 | 2 | 3;
  readonly testID?: string;
}

function joinWithAnd(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function TimeDropdown({
  value,
  placeholder,
  testID,
}: {
  readonly value: string | null;
  readonly placeholder: string;
  readonly testID: string;
}) {
  return (
    <Pressable
      style={styles.dropdown}
      accessibilityRole="button"
      accessibilityLabel={value ?? placeholder}
      hitSlop={lightTheme.space.xs}
      testID={testID}
    >
      <Text variant="bodyBold" color={value === null ? 'textSecondary' : 'textPrimary'}>
        {value ?? placeholder}
      </Text>
      <Icon name="down" size={16} color="textSecondary" />
    </Pressable>
  );
}

function VisitTimeRow({
  visit,
  testID,
}: {
  readonly visit: RecurringDateVisitTime;
  readonly testID: string;
}) {
  const label = `${visit.visitLabel} · ${visit.durationLabel}`;

  if (!visit.unavailableAtDefault) {
    return (
      <ListRow
        title={label}
        trailing={
          <TimeDropdown value={formatClock(visit.defaultMinutes)} placeholder="" testID={testID} />
        }
        testID={`${testID}-row`}
      />
    );
  }

  return (
    <Card tone="accent" bordered={false} padded={false} style={styles.unavailableBlock}>
      <Text variant="caption" color="textSecondary">
        Not available at {formatClock(visit.defaultMinutes)}
      </Text>
      <ListRow
        title={label}
        trailing={
          <TimeDropdown
            value={visit.overrideMinutes === null ? null : formatClock(visit.overrideMinutes)}
            placeholder="Pick time"
            testID={testID}
          />
        }
        testID={`${testID}-row`}
      />
    </Card>
  );
}

export function RecurringTimesByDateScreen({
  onBack,
  onContinue,
  visitCount = 3,
  testID = 'recurring-times-by-date-screen',
}: RecurringTimesByDateScreenProps) {
  const visitPlans = useMemo(() => buildDemoVisitPlans(visitCount), [visitCount]);
  const dateRows = useMemo(() => buildDemoDateRows(visitPlans), [visitPlans]);
  const introLabel = `Most days use ${joinWithAnd(
    visitPlans.map((plan) => formatClock(plan.defaultMinutes)),
  )}.`;

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Times by date" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <Button
          label="Save times"
          onPress={() => onContinue?.(dateRows)}
          testID={`${testID}-continue`}
        />
      }
    >
      <Text variant="body" color="textSecondary">
        {introLabel} Change any day, or pick a new time when we’re not available.
      </Text>

      {dateRows.map((row) => (
        <Card key={row.id} tone="surface" testID={`${testID}-date-${row.id}`}>
          <Text variant="bodyStrong" color="textPrimary" style={styles.dateLabel}>
            {row.label}
          </Text>
          <View style={styles.visitList}>
            {row.visits.map((visit) => (
              <VisitTimeRow
                key={visit.visitId}
                visit={visit}
                testID={`${testID}-date-${row.id}-${visit.visitId}`}
              />
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  dateLabel: { marginBottom: lightTheme.space.s6 },
  visitList: { gap: lightTheme.space.xs },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xxs,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.sm,
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  /** Overrides `Card`'s default 24pt radius and padding for a tighter inline highlight. */
  unavailableBlock: {
    gap: lightTheme.space.xxs,
    padding: lightTheme.space.sm,
    borderRadius: lightTheme.radius.sm,
  },
});
