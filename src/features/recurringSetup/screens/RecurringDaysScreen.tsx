import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RecurringFooter } from '../components/RecurringFooter';
import { WEEKDAY_LABELS, buildRecurringWindow } from '../data';
import type { RecurringWindowDay } from '../types';

/**
 * Recurring setup — Step 1 "Pick your days".
 *
 * Source: Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User), "Date selections flows": `144:2404`
 * (unselected), `135:1681` (under 5), `147:1510` (vertical drag), `132:1568` (horizontal drag),
 * `149:1525` (random taps) and `154:1583` (max cap error). The rules are the frames' own notes:
 *
 *  - Only the 21 bookable dates (today + 3 onward) are shown; the week is not padded out.
 *  - 5 to 14 days. Under 5 the CTA is disabled and reads "Pick N more days", updating per tap.
 *  - Days are picked by tapping, or by dragging across them vertically or horizontally.
 *  - The earliest picked day is the start and the latest the end; both take the brand fill, the
 *    days between take the tint. Rechecked on every change.
 *  - A 15th pick is refused and "Max 14 days reached…" shows for a moment.
 *
 * Still local: no availability is read yet, so no date is struck out, and `onContinue` is left to
 * the caller.
 */

const MIN_DAYS = 5;
const MAX_DAYS = 14;
/** How long the max-cap error stays up — the frame says only "temporarily". */
const CAP_ERROR_MS = 3000;

export interface RecurringDaysScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now. */
  readonly onContinue?: (selectedDayIds: readonly string[]) => void;
  /** The day the window is counted from. Defaults to now; the dev preview pins Figma's date. */
  readonly today?: Date;
  readonly testID?: string;
}

export function RecurringDaysScreen({
  onBack,
  onContinue,
  today,
  testID = 'recurring-days-screen',
}: RecurringDaysScreenProps) {
  const todayKey = today?.getTime();
  const calendar = useMemo(
    () => buildRecurringWindow(todayKey === undefined ? new Date() : new Date(todayKey)),
    [todayKey],
  );
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [capError, setCapError] = useState(false);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = selected.size;
  const complete = count >= MIN_DAYS;
  const picked = calendar.orderedIds.filter((id) => selected.has(id));
  const startId = picked[0];
  const endId = picked.at(-1);

  const showCapError = useCallback(() => {
    setCapError(true);
    if (capTimer.current !== null) clearTimeout(capTimer.current);
    capTimer.current = setTimeout(() => setCapError(false), CAP_ERROR_MS);
  }, []);

  useEffect(
    () => () => {
      if (capTimer.current !== null) clearTimeout(capTimer.current);
    },
    [],
  );

  /**
   * Adds or removes one day. A drag applies several in one burst, so the next set is computed from
   * a ref kept in step with every change rather than from a state updater, which React runs later.
   */
  const selectedRef = useRef(selected);
  const apply = useCallback(
    (id: string, intent: SweepIntent): 'add' | 'remove' | null => {
      const current = selectedRef.current;
      const mode = intent === 'toggle' ? (current.has(id) ? 'remove' : 'add') : intent;
      if (mode === 'remove') {
        if (!current.has(id)) return mode;
        const next = new Set(current);
        next.delete(id);
        selectedRef.current = next;
        setSelected(next);
        setCapError(false);
        return mode;
      }
      if (current.has(id)) return mode;
      if (current.size >= MAX_DAYS) {
        showCapError();
        return mode;
      }
      const next = new Set(current);
      next.add(id);
      selectedRef.current = next;
      setSelected(next);
      return mode;
    },
    [showCapError],
  );

  return (
    <Screen
      tone="plain"
      padded={false}
      testID={testID}
      header={
        <ScreenHeader
          density="nav"
          title="Pick your days"
          onBack={onBack}
          testID={`${testID}-header`}
        />
      }
      footer={
        <RecurringFooter
          layout="pill"
          label={
            complete
              ? 'Continue'
              : `Pick ${MIN_DAYS - count} more day${MIN_DAYS - count === 1 ? '' : 's'}`
          }
          onPress={() => complete && onContinue?.(picked)}
          disabled={!complete}
          testID={`${testID}-continue`}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.calendar}>
          <View style={styles.row}>
            {WEEKDAY_LABELS.map((label) => (
              <Text
                key={label}
                variant="bodyLargeStrong"
                color="textPrimary"
                align="center"
                style={[styles.column, styles.weekday]}
              >
                {label}
              </Text>
            ))}
            <View style={styles.column} />
          </View>

          <DayGrid
            rows={calendar.rows}
            selected={selected}
            startId={startId}
            endId={endId}
            onApply={apply}
          />
        </View>

        {capError ? (
          <View
            style={styles.error}
            accessibilityLiveRegion="polite"
            testID={`${testID}-cap-error`}
          >
            <View style={styles.errorDot}>
              <Text variant="captionBold" color="textInverse" style={styles.errorMark}>
                !
              </Text>
            </View>
            <Text variant="captionError" color="textError">
              Max {MAX_DAYS} days reached, deselect a day to pick another
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

interface DayGridProps {
  readonly rows: ReturnType<typeof buildRecurringWindow>['rows'];
  readonly selected: ReadonlySet<string>;
  readonly startId: string | undefined;
  readonly endId: string | undefined;
  /**
   * `toggle` for the first day of a sweep — the screen decides from its live selection whether
   * that makes it an add or a remove sweep, and returns which — then that mode for every day after.
   */
  readonly onApply: (id: string, intent: SweepIntent) => 'add' | 'remove' | null;
}

type SweepIntent = 'add' | 'remove' | 'toggle';

/**
 * The date rows, with tap and drag selection.
 *
 * One pan gesture owns the whole grid, so a finger can sweep across rows (`147:1510`) or along one
 * (`132:1568`). The first day touched decides the gesture: an unpicked day starts an add sweep, a
 * picked one a remove sweep, and every further day the finger enters gets the same treatment once.
 * A tap is the same gesture with no movement.
 */
function DayGrid({ rows, selected, startId, endId, onApply }: DayGridProps) {
  // Lazily created and stable for the component's life — the same pattern `BottomSheet` uses for
  // its `Animated.Value` — so the gesture can track a sweep without reading a ref during render.
  const [tracker] = useState(() => new SweepTracker());

  const visit = (x: number, y: number) => {
    const hit = tracker.hit(x, y, rows);
    if (hit === null) return;
    const mode = onApply(hit.id, hit.intent);
    if (hit.intent === 'toggle' && mode !== null) tracker.start(mode);
  };

  // `minDistance(0)`: a tap is a pan that never moves, so taps and sweeps share one path.
  const sweep = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((event) => {
      tracker.reset();
      visit(event.x, event.y);
    })
    .onUpdate((event) => visit(event.x, event.y))
    .onFinalize(() => tracker.reset());

  return (
    <GestureDetector gesture={sweep}>
      <View
        style={styles.grid}
        onLayout={(event) => tracker.setWidth(event.nativeEvent.layout.width)}
      >
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.days.map((day, column) =>
              day === null ? (
                <View key={`empty-${rowIndex}-${column}`} style={styles.column} />
              ) : (
                <DayCell
                  key={day.id}
                  day={day}
                  selected={selected.has(day.id)}
                  edge={day.id === startId || day.id === endId}
                  onToggle={() => onApply(day.id, 'toggle')}
                />
              ),
            )}
            <Text
              variant="bodyLargeStrong"
              color="textPrimary"
              align="center"
              style={[styles.column, styles.month]}
            >
              {row.monthLabel}
            </Text>
          </View>
        ))}
      </View>
    </GestureDetector>
  );
}

/**
 * One sweep across the grid: which way it is going (add or remove, decided by the first day) and
 * which days it has already touched, so a finger lingering on a day applies it once.
 */
class SweepTracker {
  private width = 0;
  private session: { mode: 'add' | 'remove' | null; visited: Set<string> } | null = null;

  setWidth(width: number): void {
    this.width = width;
  }

  reset(): void {
    this.session = null;
  }

  /** The sweep's direction, once the screen has resolved its first day. */
  start(mode: 'add' | 'remove'): void {
    if (this.session !== null) this.session.mode = mode;
  }

  /** The day under a grid-relative point, and what to do with it — or null for nothing new. */
  hit(
    x: number,
    y: number,
    rows: DayGridProps['rows'],
  ): { readonly id: string; readonly intent: SweepIntent } | null {
    if (this.width === 0) return null;
    const column = Math.floor(x / ((this.width + CELL_GAP) / COLUMNS));
    const row = Math.floor(y / (ROW_HEIGHT + CELL_GAP));
    if (column < 0 || column > 6 || row < 0) return null;
    const day = rows[row]?.days[column] ?? null;
    if (day === null) return null;
    if (this.session === null) {
      this.session = { mode: null, visited: new Set([day.id]) };
      return { id: day.id, intent: 'toggle' };
    }
    if (this.session.visited.has(day.id) || this.session.mode === null) return null;
    this.session.visited.add(day.id);
    return { id: day.id, intent: this.session.mode };
  }
}

interface DayCellProps {
  readonly day: RecurringWindowDay;
  readonly selected: boolean;
  /** The earliest or latest picked day: brand fill rather than tint. */
  readonly edge: boolean;
  /** Screen-reader activation; touch goes through the grid's responder. */
  readonly onToggle: () => void;
}

function DayCell({ day, selected, edge, onToggle }: DayCellProps) {
  return (
    <View
      style={styles.column}
      accessible
      accessibilityRole="button"
      accessibilityLabel={day.label}
      accessibilityState={{ selected }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onToggle}
      testID={`recurring-day-${day.id}`}
    >
      <View style={[styles.disc, selected ? (edge ? styles.discEdge : styles.discPicked) : null]}>
        <Text variant="bodyLarge" color="textPrimary" align="center">
          {day.dayOfMonth}
        </Text>
      </View>
    </View>
  );
}

/** `144:2414` — eight equal columns (seven days and the month), 5 apart both ways. */
const COLUMNS = 8;
const CELL_GAP = 5;
/** `144:2414` — each date row is 39 tall; the weekday row 20. */
const ROW_HEIGHT = 39;
/** `149:1807` — the 32pt selection disc, 4 below the row top so the number sits 10 down. */
const DISC = 32;
const DISC_TOP = 4;

const styles = StyleSheet.create({
  /** `144:2407` — p 16 all round, 24 between the calendar and the error. */
  content: { flex: 1, padding: lightTheme.space.lg, gap: lightTheme.space.xl },
  /** `144:2414` — the weekday row and the date rows share one 5pt-gapped grid. */
  calendar: { gap: CELL_GAP },
  grid: { gap: CELL_GAP },
  row: { flexDirection: 'row', gap: CELL_GAP },
  column: { flex: 1, alignItems: 'center' },
  weekday: { height: 20 },
  /** `144:2474` — the month sits on the dates' text line: 10 down a 39 row. */
  month: { height: ROW_HEIGHT, paddingTop: 10 },
  disc: {
    width: DISC,
    height: DISC,
    marginTop: DISC_TOP,
    marginBottom: ROW_HEIGHT - DISC - DISC_TOP,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discPicked: { backgroundColor: lightTheme.colors.surfaceBrandTint },
  discEdge: { backgroundColor: lightTheme.colors.surfaceBrand },
  /** `158:1588` — a 16pt dot and the copy, 6 apart, centred. */
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s6,
  },
  /** `158:1586` — a 16pt `#E53935` circle with a white Bold 11 "!" centred in it. */
  errorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: lightTheme.colors.surfaceError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMark: { fontSize: 11, lineHeight: 16 },
});
