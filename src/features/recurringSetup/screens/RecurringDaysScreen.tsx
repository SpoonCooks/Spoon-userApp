import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { PlanHeader } from '../components/PlanHeader';
import { RecurringFooter } from '../components/RecurringFooter';
import { WEEKDAY_LABELS, buildRecurringWindow } from '../data';
import type { RecurringWindowDay } from '../types';

/**
 * Recurring setup — Step 1 "Pick your days".
 *
 * Source: Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User).
 *
 * "Date selections flows": `144:2404` (unselected), `135:1681` (under 5), `147:1510` (vertical
 * drag), `132:1568` (horizontal drag), `149:1525` (random taps), `154:1583` (max cap error):
 *
 *  - Only the 21 bookable dates (today + 3 onward) are shown; the week is not padded out.
 *  - Days are picked by tapping, or by dragging across them vertically or horizontally.
 *  - In a plan, the earliest picked day is the start and the latest the end; both take the brand
 *    fill, the days between take the tint. Rechecked on every change.
 *  - A 15th pick is refused and "Max 14 days reached…" shows for a moment.
 *
 * "Date selection / Plan creation": `340:6661` (Plan 1), `334:6406` (add plans), `340:6550`
 * (Plan 2):
 *
 *  - Everything picked on the first calendar is Plan 1, and each plan's tile counts its days.
 *  - Once the newest plan has a day, a "+" appears; it starts the next plan on a blank calendar.
 *    There is no cap on plans.
 *  - Days already in another plan are greyed out and cannot be picked.
 *  - The CTA unlocks once all plans together have 5 days, and until then reads "Pick N more days".
 *
 * Defaults the frames leave open: the 14-day cap counts every plan together (it is the window's
 * cap, not a plan's), and tapping a tile returns to that plan's calendar.
 *
 * Still local: no availability is read yet, so no date is struck out, and `onContinue` is left to
 * the caller.
 */

const MIN_DAYS = 5;
const MAX_DAYS = 14;
/** How long the max-cap error stays up — the frame says only "temporarily". */
const CAP_ERROR_MS = 3000;

interface PlanDraft {
  readonly id: string;
  readonly days: ReadonlySet<string>;
}

/** A plan as Step 1 hands it on: its label and its dates, earliest first. */
export interface RecurringPlanDays {
  readonly label: string;
  readonly dayIds: readonly string[];
}

export interface RecurringDaysScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now. Receives every plan that has at least one day. */
  readonly onContinue?: (plans: readonly RecurringPlanDays[]) => void;
  /** The day the window is counted from. Defaults to now; the dev preview pins Figma's date. */
  readonly today?: Date;
  readonly testID?: string;
}

function planLabel(index: number): string {
  return `Plan ${index + 1}`;
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
  const [plans, setPlans] = useState<readonly PlanDraft[]>(() => [
    { id: 'plan-1', days: new Set() },
  ]);
  const [activeId, setActiveId] = useState('plan-1');
  const [capError, setCapError] = useState(false);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = plans.find((plan) => plan.id === activeId) ?? plans[0];
  const activeDays = active?.days ?? EMPTY;
  const locked = useMemo(() => {
    const ids = new Set<string>();
    for (const plan of plans) {
      if (plan.id === activeId) continue;
      for (const id of plan.days) ids.add(id);
    }
    return ids;
  }, [plans, activeId]);
  const total = plans.reduce((sum, plan) => sum + plan.days.size, 0);
  const complete = total >= MIN_DAYS;
  const picked = calendar.orderedIds.filter((id) => activeDays.has(id));
  const startId = picked[0];
  const endId = picked.at(-1);
  const newest = plans.at(-1);

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
   * Adds or removes one day in the active plan. A drag applies several in one burst, so the next
   * state is computed from refs kept in step with every change rather than from a state updater,
   * which React runs later. Returns null for a day another plan holds.
   */
  const plansRef = useRef(plans);
  const activeRef = useRef(activeId);
  const commit = useCallback((next: readonly PlanDraft[]) => {
    plansRef.current = next;
    setPlans(next);
  }, []);

  const apply = useCallback(
    (id: string, intent: SweepIntent): 'add' | 'remove' | null => {
      const all = plansRef.current;
      const current = all.find((plan) => plan.id === activeRef.current);
      if (current === undefined) return null;
      if (all.some((plan) => plan !== current && plan.days.has(id))) return null;
      const mode = intent === 'toggle' ? (current.days.has(id) ? 'remove' : 'add') : intent;
      if (mode === 'remove') {
        if (!current.days.has(id)) return mode;
        const days = new Set(current.days);
        days.delete(id);
        commit(all.map((plan) => (plan === current ? { ...plan, days } : plan)));
        setCapError(false);
        return mode;
      }
      if (current.days.has(id)) return mode;
      if (all.reduce((sum, plan) => sum + plan.days.size, 0) >= MAX_DAYS) {
        showCapError();
        return mode;
      }
      const days = new Set(current.days);
      days.add(id);
      commit(all.map((plan) => (plan === current ? { ...plan, days } : plan)));
      return mode;
    },
    [commit, showCapError],
  );

  const select = (id: string) => {
    activeRef.current = id;
    setActiveId(id);
  };

  const addPlan = () => {
    const id = `plan-${plansRef.current.length + 1}`;
    commit([...plansRef.current, { id, days: new Set() }]);
    select(id);
  };

  const continueWith = () => {
    if (!complete) return;
    onContinue?.(
      plans
        .map((plan, index) => ({
          label: planLabel(index),
          dayIds: calendar.orderedIds.filter((id) => plan.days.has(id)),
        }))
        .filter((plan) => plan.dayIds.length > 0),
    );
  };

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
              ? `Schedule ${planLabel(0)}`
              : `Pick ${MIN_DAYS - total} more day${MIN_DAYS - total === 1 ? '' : 's'}`
          }
          onPress={continueWith}
          disabled={!complete}
          testID={`${testID}-continue`}
        />
      }
    >
      <View style={styles.content}>
        <PlanHeader
          plans={plans.map((plan, index) => ({
            id: plan.id,
            label: planLabel(index),
            dayCount: plan.days.size,
          }))}
          activeId={activeId}
          onSelect={select}
          onAdd={newest !== undefined && newest.days.size > 0 ? addPlan : undefined}
          testID={`${testID}-plans`}
        />

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
            selected={activeDays}
            locked={locked}
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

const EMPTY: ReadonlySet<string> = new Set();

interface DayGridProps {
  readonly rows: ReturnType<typeof buildRecurringWindow>['rows'];
  /** The active plan's days. */
  readonly selected: ReadonlySet<string>;
  /** Days another plan holds: greyed out and not pickable. */
  readonly locked: ReadonlySet<string>;
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
function DayGrid({ rows, selected, locked, startId, endId, onApply }: DayGridProps) {
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
                  locked={locked.has(day.id)}
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
  /** Held by another plan (`340:6559`): a faint disc under faint ink. */
  readonly locked: boolean;
  /** The earliest or latest picked day: brand fill rather than tint. */
  readonly edge: boolean;
  /** Screen-reader activation; touch goes through the grid's responder. */
  readonly onToggle: () => void;
}

function DayCell({ day, selected, locked, edge, onToggle }: DayCellProps) {
  return (
    <View
      style={styles.column}
      accessible
      accessibilityRole="button"
      accessibilityLabel={day.label}
      accessibilityState={{ selected, disabled: locked }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onToggle}
      testID={`recurring-day-${day.id}`}
    >
      <View
        style={[
          styles.disc,
          locked
            ? styles.discLocked
            : selected
              ? edge
                ? styles.discEdge
                : styles.discPicked
              : null,
        ]}
      >
        <Text
          variant="bodyLarge"
          color={locked ? 'textDisabledSoft' : 'textPrimary'}
          align="center"
        >
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
  /** `340:6553` — p 16 all round, 24 between the plan header, the calendar and the error. */
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
  discLocked: { backgroundColor: lightTheme.colors.surfaceDisabledSoft },
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
