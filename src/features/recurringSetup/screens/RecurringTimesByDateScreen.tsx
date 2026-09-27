import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoTimesByDate, formatClock } from '../data';
import type { RecurringDateRow, RecurringDateVisitTime } from '../types';

/**
 * Recurring setup — Step 3 "Times by date (optional)".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, states
 * `2f1` / `2f2` / `2f3` ("Times by date · 1/2/3 visits a day"). See
 * docs/CLAUDE_DESIGN_RECURRING_SETUP.md — a wireframe, not a pixel-accurate mock.
 *
 * The three states are one layout with a different number of columns: every chosen day is a card,
 * and each visit is a column in that card's single row — one full-width time, two side by side, or
 * three compact ones. A day where a visit's usual time is booked out is highlighted as a whole,
 * says "Not available at …" beside the date, and leaves only that visit's time empty ("Pick time").
 *
 * Built from `Card`, `Text`, `Icon` and `Button`. `ListRow` (title left, one trailing control) no
 * longer fits: the visits sit side by side under the date, not one per row. No select/dropdown
 * component exists in `@ui`, so the time pill is local.
 *
 * STATIC ONLY, per task: every date, time and booked-out day is fixture data
 * (`buildDemoTimesByDate`), and the time pills open nothing — no time-picker exists yet.
 */

export interface RecurringTimesByDateScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (dates: readonly RecurringDateRow[]) => void;
  /** Demo-only lever so the dev preview can show `2f1` / `2f2` / `2f3`. */
  readonly visitCount?: 1 | 2 | 3;
  readonly testID?: string;
}

/** A booked-out default that the customer hasn't re-picked yet. */
function needsPick(visit: RecurringDateVisitTime): boolean {
  return visit.unavailableAtDefault && visit.overrideMinutes === null;
}

function TimePill({
  visit,
  testID,
}: {
  readonly visit: RecurringDateVisitTime;
  readonly testID: string;
}) {
  const pick = needsPick(visit);
  const label = pick ? 'Pick time' : formatClock(visit.overrideMinutes ?? visit.defaultMinutes);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${visit.visitLabel}, ${label}`}
      hitSlop={lightTheme.space.xs}
      style={[styles.pill, pick ? styles.pillPick : null]}
      testID={testID}
    >
      <Text variant="bodyBold" color={pick ? 'textBrand' : 'textPrimary'} numberOfLines={1}>
        {label}
      </Text>
      <Icon name="down" size={14} color={pick ? 'textBrand' : 'textSecondary'} />
    </Pressable>
  );
}

export function RecurringTimesByDateScreen({
  onBack,
  onContinue,
  visitCount = 3,
  testID = 'recurring-times-by-date-screen',
}: RecurringTimesByDateScreenProps) {
  const { plans, rows } = useMemo(() => buildDemoTimesByDate(visitCount), [visitCount]);
  const usualTimes = plans.map((plan) => formatClock(plan.defaultMinutes));

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
          onPress={() => onContinue?.(rows)}
          testID={`${testID}-continue`}
        />
      }
    >
      <Text variant="body" color="textSecondary">
        Most days use{' '}
        {usualTimes.map((time, index) => (
          <Fragment key={`usual-${index}`}>
            {index === 0 ? '' : index === usualTimes.length - 1 ? ' and ' : ', '}
            <Text variant="bodyBold" color="textPrimary">
              {time}
            </Text>
          </Fragment>
        ))}
        .{/* `2f3` drops this sentence to leave room for three columns; `2f1` / `2f2` carry it. */}
        {plans.length < 3 ? ' Change any day, or pick a new time where we’re not available.' : ''}
      </Text>

      {rows.map((row) => {
        const clash = row.visits.find(needsPick);
        return (
          <Card
            key={row.id}
            tone={clash === undefined ? 'surface' : 'accent'}
            style={clash === undefined ? styles.card : [styles.card, styles.cardClash]}
            testID={`${testID}-date-${row.id}`}
          >
            <View style={styles.dateRow}>
              <Text variant="bodyStrong" color="textPrimary">
                {row.label}
              </Text>
              {clash === undefined ? null : (
                <Text variant="caption" color="textSecondary">
                  Not available at {formatClock(clash.defaultMinutes)}
                </Text>
              )}
            </View>
            <View style={styles.visitRow}>
              {row.visits.map((visit) => (
                <View key={visit.visitId} style={styles.visitColumn}>
                  <Text variant="captionBold" color="textSecondary" numberOfLines={1}>
                    {visit.visitLabel} · {visit.durationLabel}
                  </Text>
                  <TimePill visit={visit} testID={`${testID}-date-${row.id}-${visit.visitId}`} />
                </View>
              ))}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  /** Overrides `Card`'s 16pt padding for a denser list of eleven days. */
  card: { padding: lightTheme.space.md, gap: lightTheme.space.sm },
  /** A clash outlines the whole day in the notice yellow, on `Card`'s own accent fill. */
  cardClash: { borderWidth: lightTheme.stroke.thin, borderColor: lightTheme.colors.borderNotice },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },
  visitRow: { flexDirection: 'row', gap: lightTheme.space.sm },
  visitColumn: { flex: 1, minWidth: 0, gap: lightTheme.space.xxs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.xxs,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  /** `2f` draws the empty pick as black with brand-yellow type — the Home booking card's pairing. */
  pillPick: { backgroundColor: lightTheme.colors.surfaceInverse },
});
