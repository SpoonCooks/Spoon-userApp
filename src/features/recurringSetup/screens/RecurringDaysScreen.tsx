import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Badge, Button, NoteCard, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import { WEEKDAY_LABELS, buildDemoCalendar } from '../data';
import type { RecurringDayCell } from '../types';

/**
 * Recurring setup — Step 1 "Pick your days".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state 2b
 * ("Pick your days (valid)") and 2a ("under minimum"). See
 * docs/CLAUDE_DESIGN_RECURRING_SETUP.md — this is a wireframe, not a pixel-accurate mock, so the
 * layout below follows this app's own token system (Chip's selected/disabled treatment, the
 * standard screen header and CTA) rather than the wireframe's placeholder black/grey styling.
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
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Pick your days" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          {count >= MIN_DAYS ? null : (
            <Text variant="caption" color="textSecondary" align="center">
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
        <View style={styles.summaryText}>
          <Text variant="bodyStrong" color="textPrimary">
            {calendar.rangeLabel}
          </Text>
          <Text variant="caption" color="textSecondary">
            Pick {MIN_DAYS} to {MAX_DAYS} days
          </Text>
        </View>
        <Badge
          label={`${count} / ${MAX_DAYS}`}
          tone={complete ? 'warning' : 'neutral'}
          testID={`${testID}-counter`}
        />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          // Two Tuesdays and two Thursdays share a label; position, not text, is the key.
          <Text
            key={`weekday-${index}`}
            variant="labelUpper"
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
              <View key={day.id} style={styles.dayCell}>
                <DayCircle day={day} selected={selected.has(day.id)} onPress={() => toggle(day)} />
              </View>
            ))}
          </View>
        ))}
      </View>

      {count >= MIN_DAYS ? null : (
        <NoteCard
          tone="accent"
          body="Need a cook in the next 2 days? Use One-time › Schedule."
          testID={`${testID}-onetime-hint`}
        />
      )}
    </Screen>
  );
}

interface DayCircleProps {
  readonly day: RecurringDayCell;
  readonly selected: boolean;
  readonly onPress: () => void;
}

/** Touch-target correction, same pattern as `Chip`: the drawn circle stays 40, the target is 44. */
const TOUCH_SLOP = 2;

function DayCircle({ day, selected, onPress }: DayCircleProps) {
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
      <Text
        variant="bodyBold"
        color={textColor}
        style={day.unavailable ? styles.strike : undefined}
      >
        {day.dayOfMonth}
      </Text>
    </Pressable>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  summaryText: { flex: 1, gap: lightTheme.space.xxs },
  footer: { gap: lightTheme.space.sm },
  weekdayRow: { flexDirection: 'row' },
  weekdayCell: { flex: 1 },
  grid: { gap: lightTheme.space.sm },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: lightTheme.space.xxs },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellIdle: { backgroundColor: lightTheme.colors.surfaceMuted },
  cellSelected: {
    backgroundColor: lightTheme.colors.surfaceTileSelected,
    ...lightTheme.elevation.tile,
  },
  cellDisabled: { backgroundColor: 'transparent' },
  cellUnavailable: { backgroundColor: 'transparent' },
  cellPressed: { opacity: 0.8 },
  strike: { textDecorationLine: 'line-through' },
});
