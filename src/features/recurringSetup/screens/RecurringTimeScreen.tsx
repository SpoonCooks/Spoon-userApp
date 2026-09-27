import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Button, Screen, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import { HatchedFill } from '../components/HatchedFill';
import { RecurringHeader } from '../components/RecurringHeader';
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
 * Figma `ZIJf639gTWHXshaa2YOeCT` frames `4:554` (`2c`), `4:724` (`2d`) and `4:932` (`2e`) — an
 * import of that wireframe. Layout, sizes, copy AND colours follow them (the stone/ink tokens), as
 * on Step 1. `ChipGroup` and `PriceTile` carry fixed geometry (chip padding, a 52pt compact tile,
 * a yellow idle fill) that doesn't match these cells, so the grid cells are drawn here from one
 * local `Cell`.
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
 * The grid cell. `partial` is a start time free on only some of the visit's days (a white, dashed
 * cell); `full` is taken; `clash` overlaps another visit and is hatched (`4:1044`).
 */
type CellTone = 'idle' | 'selected' | 'partial' | 'full' | 'clash';

const CELL_SURFACE: Record<CellTone, ViewStyle> = {
  idle: { backgroundColor: lightTheme.colors.surfaceStone },
  selected: { backgroundColor: lightTheme.colors.surfaceInk },
  partial: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.borderStoneDashed,
  },
  full: { backgroundColor: lightTheme.colors.surfaceStone },
  clash: { overflow: 'hidden' },
};

/** The main line's ink per tone. */
const CELL_INK: Record<CellTone, ColorToken> = {
  idle: 'textInk',
  selected: 'textInverse',
  partial: 'textInk',
  full: 'textStoneMuted',
  clash: 'textStoneClash',
};

/** A start time's caption ink per tone: `4:660`, `4:685`, `4:671`, `4:697`, `4:1047`. */
const CAPTION_INK: Record<CellTone, ColorToken> = {
  idle: 'textStoneCaption',
  selected: 'textBrand',
  partial: 'textPartial',
  full: 'textStoneMuted',
  clash: 'textStoneClash',
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
      {tone === 'clash' ? <HatchedFill /> : null}
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
          <RecurringHeader title="Time & duration" onBack={onBack} testID={`${testID}-header`} />

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
                      variant={active ? 'labelCounter' : 'labelStrong'}
                      color={active ? 'textInk' : 'textStone'}
                    >
                      {visit.label}
                    </Text>
                    <Text variant="tabMeta" color="textStoneQuiet" numberOfLines={1}>
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
                  <Text variant="labelStrong" color="textStone">
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
            <Text variant="titleTotal" color="textInk">
              {totalVisits} visits · {allDayIds.length} days
            </Text>
            <Pressable accessibilityRole="button" hitSlop={lightTheme.space.sm}>
              <Text variant="labelStrong" color="textInk" style={styles.underline}>
                Price details
              </Text>
            </Pressable>
          </View>
          <Button
            label="Review plan"
            onPress={() => onContinue?.(visits)}
            flat
            labelVariant="titleLargeBlack"
            labelColor="textInk"
            style={styles.cta}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      {isPrimary ? null : (
        <View style={styles.daysSection}>
          <View style={styles.daysHeader}>
            <Text variant="labelBold" color="textStone">
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
                    <Text variant="bodyBoldTight" color={active ? 'textInk' : 'textStone'}>
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
                    <Text
                      variant="weekdayMicro"
                      color={selected ? 'textInverse' : 'textInk'}
                      style={styles.dayWeekday}
                    >
                      {day.shortLabel}
                    </Text>
                    <Text variant="labelCounter" color={selected ? 'textInverse' : 'textInk'}>
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
        <Text variant="labelBold" color="textStone">
          Time of day
        </Text>
        <Grid columns={3}>
          {TIME_OF_DAY_OPTIONS.map((option) => {
            const tone: CellTone = activeVisit.timeOfDay === option.id ? 'selected' : 'idle';
            return (
              <Cell
                key={option.id}
                tone={tone}
                style={styles.timeOfDayCell}
                accessibilityLabel={option.label}
                onPress={() =>
                  updateVisit(activeVisit.id, { timeOfDay: option.id, startMinutes: null })
                }
                testID={`${testID}-time-of-day-${option.id}`}
              >
                <Text variant="labelStrong" color={CELL_INK[tone]}>
                  {option.label}
                </Text>
              </Cell>
            );
          })}
        </Grid>
      </View>

      <View style={styles.section}>
        <Text variant="labelBold" color="textStone">
          Duration
        </Text>
        <Grid columns={3}>
          {DURATION_OPTIONS.map((option) => {
            const tone: CellTone = activeVisit.durationId === option.id ? 'selected' : 'idle';
            return (
              <Cell
                key={option.id}
                tone={tone}
                style={styles.durationCell}
                accessibilityLabel={`${option.label}, ${option.price}, reduced from ${option.strikePrice}`}
                onPress={() =>
                  updateVisit(activeVisit.id, { durationId: option.id, startMinutes: null })
                }
                testID={`${testID}-duration-${option.id}`}
              >
                <Text variant="durationTitle" color={CELL_INK[tone]}>
                  {option.label}
                </Text>
                <View style={styles.prices}>
                  <Text variant="priceMicro" color={CELL_INK[tone]} style={styles.strike}>
                    {option.strikePrice}
                  </Text>
                  <Text variant="priceMicroBold" color={CELL_INK[tone]}>
                    {option.price}
                  </Text>
                </View>
              </Cell>
            );
          })}
        </Grid>
      </View>

      <View style={styles.section}>
        <Text variant="labelBold" color="textStone">
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
            const coverage = coverageFor(
              activeVisit.timeOfDay,
              slotIndex,
              activeDayIds.length,
              isPrimary,
            );
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
                <Text variant="slotCaption" color={CAPTION_INK[tone]}>
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
          <Text variant="labelStrong" color="textInk" align="center" style={styles.underline}>
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
          <Text variant="captionStep" color="textRemove" align="center" style={styles.underline}>
            Remove {activeVisit.label}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

/** `4:595` / `4:655` — the gutter between grid cells, rows and columns alike. */
const GRID_GAP = 6;
/** `4:560` — a 20pt gutter (not the app's 16), as on Step 1. */
const GUTTER = 20;

const styles = StyleSheet.create({
  /** `4:565` — the tab row: 4 above, 8 below, in the 20pt gutter. */
  tabsWrap: {
    paddingHorizontal: GUTTER,
    paddingTop: lightTheme.space.xs,
    paddingBottom: lightTheme.space.sm,
  },
  /** `4:566` — a stone track, 4 inset, tabs 4 apart. */
  tabTrack: {
    flexDirection: 'row',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceStone,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `4:568` — white, lifted by a `0 1 1.5 rgba(0,0,0,0.12)` shadow. */
  tabActive: {
    backgroundColor: lightTheme.colors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1,
  },
  /** `4:574` — a 1pt dashed `#9A988F` edge. */
  tabAdd: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.borderStoneStrong,
  },
  /** `4:580` — body opens 6 under the tabs; its blocks sit 14 apart. */
  body: { paddingHorizontal: GUTTER, paddingTop: lightTheme.space.s6, gap: 14 },
  section: { gap: lightTheme.space.s6 },
  /** `4:751` — the Days row sits 8 above its grid. */
  daysSection: { gap: lightTheme.space.sm },
  daysHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /** `4:756` — a stone track, 3 inset, options 4 apart. */
  toggleTrack: {
    flexDirection: 'row',
    gap: lightTheme.space.xs,
    padding: 3,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceStone,
  },
  toggleOption: {
    paddingVertical: 5,
    paddingHorizontal: lightTheme.space.s10,
    borderRadius: lightTheme.radius.pill,
  },
  /** `4:759` — white, lifted by a `0 1 1 rgba(0,0,0,0.1)` shadow. */
  toggleActive: {
    backgroundColor: lightTheme.colors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  grid: { gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  gridCell: { flex: 1 },
  cell: { borderRadius: lightTheme.radius.sm, alignItems: 'center', justifyContent: 'center' },
  /** `4:762` — py 6 at a 10pt radius: 6 + 13 + 18 + 6 = 43. */
  dayCell: { paddingVertical: lightTheme.space.s6, borderRadius: lightTheme.radius.r10 },
  dayWeekday: { opacity: 0.7 },
  /** `4:586` — py 11 around an 18pt line: 40. */
  timeOfDayCell: { paddingVertical: 11 },
  /** `4:596` — pt 5 / pb 8 / px 4 around 22 + 15: 50. */
  durationCell: {
    minHeight: 50,
    paddingTop: 5,
    paddingBottom: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.xs,
  },
  prices: { flexDirection: 'row', gap: lightTheme.space.xs },
  strike: { textDecorationLine: 'line-through', opacity: 0.6 },
  /**
   * `4:1036` — pt 8 / pb 6 / px 2 around 16 + 16: 46. A dashed cell adds its 1pt edge (48), and
   * the rest of its row stretches to match, as `4:655` draws.
   */
  slotCell: {
    paddingTop: lightTheme.space.sm,
    paddingBottom: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.xxs,
  },
  pressed: { opacity: 0.8 },
  /**
   * `4:713` — the footer's own 1pt stone rule, edge to edge: pulled out over `Screen`'s 16 gutter
   * and 8 of top padding, then padded back in to 20 / 11.
   */
  footer: {
    gap: lightTheme.space.sm,
    marginHorizontal: -lightTheme.layout.screenPaddingHorizontal,
    marginTop: -lightTheme.space.sm,
    paddingHorizontal: GUTTER,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.surfaceStone,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /** `4:720` — a flat 52pt bar at a 16pt radius. */
  cta: { height: 52, paddingVertical: 0, borderRadius: lightTheme.radius.md },
  underline: { textDecorationLine: 'underline' },
});
