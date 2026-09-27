import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Button, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import {
  DURATION_OPTIONS,
  MAX_VISITS,
  buildDemoPickedDays,
  buildDemoVisits,
  buildNewVisit,
  buildStartMinutesFor,
  coverageFor,
  defaultSomeDayIds,
  durationLabel,
  durationMinutes,
  formatClock,
  visitDayIds,
} from '../data';
import type { RecurringDaysMode, RecurringTimeOfDay, RecurringVisitDraft } from '../types';

/**
 * Recurring setup — Step 2 "Time & duration".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, states `2c`
 * (one visit, the default), `2d` (two visits, the second on "Some" days) and `2e` (three visits).
 * See docs/CLAUDE_DESIGN_RECURRING_SETUP.md. One screen that grows from `2c` to `2e` as visits are
 * added, not three screens.
 *
 * Layout, sizes and copy are read off the wireframe's markup; COLOURS are the app's own, as on
 * Step 1: its grey idle cells map to `surfaceMuted`, its black selected cells to the lime
 * `surfaceTileSelected`. `ChipGroup` and `PriceTile` carry fixed Figma geometry (chip padding,
 * a 52pt compact tile, a yellow idle fill) that doesn't match these cells, so the grid cells are
 * drawn here from one local `Cell`, built on the same tokens.
 *
 * STATIC ONLY, per task: visits, picked days and per-slot coverage are fixture data — there is no
 * availability endpoint yet, and this screen isn't wired to Step 1. What IS real: adding and
 * removing visits (up to 3), scoping a visit to some days, and the clash check between visits
 * that share a day and overlap in time.
 */

export interface RecurringTimeScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (visits: readonly RecurringVisitDraft[]) => void;
  /** "Different time on some days?" — opens Step 3. Left unwired for now, like `onContinue`. */
  readonly onDifferentTimes?: () => void;
  readonly testID?: string;
}

const TIME_OF_DAY_OPTIONS: readonly { id: RecurringTimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
];

/** A candidate start clashes with another visit's own [start, start+duration) on a SHARED day. */
function conflictLabel(
  visits: readonly RecurringVisitDraft[],
  allDayIds: readonly string[],
  activeId: string,
  activeDayIds: readonly string[],
  slotStart: number,
  activeDurationMinutes: number,
): string | null {
  for (const [index, visit] of visits.entries()) {
    if (visit.id === activeId || visit.startMinutes === null) continue;
    const otherDayIds = visitDayIds(visit, index === 0, allDayIds);
    const sharesADay = activeDayIds.some((id) => otherDayIds.includes(id));
    if (!sharesADay) continue;

    const otherEnd = visit.startMinutes + durationMinutes(visit.durationId);
    const slotEnd = slotStart + activeDurationMinutes;
    if (slotStart < otherEnd && slotEnd > visit.startMinutes) return visit.label;
  }
  return null;
}

/** Visits are re-numbered by position after every add/remove, so labels never carry a gap. */
function renumbered(visits: readonly RecurringVisitDraft[]): readonly RecurringVisitDraft[] {
  return visits.map((visit, index) => ({ ...visit, label: `Visit ${index + 1}` }));
}

/**
 * The line under a tab's name. `2c` / `2d` read "1:15 PM · 1.5 hr"; `2e`, with three tabs and no
 * add tab left, drops the duration and reads "1:15 PM".
 */
function tabTimeLabel(visit: RecurringVisitDraft, visitCount: number): string {
  if (visit.startMinutes === null) return 'Pick time';
  const time = formatClock(visit.startMinutes);
  return visitCount < MAX_VISITS ? `${time} · ${durationLabel(visit.durationId)}` : time;
}

/** Splits cells into rows of `columns`, padding the last row so its cells keep the same width. */
function Grid({ columns, children }: { readonly columns: number; readonly children: ReactNode[] }) {
  const rows: ReactNode[][] = [];
  for (let index = 0; index < children.length; index += columns) {
    rows.push(children.slice(index, index + columns));
  }
  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {row}
          {Array.from({ length: columns - row.length }, (_, spacer) => (
            <View key={`spacer-${spacer}`} style={styles.gridCell} />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * The wireframe's grid cell. `partial` is a start time free on only some of the visit's days (a
 * white, dashed cell); `full` and `clash` are unavailable. Colours are the app's own, see banner.
 */
type CellTone = 'idle' | 'selected' | 'partial' | 'full' | 'clash';

const CELL_SURFACE: Record<CellTone, ViewStyle> = {
  idle: { backgroundColor: lightTheme.colors.surfaceMuted },
  selected: { backgroundColor: lightTheme.colors.surfaceTileSelected },
  partial: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.border,
  },
  full: { backgroundColor: lightTheme.colors.surfaceMuted },
  clash: { backgroundColor: lightTheme.colors.surfaceTileDisabled },
};

const CELL_INK: Record<CellTone, ColorToken> = {
  idle: 'textPrimary',
  selected: 'textPrimary',
  partial: 'textPrimary',
  full: 'textDisabled',
  clash: 'textDisabled',
};

function Cell({
  tone,
  onPress,
  style,
  accessibilityLabel,
  testID,
  children,
}: {
  readonly tone: CellTone;
  readonly onPress: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly accessibilityLabel: string;
  readonly testID: string;
  readonly children: ReactNode;
}) {
  const disabled = tone === 'full' || tone === 'clash';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: tone === 'selected', disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.gridCell,
        styles.cell,
        CELL_SURFACE[tone],
        style,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function RecurringTimeScreen({
  onBack,
  onContinue,
  onDifferentTimes,
  testID = 'recurring-time-screen',
}: RecurringTimeScreenProps) {
  const pickedDays = useMemo(() => buildDemoPickedDays(), []);
  const allDayIds = useMemo(() => pickedDays.map((day) => day.id), [pickedDays]);
  const [visits, setVisits] = useState<readonly RecurringVisitDraft[]>(() => buildDemoVisits());
  const [activeVisitId, setActiveVisitId] = useState<string>(() => buildDemoVisits()[0]!.id);

  const activeIndex = visits.findIndex((visit) => visit.id === activeVisitId);
  const activeVisit = visits[activeIndex] ?? visits[0]!;
  const isPrimary = activeIndex <= 0;
  const activeDayIds = visitDayIds(activeVisit, isPrimary, allDayIds);
  const activeDurationMinutes = durationMinutes(activeVisit.durationId);
  const activeTimeOfDayLabel =
    TIME_OF_DAY_OPTIONS.find((option) => option.id === activeVisit.timeOfDay)?.label ?? '';
  const startMinutesGrid = useMemo(
    () => buildStartMinutesFor(activeVisit.timeOfDay),
    [activeVisit.timeOfDay],
  );

  function updateVisit(id: string, patch: Partial<RecurringVisitDraft>) {
    setVisits((current) =>
      current.map((visit) => (visit.id === id ? { ...visit, ...patch } : visit)),
    );
  }

  function addVisit() {
    if (visits.length >= MAX_VISITS) return;
    const next = buildNewVisit(`visit-${Date.now()}`, `Visit ${visits.length + 1}`);
    setVisits((current) => [...current, next]);
    setActiveVisitId(next.id);
  }

  function removeVisit(id: string) {
    setVisits((current) => {
      const next = renumbered(current.filter((visit) => visit.id !== id));
      setActiveVisitId(next[0]!.id);
      return next;
    });
  }

  function setDaysMode(mode: RecurringDaysMode) {
    updateVisit(activeVisit.id, {
      daysMode: mode,
      selectedDayIds:
        mode === 'some' && activeVisit.selectedDayIds.length === 0
          ? defaultSomeDayIds(allDayIds)
          : activeVisit.selectedDayIds,
    });
  }

  const totalVisits = visits.reduce(
    (sum, visit, index) => sum + visitDayIds(visit, index === 0, allDayIds).length,
    0,
  );

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <View>
          <View style={styles.headerWrap}>
            <ScreenHeader title="Time & duration" onBack={onBack} testID={`${testID}-header`} />
          </View>

          {/* The visit tabs sit fixed under the header, outside the scroll area, as drawn. */}
          <View style={styles.tabsWrap}>
            <View style={styles.tabTrack} accessibilityRole="tablist">
              {visits.map((visit) => {
                const active = visit.id === activeVisitId;
                return (
                  <Pressable
                    key={visit.id}
                    onPress={() => setActiveVisitId(visit.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={[styles.tab, active ? styles.tabActive : null]}
                    testID={`${testID}-visit-tab-${visit.id}`}
                  >
                    <Text
                      variant={active ? 'titleBlack' : 'title'}
                      color={active ? 'textPrimary' : 'textSecondary'}
                    >
                      {visit.label}
                    </Text>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>
                      {tabTimeLabel(visit, visits.length)}
                    </Text>
                  </Pressable>
                );
              })}
              {visits.length >= MAX_VISITS ? null : (
                <Pressable
                  onPress={addVisit}
                  accessibilityRole="button"
                  style={[styles.tab, styles.tabAdd]}
                  testID={`${testID}-add-visit`}
                >
                  {/* `2c` reads "+ Add visit"; `2d`, with a second tab taking the room, "+ Visit". */}
                  <Text variant="title" color="textSecondary">
                    {visits.length === 1 ? '+ Add visit' : '+ Visit'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      }
      footer={
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text variant="titleRebook" color="textPrimary">
              {totalVisits} visits · {allDayIds.length} days
            </Text>
            <Pressable accessibilityRole="button" hitSlop={lightTheme.space.sm}>
              <Text variant="title" color="textPrimary" style={styles.underline}>
                Price details
              </Text>
            </Pressable>
          </View>
          <Button
            label="Review plan"
            onPress={() => onContinue?.(visits)}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      {isPrimary ? null : (
        <View style={styles.daysSection}>
          <View style={styles.daysHeader}>
            <Text variant="labelBold" color="textSecondary">
              Days
            </Text>
            <View style={styles.toggleTrack} accessibilityRole="radiogroup">
              {(['all', 'some'] as const).map((mode) => {
                const active = activeVisit.daysMode === mode;
                const label =
                  mode === 'all'
                    ? `All ${allDayIds.length}`
                    : active
                      ? `Some · ${activeVisit.selectedDayIds.length}`
                      : 'Some';
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setDaysMode(mode)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[styles.toggleOption, active ? styles.toggleActive : null]}
                    testID={`${testID}-days-${mode}`}
                  >
                    <Text variant="bodyBold" color={active ? 'textPrimary' : 'textSecondary'}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {activeVisit.daysMode !== 'some' ? null : (
            <Grid columns={6}>
              {pickedDays.map((day) => {
                const selected = activeVisit.selectedDayIds.includes(day.id);
                return (
                  <Cell
                    key={day.id}
                    tone={selected ? 'selected' : 'idle'}
                    style={styles.dayCell}
                    accessibilityLabel={`${day.shortLabel} ${day.dayOfMonth}`}
                    onPress={() =>
                      updateVisit(activeVisit.id, {
                        selectedDayIds: selected
                          ? activeVisit.selectedDayIds.filter((id) => id !== day.id)
                          : [...activeVisit.selectedDayIds, day.id],
                      })
                    }
                    testID={`${testID}-day-${day.id}`}
                  >
                    <Text variant="captionBold" color="textPrimary" style={styles.dayWeekday}>
                      {day.shortLabel}
                    </Text>
                    <Text variant="titleBlack" color="textPrimary">
                      {day.dayOfMonth}
                    </Text>
                  </Cell>
                );
              })}
            </Grid>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text variant="labelBold" color="textSecondary">
          Time of day
        </Text>
        <Grid columns={3}>
          {TIME_OF_DAY_OPTIONS.map((option) => (
            <Cell
              key={option.id}
              tone={activeVisit.timeOfDay === option.id ? 'selected' : 'idle'}
              style={styles.timeOfDayCell}
              accessibilityLabel={option.label}
              onPress={() =>
                updateVisit(activeVisit.id, { timeOfDay: option.id, startMinutes: null })
              }
              testID={`${testID}-time-of-day-${option.id}`}
            >
              <Text variant="title" color="textPrimary">
                {option.label}
              </Text>
            </Cell>
          ))}
        </Grid>
      </View>

      <View style={styles.section}>
        <Text variant="labelBold" color="textSecondary">
          Duration
        </Text>
        <Grid columns={3}>
          {DURATION_OPTIONS.map((option) => (
            <Cell
              key={option.id}
              tone={activeVisit.durationId === option.id ? 'selected' : 'idle'}
              style={styles.durationCell}
              accessibilityLabel={`${option.label}, ${option.price}, reduced from ${option.strikePrice}`}
              onPress={() =>
                updateVisit(activeVisit.id, { durationId: option.id, startMinutes: null })
              }
              testID={`${testID}-duration-${option.id}`}
            >
              <Text variant="heading" color="textPrimary">
                {option.label}
              </Text>
              <View style={styles.prices}>
                <Text variant="bodySmall" color="textPrimary" style={styles.strike}>
                  {option.strikePrice}
                </Text>
                <Text variant="slotLabel" color="textPrimary">
                  {option.price}
                </Text>
              </View>
            </Cell>
          ))}
        </Grid>
      </View>

      <View style={styles.section}>
        <Text variant="labelBold" color="textSecondary">
          Start time · {activeTimeOfDayLabel}
        </Text>
        <Grid columns={4}>
          {startMinutesGrid.map((minutes, slotIndex) => {
            const clash = conflictLabel(
              visits,
              allDayIds,
              activeVisit.id,
              activeDayIds,
              minutes,
              activeDurationMinutes,
            );
            const coverage = coverageFor(activeVisit.timeOfDay, slotIndex, activeDayIds.length);
            const chosen = activeVisit.startMinutes === minutes;
            const tone: CellTone = chosen
              ? 'selected'
              : clash !== null
                ? 'clash'
                : coverage.kind === 'full'
                  ? 'full'
                  : coverage.kind === 'partial'
                    ? 'partial'
                    : 'idle';
            const caption = clash ?? coverage.label;
            const time = formatClock(minutes, true);
            return (
              <Cell
                key={minutes}
                tone={tone}
                style={styles.slotCell}
                accessibilityLabel={`${time}, ${caption}`}
                onPress={() => updateVisit(activeVisit.id, { startMinutes: minutes })}
                testID={`${testID}-start-time-${minutes}`}
              >
                <Text variant="labelBold" color={CELL_INK[tone]}>
                  {time}
                </Text>
                {/* Bold like the time above it — the wireframe's caption inherits the cell's 700. */}
                <Text
                  variant="captionBold"
                  color={
                    tone === 'partial'
                      ? 'textReschedule'
                      : tone === 'full' || tone === 'clash'
                        ? 'textDisabled'
                        : 'textSecondary'
                  }
                >
                  {caption}
                </Text>
              </Cell>
            );
          })}
        </Grid>
      </View>

      {/* `2c` only: with one visit this is the way into Step 3. `2d` / `2e` draw no such link. */}
      {visits.length > 1 ? null : (
        <Pressable
          onPress={onDifferentTimes}
          accessibilityRole="button"
          hitSlop={lightTheme.space.sm}
          testID={`${testID}-different-times`}
        >
          <Text variant="title" color="textPrimary" align="center" style={styles.underline}>
            Different time on some days?
          </Text>
        </Pressable>
      )}

      {isPrimary ? null : (
        <Pressable
          onPress={() => removeVisit(activeVisit.id)}
          accessibilityRole="button"
          hitSlop={lightTheme.space.sm}
          testID={`${testID}-remove-visit`}
        >
          <Text variant="hint" color="textDestructive" align="center" style={styles.underline}>
            Remove {activeVisit.label}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

/** The wireframe's gutter between grid cells, rows and columns alike. */
const GRID_GAP = 6;

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  /** `2c` — the tab row: 4 above, 8 below, inside the screen gutter. */
  tabsWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.xs,
    paddingBottom: lightTheme.space.sm,
  },
  tabTrack: {
    flexDirection: 'row',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: lightTheme.colors.surface, ...lightTheme.elevation.subtle },
  tabAdd: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: lightTheme.colors.textDisabled },
  /** Body opens 6 under the tabs; its blocks sit 14 apart. */
  body: { paddingTop: lightTheme.space.s6, gap: 14 },
  section: { gap: lightTheme.space.s6 },
  daysSection: { gap: lightTheme.space.sm },
  daysHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTrack: {
    flexDirection: 'row',
    gap: lightTheme.space.xs,
    padding: 3,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  toggleOption: {
    paddingVertical: 5,
    paddingHorizontal: lightTheme.space.s10,
    borderRadius: lightTheme.radius.pill,
  },
  toggleActive: { backgroundColor: lightTheme.colors.surface, ...lightTheme.elevation.subtle },
  grid: { gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  gridCell: { flex: 1 },
  cell: { borderRadius: lightTheme.radius.sm, alignItems: 'center', justifyContent: 'center' },
  dayCell: { paddingVertical: lightTheme.space.s6, borderRadius: lightTheme.radius.r10 },
  dayWeekday: { opacity: 0.7 },
  timeOfDayCell: { paddingVertical: 11 },
  durationCell: {
    minHeight: 50,
    paddingVertical: 5,
    paddingHorizontal: lightTheme.space.xs,
  },
  prices: { flexDirection: 'row', gap: lightTheme.space.xs },
  strike: { textDecorationLine: 'line-through', opacity: 0.6 },
  slotCell: {
    paddingTop: lightTheme.space.sm,
    paddingBottom: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.xxs,
  },
  pressed: { opacity: 0.8 },
  /**
   * `2c` — the footer's own top rule, edge to edge: pulled out over `Screen`'s 16 gutter and 8 of
   * top padding, then padded back in.
   */
  footer: {
    gap: lightTheme.space.sm,
    marginHorizontal: -lightTheme.layout.screenPaddingHorizontal,
    marginTop: -lightTheme.space.sm,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.s10,
    borderTopWidth: 1.5,
    borderTopColor: lightTheme.colors.surfaceMuted,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  underline: { textDecorationLine: 'underline' },
});
