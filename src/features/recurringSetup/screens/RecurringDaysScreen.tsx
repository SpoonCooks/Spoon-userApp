import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Badge, Card, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import { RecurringFooter } from '../components/RecurringFooter';
import { WEEKDAY_LABELS, buildDemoCalendar } from '../data';
import type { RecurringDayCell } from '../types';

/**
 * Recurring setup — Step 1 "Pick your days".
 *
 * Source: Figma `ZIJf639gTWHXshaa2YOeCT` ("Version 1"), frames `4:282` (under minimum) and `4:439`
 * (valid) — an import of the Claude Design wireframe, so its values are that markup's. Layout,
 * sizes, copy AND colours follow it (the stone/ink tokens). One deliberate departure, per review:
 * the no-cooks day keeps black ink, neither greyed nor struck through.
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
      showsScrollIndicator={false}
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <ScreenHeader
          density="step"
          title="Pick your days"
          onBack={onBack}
          testID={`${testID}-header`}
        />
      }
      footer={
        <RecurringFooter
          layout="plain"
          label={complete ? `Continue with ${count} day${count === 1 ? '' : 's'}` : 'Continue'}
          onPress={() => complete && onContinue?.(Array.from(selected))}
          disabled={!complete}
          testID={`${testID}-continue`}
        >
          {count >= MIN_DAYS ? null : (
            <Text variant="captionStep" color="textStoneCaption" align="center">
              Pick {MIN_DAYS - count} more day{MIN_DAYS - count === 1 ? '' : 's'} to continue
            </Text>
          )}
        </RecurringFooter>
      }
    >
      <View style={styles.summaryRow}>
        <View>
          <Text variant="bodyLarge" color="textStone">
            {calendar.rangeLabel}
          </Text>
          <Text variant="body" color="textStone" style={styles.rangeHint}>
            Pick {MIN_DAYS} to {MAX_DAYS} days
          </Text>
        </View>
        <Badge
          label={`${count} / ${MAX_DAYS}`}
          tone={complete ? 'ink' : 'stone'}
          size="md"
          testID={`${testID}-counter`}
        />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          // Two Tuesdays and two Thursdays share a label; position, not text, is the key.
          <Text
            key={`weekday-${index}`}
            variant="bodyBoldTight"
            color="textStoneQuiet"
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
        <Card tone="muted" padded={false} style={styles.hint} testID={`${testID}-onetime-hint`}>
          <Text variant="hint" color="textInk">
            Need a cook in the next 2 days? Use{' '}
            <Text variant="hintBold" color="textInk">
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
  const textColor: ColorToken = day.unavailable
    ? 'textInk'
    : day.disabled
      ? 'textStoneFaint'
      : selected
        ? 'textInverse'
        : 'textInk';

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
 * `4:282` / `4:439`: cells with a 15pt Bold number at a 12pt radius, 5 apart both ways.
 */
const CELL_GAP = 5;
const GUTTER = 20;
/**
 * `4:282` — each cell is 43.57 × 39 in the 375 frame: a seventh of the 335pt row less its gaps,
 * by 10 + 19 + 10. Held as a ratio so the cells keep Figma's shape on wider phones.
 */
const CELL_ASPECT = (335 - 6 * CELL_GAP) / 7 / 39;

const styles = StyleSheet.create({
  /** `4:282` — a 20pt gutter (not the app's 16), 8 under the header, blocks 14 apart. */
  body: { paddingHorizontal: GUTTER, paddingTop: lightTheme.space.sm, gap: 14 },
  /** `4:282` — the 12pt line sits in the range's 20pt line box. */
  rangeHint: { lineHeight: 20 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  weekdayRow: { flexDirection: 'row', gap: CELL_GAP },
  weekdayCell: { flex: 1 },
  grid: { gap: CELL_GAP },
  weekRow: { flexDirection: 'row', gap: CELL_GAP },
  cell: {
    flex: 1,
    aspectRatio: CELL_ASPECT,
    borderRadius: lightTheme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** The wireframe's hint box: py 12 / px 14 at a 14pt radius, not `Card`'s 16 / 24. */
  hint: {
    paddingVertical: lightTheme.space.md,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: lightTheme.colors.surfaceStoneSoft,
  },
  cellIdle: { backgroundColor: lightTheme.colors.surfaceStone },
  cellSelected: { backgroundColor: lightTheme.colors.surfaceInk },
  /** Outside the window: number only, no cell. */
  cellDisabled: { backgroundColor: 'transparent' },
  /** Inside the window but no cooks (Oct 10): the cell and its black number stay; it just can't be picked. */
  cellUnavailable: { backgroundColor: lightTheme.colors.surfaceStone },
  cellPressed: { opacity: 0.8 },
});
