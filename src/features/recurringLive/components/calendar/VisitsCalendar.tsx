import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, LayoutChangeEvent, ViewStyle } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken, TypographyToken } from '@ui/tokens/semantic';

import type { CalendarDay, CalendarDayKind, CalendarWeek } from '../../data/calendar';
import { LEGEND_PAST, LEGEND_TODAY, LEGEND_UPCOMING } from './assets';

/**
 * The "Your visits" calendar of `1005:132`: the `1005:178` header with its legend, and the
 * `1286:6575` "Calendar/Variant2" grid.
 *
 * GRID (`1286:6575`, 370 × 255): a 40pt weekday row (`1047:6222`), then date rows on a 44pt
 * pitch (39pt grid rows + 5 gap, each 40pt cell overhanging by 1) across 7 columns 5pt apart
 * (`1047:6170`), and a 41.875pt month column (`1047:6213`) set at x 323 — 5.125pt INSIDE the
 * dates' right edge (328.125), so it is pulled left by that much rather than sat beside them.
 *
 * MARKS: in the frame each visit's 32pt disc is a loose layer on `Content` (`1286:6647` past,
 * `1286:6653` today, `1286:6644` upcoming, `1354:1550` selected); every one is centred on its
 * cell, so here the disc is drawn inside the cell.
 */

export const CALENDAR_GEOMETRY = {
  /** `1047:6222` — the weekday row: py 10 around a 20pt line. */
  weekdayRow: 40,
  /** Cell height (py 10 + 20). */
  cell: 40,
  /** `1047:6170` — 39pt rows + 5 gap. */
  rowPitch: 44,
  columnGap: 5,
  /** `1047:6213`. */
  monthColumn: 41.875,
  /** `1047:6213` x 323 against the dates' 328.125 right edge. */
  monthOverlap: 5.125,
  disc: 32,
  /** `1286:6575` — the frame's fixed grid height (it reserves a fifth row). */
  height: 255,
} as const;

/** Where a date's disc sits inside the grid, for anchoring its pop-up. */
export function dateDiscFrame(
  gridWidth: number,
  rowIndex: number,
  columnIndex: number,
): { readonly centerX: number; readonly top: number } {
  const g = CALENDAR_GEOMETRY;
  // The month column's pull-left and matching right margin cancel: the dates keep 328.125 of 370.
  const cellWidth = (gridWidth - g.monthColumn - 6 * g.columnGap) / 7;
  return {
    centerX: columnIndex * (cellWidth + g.columnGap) + cellWidth / 2,
    top: g.weekdayRow + rowIndex * g.rowPitch + (g.cell - g.disc) / 2,
  };
}

/** Row and column of a date in the grid. */
export function locateDay(
  weeks: readonly CalendarWeek[],
  id: string,
): { readonly rowIndex: number; readonly columnIndex: number } | undefined {
  for (const [rowIndex, row] of weeks.entries()) {
    const columnIndex = row.days.findIndex((day) => day?.id === id);
    if (columnIndex >= 0) return { rowIndex, columnIndex };
  }
  return undefined;
}

// ---------------------------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------------------------

const LEGEND: readonly {
  readonly key: string;
  readonly label: string;
  readonly dot: ImageSourcePropType;
}[] = [
  { key: 'past', label: 'Past', dot: LEGEND_PAST },
  { key: 'today', label: 'Today', dot: LEGEND_TODAY },
  { key: 'upcoming', label: 'Upcoming', dot: LEGEND_UPCOMING },
];

/** `1005:178` — "Your visits" (Spoon/Button) spread against three Micro legend items. */
export function VisitsCalendarHeader({ testID = 'visits-calendar-header' }: { testID?: string }) {
  return (
    <View style={styles.header} testID={testID}>
      <Text variant="spoonButton" color="textPrimary">
        Your visits
      </Text>
      {LEGEND.map(({ key, label, dot }) => (
        <View key={key} style={styles.legendItem}>
          <Image source={dot} style={styles.legendDot} />
          <Text variant="spoonMicro" color="textRecurringMeta">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------------------------

export interface VisitsCalendarProps {
  readonly weekdays: readonly string[];
  readonly weeks: readonly CalendarWeek[];
  readonly selectedId?: string | null;
  readonly onSelectDay?: ((day: CalendarDay) => void) | undefined;
  readonly onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
  readonly testID?: string;
}

const DISC_STYLE: Record<CalendarDayKind, ViewStyle | null> = {
  past: { backgroundColor: lightTheme.colors.surfaceAccent },
  today: { backgroundColor: lightTheme.colors.surfaceCta },
  upcoming: { borderWidth: 1.5, borderColor: lightTheme.colors.borderNotice },
  none: null,
};

/** Visit dates read SemiBold except past ones; a date with no visit is greyed. */
const LABEL: Record<CalendarDayKind, { variant: TypographyToken; color: ColorToken }> = {
  past: { variant: 'spoonBody', color: 'textPrimary' },
  today: { variant: 'spoonBodyStrong', color: 'textPrimary' },
  upcoming: { variant: 'spoonBodyStrong', color: 'textPrimary' },
  none: { variant: 'spoonBody', color: 'textDisabledSoft' },
};

export function VisitsCalendar({
  weekdays,
  weeks,
  selectedId,
  onSelectDay,
  onLayout,
  testID = 'visits-calendar',
}: VisitsCalendarProps) {
  return (
    <View style={styles.grid} onLayout={onLayout} testID={testID}>
      <View style={styles.row}>
        <View style={styles.dates}>
          {weekdays.map((weekday) => (
            <View key={weekday} style={styles.cell}>
              <Text variant="spoonBodyStrong" color="textPrimary">
                {weekday}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.month} />
      </View>

      <View style={styles.weeks}>
        {weeks.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.dates}>
              {row.days.map((day, index) =>
                day === null ? (
                  <View key={`${row.id}-${index}`} style={styles.cell} />
                ) : (
                  <DateCell
                    key={day.id}
                    day={day}
                    selected={day.id === selectedId}
                    onPress={onSelectDay}
                    testID={`${testID}-${day.id}`}
                  />
                ),
              )}
            </View>
            <View style={[styles.month, styles.monthCell]}>
              <Text variant="spoonBodyStrong" color="textPrimary">
                {row.monthLabel}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function DateCell({
  day,
  selected,
  onPress,
  testID,
}: {
  readonly day: CalendarDay;
  readonly selected: boolean;
  readonly onPress?: ((day: CalendarDay) => void) | undefined;
  readonly testID: string;
}) {
  const label = LABEL[day.kind];
  const hasVisits = day.kind !== 'none';

  return (
    <Pressable
      onPress={hasVisits ? () => onPress?.(day) : undefined}
      disabled={!hasVisits}
      accessibilityRole="button"
      accessibilityLabel={`${day.weekday} ${day.day} ${day.month}`}
      accessibilityState={{ selected, disabled: !hasVisits }}
      style={styles.cell}
      testID={testID}
    >
      <View style={[styles.disc, selected ? styles.discSelected : DISC_STYLE[day.kind]]}>
        <Text variant={label.variant} color={label.color}>
          {day.day}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** `1005:178` — justify-between across the title and the three legend items. */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  legendDot: { width: 10, height: 10 },

  grid: { height: CALENDAR_GEOMETRY.height },
  weeks: { gap: CALENDAR_GEOMETRY.rowPitch - CALENDAR_GEOMETRY.cell },
  row: { flexDirection: 'row' },
  dates: { flex: 1, flexDirection: 'row', gap: CALENDAR_GEOMETRY.columnGap },
  month: {
    width: CALENDAR_GEOMETRY.monthColumn,
    marginLeft: -CALENDAR_GEOMETRY.monthOverlap,
    marginRight: CALENDAR_GEOMETRY.monthOverlap,
  },
  monthCell: { height: CALENDAR_GEOMETRY.cell, alignItems: 'center', justifyContent: 'center' },
  cell: {
    flex: 1,
    height: CALENDAR_GEOMETRY.cell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    width: CALENDAR_GEOMETRY.disc,
    height: CALENDAR_GEOMETRY.disc,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discSelected: { backgroundColor: lightTheme.colors.surfaceCalendarSelected },
});
