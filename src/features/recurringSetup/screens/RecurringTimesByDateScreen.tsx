import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoTimesByDate, formatClock } from '../data';
import type { RecurringDateRow, RecurringDateVisitTime } from '../types';

/**
 * Recurring setup — Step 3 "Times by date (optional)".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, states
 * `2f1` / `2f2` / `2f3` ("Times by date · 1/2/3 visits a day"). See
 * docs/CLAUDE_DESIGN_RECURRING_SETUP.md.
 *
 * The three states are one layout with a different number of columns: every chosen day is a card,
 * and each visit is a column in that card's single row — one full-width time, two side by side, or
 * three compact ones. A day where a visit's usual time is booked out is highlighted as a whole,
 * says "Not available at …" beside the date, and leaves only that visit's time empty ("Pick time").
 *
 * Layout, sizes and copy are read off the wireframe's markup; COLOURS are the app's own, as on
 * Steps 1–2 (grey pills, the accent card and notice border for a clash, amber for its text). No
 * select/dropdown component exists in `@ui`, so the time pill is local.
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

/**
 * `2f` — a grey pill, text left, "▾" right. `2f2`'s two-up pill is the roomier one: 14pt text and
 * 10pt side padding, against 13pt and 8pt when there are one or three per row.
 */
function TimePill({
  visit,
  roomy,
  testID,
}: {
  readonly visit: RecurringDateVisitTime;
  readonly roomy: boolean;
  readonly testID: string;
}) {
  const pick = needsPick(visit);
  const label = pick ? 'Pick time' : formatClock(visit.overrideMinutes ?? visit.defaultMinutes);
  const color = pick ? 'textBrand' : 'textPrimary';
  const variant = roomy ? 'title' : 'labelBold';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${visit.visitLabel}, ${label}`}
      hitSlop={lightTheme.space.xs}
      style={[styles.pill, roomy ? styles.pillRoomy : null, pick ? styles.pillPick : null]}
      testID={testID}
    >
      <Text variant={variant} color={color} numberOfLines={1} style={styles.pillLabel}>
        {label}
      </Text>
      <Text variant={variant} color={color}>
        ▾
      </Text>
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
  const roomy = plans.length === 2;

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Times by date" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <Button
            label="Save times"
            onPress={() => onContinue?.(rows)}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      <Text variant="bodyLarge" color="textSecondary" style={styles.intro}>
        Most days use{' '}
        {usualTimes.map((time, index) => (
          <Fragment key={`usual-${index}`}>
            {index === 0 ? '' : index === usualTimes.length - 1 ? ' and ' : ', '}
            <Text variant="title" color="textPrimary">
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
            padded={false}
            style={clash === undefined ? styles.card : [styles.card, styles.cardClash]}
            testID={`${testID}-date-${row.id}`}
          >
            <View style={styles.dateRow}>
              <Text variant="titleRebook" color="textPrimary" style={styles.dateLabel}>
                {row.label}
              </Text>
              {clash === undefined ? null : (
                <Text variant="body" color="textReschedule">
                  Not available at {formatClock(clash.defaultMinutes)}
                </Text>
              )}
            </View>
            <View style={[styles.visitRow, roomy ? styles.visitRowRoomy : null]}>
              {row.visits.map((visit) => (
                <View key={visit.visitId} style={styles.visitColumn}>
                  {/* Only the visit that clashes takes the amber; the others stay grey. */}
                  <Text
                    variant="slotLabel"
                    color={needsPick(visit) ? 'textReschedule' : 'textSecondary'}
                    numberOfLines={1}
                    style={styles.visitLabel}
                  >
                    {visit.visitLabel} · {visit.durationLabel}
                  </Text>
                  <TimePill
                    visit={visit}
                    roomy={roomy}
                    testID={`${testID}-date-${row.id}-${visit.visitId}`}
                  />
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
  /** `2f` — the list opens 6 under the header, days 8 apart. */
  body: { paddingTop: lightTheme.space.s6, gap: lightTheme.space.sm },
  /** The intro sits 4 further from the first day than the days sit from each other. */
  intro: { marginBottom: lightTheme.space.xs },
  /** `2f` — each day: py 10 / px 12, a 14pt radius, a 1.5pt edge, 8 between date and times. */
  card: {
    paddingVertical: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: lightTheme.space.sm,
  },
  /** A clash outlines the whole day in the notice yellow, on `Card`'s own accent fill. */
  cardClash: { borderColor: lightTheme.colors.borderNotice },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },
  /**
   * The wireframe sets these at the browser's default line height (~1.2), tighter than the
   * app's 15/24 and 11/16.5 tokens; without this each day card grows ~10pt taller than drawn.
   */
  dateLabel: { lineHeight: 18 },
  visitLabel: { lineHeight: 13 },
  visitRow: { flexDirection: 'row', gap: lightTheme.space.s6 },
  visitRowRoomy: { gap: lightTheme.space.sm },
  visitColumn: { flex: 1, minWidth: 0, gap: 3 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.xxs,
    padding: lightTheme.space.sm,
    borderRadius: lightTheme.radius.r10,
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  pillRoomy: { paddingHorizontal: lightTheme.space.s10 },
  pillLabel: { flexShrink: 1 },
  /** `2f` draws the empty pick as black with brand-yellow type — the Home booking card's pairing. */
  pillPick: { backgroundColor: lightTheme.colors.surfaceInverse },
  /** `2f` — the footer's own top rule, edge to edge, as on Step 2. */
  footer: {
    marginHorizontal: -lightTheme.layout.screenPaddingHorizontal,
    marginTop: -lightTheme.space.sm,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.s10,
    borderTopWidth: 1.5,
    borderTopColor: lightTheme.colors.surfaceMuted,
  },
});
