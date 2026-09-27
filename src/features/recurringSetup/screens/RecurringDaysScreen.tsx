import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Badge, Button, Card, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import { WEEKDAY_LABELS, buildDemoCalendar } from '../data';
import type { RecurringDayCell } from '../types';

/**
 * Recurring setup — Step 1 "Pick your days".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, states `2a`
 * ("Pick your days (under minimum)") and `2b` ("valid"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md.
 * Layout, shapes, spacing and copy follow the wireframe; COLOURS deliberately don't. The
 * wireframe's black selected days, black counter and grey hint are placeholder styling, so they
 * take this app's own tokens instead: the lime selected fill `Chip` uses, `Badge`'s tones and the
 * accent note surface.
 *
 * STATIC ONLY, per task: the calendar is local fixture data (`buildDemoCalendar`), the min/max
 * gate and the "no cook" day are demonstrated locally, and `onContinue` is left to the caller.
 * Nothing here reads a real availability endpoint or advances the flow — that is Step 2 onward,
 * and the wiring between steps, both left for later.
 */

const MIN_DAYS = 5;
const MAX_DAYS = 14;

export interface RecurringDaysScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (selectedDayIds: readonly string[]) => void;
  readonly testID?: string;
}

export function RecurringDaysScreen({
  onBack,
  onContinue,
  testID = 'recurring-days-screen',
}: RecurringDaysScreenProps) {
  const calendar = useMemo(() => buildDemoCalendar(), []);
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(calendar.preselectedIds),
  );

  const count = selected.size;
  const complete = count >= MIN_DAYS && count <= MAX_DAYS;

  function toggle(day: RecurringDayCell) {
    if (day.disabled || day.unavailable) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(day.id)) {
        next.delete(day.id);
        return next;
      }
      // Locked at the max, exactly as the wireframe's dev note describes: the remaining dates
      // stay put rather than bumping an earlier pick.
      if (next.size >= MAX_DAYS) return current;
      next.add(day.id);
      return next;
    });
  }

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Pick your days" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          {count >= MIN_DAYS ? null : (
            <Text variant="hint" color="textSecondary" align="center">
              Pick {MIN_DAYS - count} more day{MIN_DAYS - count === 1 ? '' : 's'} to continue
            </Text>
          )}
          <Button
            label={complete ? `Continue with ${count} day${count === 1 ? '' : 's'}` : 'Continue'}
            onPress={() => complete && onContinue?.(Array.from(selected))}
            disabled={!complete}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      <View style={styles.summaryRow}>
        <View>
          <Text variant="bodyLarge" color="textSecondary">
            {calendar.rangeLabel}
          </Text>
          <Text variant="body" color="textSecondary">
            Pick {MIN_DAYS} to {MAX_DAYS} days
          </Text>
        </View>
        <Badge
          label={`${count} / ${MAX_DAYS}`}
          tone={complete ? 'warning' : 'neutral'}
          size="md"
          testID={`${testID}-counter`}
        />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          // Two Tuesdays and two Thursdays share a label; position, not text, is the key.
          <Text
            key={`weekday-${index}`}
            variant="bodyBold"
            color="textSecondary"
            align="center"
            style={styles.weekdayCell}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid} accessibilityRole="none">
        {calendar.weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day) => (
              <DayCell
                key={day.id}
                day={day}
                selected={selected.has(day.id)}
                onPress={() => toggle(day)}
              />
            ))}
          </View>
        ))}
      </View>

      {count >= MIN_DAYS ? null : (
        // A plain box, no icon — `NoteCard` always draws one, and can't bold part of its body.
        // Grey, like the idle day cells: the wireframe draws both in the same neutral.
        <Card tone="muted" padded={false} style={styles.hint} testID={`${testID}-onetime-hint`}>
          <Text variant="hint" color="textPrimary">
            Need a cook in the next 2 days? Use{' '}
            <Text variant="hintBold" color="textPrimary">
              One-time Schedule
            </Text>
            .
          </Text>
        </Card>
      )}
    </Screen>
  );
}

interface DayCellProps {
  readonly day: RecurringDayCell;
  readonly selected: boolean;
  readonly onPress: () => void;
}

/** Touch-target correction, same pattern as `Chip`, for narrow phones where a cell is under 44. */
const TOUCH_SLOP = 3;

function DayCell({ day, selected, onPress }: DayCellProps) {
  const locked = day.disabled || day.unavailable;
  const surface: StyleProp<ViewStyle> = day.unavailable
    ? styles.cellUnavailable
    : day.disabled
      ? styles.cellDisabled
      : selected
        ? styles.cellSelected
        : styles.cellIdle;
  const textColor: ColorToken = locked ? 'textDisabled' : selected ? 'textOnAccent' : 'textPrimary';

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      hitSlop={TOUCH_SLOP}
      accessibilityRole="button"
      accessibilityLabel={day.label}
      accessibilityState={{ selected, disabled: locked }}
      testID={`recurring-day-${day.id}`}
      style={({ pressed }) => [
        styles.cell,
        surface,
        pressed && !locked ? styles.cellPressed : null,
      ]}
    >
      <Text variant="titleRebook" color={textColor}>
        {day.dayOfMonth}
      </Text>
    </Pressable>
  );
}

/**
 * `2a` / `2b`, read off the wireframe's markup: square cells with a 15pt Bold number at a 12pt
 * radius, 5 apart both ways; every block on the body is 14 apart. Cells take a seventh of the row
 * and `aspectRatio: 1` sets their height from that, so they stay square on any screen width.
 */
const CELL_GAP = 5;

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  body: { gap: 14 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  footer: { gap: lightTheme.space.sm },
  weekdayRow: { flexDirection: 'row', gap: CELL_GAP },
  weekdayCell: { flex: 1 },
  grid: { gap: CELL_GAP },
  weekRow: { flexDirection: 'row', gap: CELL_GAP },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: lightTheme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** The wireframe's hint box: py 12 / px 14 at a 14pt radius, not `Card`'s 16 / 24. */
  hint: {
    paddingVertical: lightTheme.space.md,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  cellIdle: { backgroundColor: lightTheme.colors.surfaceMuted },
  cellSelected: { backgroundColor: lightTheme.colors.surfaceTileSelected },
  /** Outside the window: number only, no cell. */
  cellDisabled: { backgroundColor: 'transparent' },
  /** Inside the window but no cooks (Oct 10): the cell stays, the number is greyed, not struck. */
  cellUnavailable: { backgroundColor: lightTheme.colors.surfaceMuted },
  cellPressed: { opacity: 0.8 },
});
