import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RecurringFooter } from '../components/RecurringFooter';
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
 * Figma `ZIJf639gTWHXshaa2YOeCT` frames `4:1115` (`2f1`), `4:1272` (`2f2`) and `4:1495` (`2f3`) —
 * an import of that wireframe. Layout, sizes, copy AND colours follow them, as on Steps 1–2: stone
 * pills on white cards, and a cream card with an amber edge and ink for a clash. No select/dropdown
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
  const color = pick ? 'textBrand' : 'textInk';
  const variant = roomy ? 'labelStrong' : 'labelBold';

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
      showsScrollIndicator={false}
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <ScreenHeader
          density="step"
          title="Times by date"
          onBack={onBack}
          testID={`${testID}-header`}
        />
      }
      footer={
        <RecurringFooter
          label="Save times"
          onPress={() => onContinue?.(rows)}
          testID={`${testID}-continue`}
        />
      }
    >
      <Text variant="bodyLarge" color="textStone" style={styles.intro}>
        Most days use{' '}
        {usualTimes.map((time, index) => (
          <Fragment key={`usual-${index}`}>
            {index === 0 ? '' : index === usualTimes.length - 1 ? ' and ' : ', '}
            <Text variant="title" color="textInk">
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
            tone="surface"
            padded={false}
            style={clash === undefined ? styles.card : [styles.card, styles.cardClash]}
            testID={`${testID}-date-${row.id}`}
          >
            <View style={styles.dateRow}>
              <Text variant="titleTotal" color="textInk" style={styles.dateLabel}>
                {row.label}
              </Text>
              {clash === undefined ? null : (
                <Text variant="noticeSmall" color="textClash">
                  Not available at {formatClock(clash.defaultMinutes)}
                </Text>
              )}
            </View>
            <View style={[styles.visitRow, roomy ? styles.visitRowRoomy : null]}>
              {row.visits.map((visit) => (
                <View key={visit.visitId} style={styles.visitColumn}>
                  {/* Only the visit that clashes takes the amber; the others stay grey. */}
                  <Text
                    variant="labelMicro"
                    color={needsPick(visit) ? 'textClash' : 'textStoneQuiet'}
                    numberOfLines={1}
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

/** `4:1121` — a 20pt gutter (not the app's 16), as on Steps 1–2. */
const GUTTER = 20;

const styles = StyleSheet.create({
  /** `4:1126` — the list opens 6 under the header, days 8 apart. */
  body: { paddingHorizontal: GUTTER, paddingTop: lightTheme.space.s6, gap: lightTheme.space.sm },
  /** `4:1127` — the intro carries 4 more below it than the days sit apart. */
  intro: { marginBottom: lightTheme.space.xs },
  /**
   * `4:1131` — each day: a 1pt `#E4E2DA` edge, then py 10 / px 12 inside it (Figma's 11 / 13
   * include the edge), a 14pt radius, 8 between date and times.
   */
  card: {
    paddingVertical: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderStone,
    gap: lightTheme.space.sm,
  },
  /** `4:1156` — a booked-out day: cream, with an amber edge. */
  cardClash: {
    backgroundColor: lightTheme.colors.surfaceClash,
    borderColor: lightTheme.colors.borderClash,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },
  dateLabel: { flexShrink: 1 },
  /** `4:1134` / `4:1290` — one column per visit: 6 apart, or 8 when there are two. */
  visitRow: { flexDirection: 'row', gap: lightTheme.space.s6 },
  visitRowRoomy: { gap: lightTheme.space.sm },
  /** `4:1135` — the label 3 above its pill. */
  visitColumn: { flex: 1, minWidth: 0, gap: 3 },
  /** `4:1140` — a stone pill, 8 all round at a 10pt radius: 32 tall. */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.xxs,
    padding: lightTheme.space.sm,
    borderRadius: lightTheme.radius.r10,
    backgroundColor: lightTheme.colors.surfaceStone,
  },
  /** `4:1294` — two per row: 10 at the sides around 14pt type, 34 tall. */
  pillRoomy: { paddingHorizontal: lightTheme.space.s10 },
  pillLabel: { flexShrink: 1 },
  /** `4:1172` — the empty pick is ink with brand-yellow type. */
  pillPick: { backgroundColor: lightTheme.colors.surfaceInk },
});
