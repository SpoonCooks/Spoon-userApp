import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { TIME_OF_DAY_TAB_ICONS } from '../art';
import { useRecurringStartTimes } from '../api';
import { useRecurringPlanning } from '../planning';
import {
  TIME_OF_DAY_BANDS,
  clashes,
  durationMinutes,
  formatStartTime,
  sameDayVisitsFor,
  startTimesFor,
} from '../data';
import type { RecurringBusyWindow } from '../data';
import type { RecurringTimeOfDay, RecurringVisitChoice } from '../types';
import { DurationCarousel } from './DurationCarousel';

/**
 * The choices that schedule a visit — Schedule (`229:1802` → `288:401` → `288:516`, and the last
 * plan's `340:7110` → `340:7455` → `340:7539`), Visit addition (`332:5681` → `332:5921` →
 * `332:5718`) and Edit date (`494:676`).
 *
 * One section, "Pick duration & time": the Duration carousel (`DurationCarousel`) alone until a
 * duration is chosen, then the Morning / Afternoon / Evening tabs and the start times for the tab
 * in use, three to a row. Choosing a duration opens the first time of day that still has a start
 * free; a changed duration keeps the tab, a changed tab clears the start, and either clears a
 * start that no longer fits.
 *
 * Anything that would overlap `busy` is greyed out, a duration with no free start left in the
 * band greys too, and so does a time of day with none left for the chosen duration. Rendered as
 * siblings so they take the screen's own spacing.
 *
 * Durations and prices come from Recurring eligibility, and once a duration is picked the start
 * times are asked of `POST /v1/recurring/start-times` for this visit's days, beside the Plan's
 * other visits on them (`sameDayVisits`): the backend offers a start only when a pool Cook can take
 * it on EVERY one of those days, and calls a time of day with nothing left unavailable. Until the
 * backend answers, every start in the band is offered, as before — the save re-checks either way.
 */
export interface VisitChoicesProps {
  /** A choice already saved, or the part of one already made (the dev preview's states). */
  readonly initial?: Partial<RecurringVisitChoice> | undefined;
  /** The cook's other visits on these days. */
  readonly busy: readonly RecurringBusyWindow[];
  /** The days this visit runs on — what its start times are asked about. */
  readonly dayIds: readonly string[];
  /** The complete choice, or null while one is still missing. */
  readonly onChange: (choice: RecurringVisitChoice | null) => void;
  /**
   * Whether the times (tabs and start times) are showing. The frames tighten the screen's spacing
   * from 24 to 16 once they are (`288:401` against `229:1802`), so the screen needs to know.
   */
  readonly onStartTimesShown?: ((shown: boolean) => void) | undefined;
}

export function VisitChoices({
  initial,
  busy,
  dayIds,
  onChange,
  onStartTimesShown,
}: VisitChoicesProps) {
  const planning = useRecurringPlanning();
  const [timeOfDay, setTimeOfDay] = useState<RecurringTimeOfDay | null>(initial?.timeOfDay ?? null);
  const [durationId, setDurationId] = useState<string | null>(initial?.durationId ?? null);
  const [startMinutes, setStartMinutes] = useState<number | null>(initial?.startMinutes ?? null);

  const startTimes = useRecurringStartTimes(
    planning.addressId === null || durationId === null
      ? null
      : {
          addressId: planning.addressId,
          dates: dayIds,
          durationMinutes: durationMinutes(durationId),
          sameDayVisits: sameDayVisitsFor(busy),
        },
  );
  /** Starts a pool Cook can take on every day of this visit; `null` until the backend answers. */
  const offered = useMemo(() => {
    if (startTimes.state.status !== 'ready') return null;
    return new Set(
      startTimes.state.data.timesOfDay.flatMap((band) => band.startTimes.map(minutesOf)),
    );
  }, [startTimes.state]);
  /** Times of day with no start left on every day; empty until the backend answers. */
  const closedBands = useMemo(() => {
    if (startTimes.state.status !== 'ready') return new Set<RecurringTimeOfDay>();
    return new Set(
      startTimes.state.data.timesOfDay
        .filter((band) => !band.available)
        .map((band) => band.timeOfDay),
    );
  }, [startTimes.state]);

  const commit = (
    nextTime: RecurringTimeOfDay | null,
    nextDuration: string | null,
    nextStart: number | null,
  ) => {
    setTimeOfDay(nextTime);
    setDurationId(nextDuration);
    setStartMinutes(nextStart);
    onChange(
      nextTime !== null && nextDuration !== null && nextStart !== null
        ? { timeOfDay: nextTime, durationId: nextDuration, startMinutes: nextStart }
        : null,
    );
  };

  /** Whether some start in `band` still fits `minutes` around the other visits. */
  const bandFits = (band: RecurringTimeOfDay, minutes: number) =>
    startTimesFor(band).some((start) => !clashes(start, minutes, busy));
  /** A duration is open while some start still fits it — in the chosen band, or in any. */
  const durationOpen = (id: string) =>
    timeOfDay === null
      ? TIME_OF_DAY_BANDS.some((band) => bandFits(band.id, durationMinutes(id)))
      : bandFits(timeOfDay, durationMinutes(id));

  /** The tab a newly chosen duration opens on: the first with a start still free. */
  const firstOpenBand = (minutes: number) =>
    TIME_OF_DAY_BANDS.find((band) => bandFits(band.id, minutes) && !closedBands.has(band.id))?.id ??
    TIME_OF_DAY_BANDS[0]?.id ??
    null;
  const pickDuration = (next: string) =>
    commit(
      timeOfDay ?? firstOpenBand(durationMinutes(next)),
      next,
      startMinutes !== null && !clashes(startMinutes, durationMinutes(next), busy)
        ? startMinutes
        : null,
    );
  const pickTimeOfDay = (next: RecurringTimeOfDay) =>
    commit(next, durationId, next === timeOfDay ? startMinutes : null);

  const startShown = timeOfDay !== null && durationId !== null;
  useEffect(() => {
    onStartTimesShown?.(startShown);
  }, [onStartTimesShown, startShown]);

  return (
    <View style={styles.section}>
      <Text variant="emphasis" color="textPrimary">
        Pick duration & time
      </Text>
      <DurationCarousel
        options={planning.durations.map((option) => ({
          ...option,
          disabled: !durationOpen(option.id),
        }))}
        selectedId={durationId}
        onSelect={pickDuration}
        bleed={lightTheme.space.lg}
      />

      {timeOfDay === null || durationId === null ? null : (
        <View style={styles.times}>
          {/* `340:7539` "Time of day" — three tabs over a 1pt rule. */}
          <View style={styles.tabs} accessibilityRole="tablist">
            {TIME_OF_DAY_BANDS.map((band) => (
              <TimeTab
                key={band.id}
                id={band.id}
                label={band.label}
                selected={band.id === timeOfDay}
                disabled={
                  !bandFits(band.id, durationMinutes(durationId)) || closedBands.has(band.id)
                }
                onPress={() => pickTimeOfDay(band.id)}
              />
            ))}
          </View>
          <Grid columns={3} gap={SLOT_GAP}>
            {startTimesFor(timeOfDay).map((minutes) => (
              <SlotChip
                key={minutes}
                label={formatStartTime(minutes)}
                selected={minutes === startMinutes}
                disabled={
                  clashes(minutes, durationMinutes(durationId), busy) ||
                  (offered !== null && !offered.has(minutes))
                }
                onPress={() => commit(timeOfDay, durationId, minutes)}
              />
            ))}
          </Grid>
        </View>
      )}
    </View>
  );
}

/** `"08:30"` → 510, the flow's own minutes-after-midnight. */
function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Rows of `columns` equal cells, `gap` apart both ways; a short last row keeps cell widths. */
function Grid({
  columns,
  gap,
  children,
}: {
  readonly columns: number;
  readonly gap: number;
  readonly children: React.ReactNode[];
}) {
  const rows: React.ReactNode[][] = [];
  children.forEach((child, index) => {
    const row = Math.floor(index / columns);
    (rows[row] ??= []).push(child);
  });
  return (
    <View style={{ gap }}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
          {Array.from({ length: columns }, (_, column) => (
            <View key={`cell-${column}`} style={styles.cell}>
              {row[column] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

interface ChoiceProps {
  readonly selected: boolean;
  /** `332:5780` / `332:5810` — taken by another visit: `color/surface/disabled`, not pressable. */
  readonly disabled?: boolean;
  readonly onPress: () => void;
}

/**
 * `340:7539` "Period" — a third of the row: the 18pt yellow pictogram 6 from a 14/20 label,
 * 4 below. The tab in use is SemiBold black over a 2pt `#FFD600` underline; the rest Regular at
 * 60 %. A time of day with nothing left is greyed to 25 % and does not respond.
 */
function TimeTab({
  id,
  label,
  selected,
  disabled = false,
  onPress,
}: ChoiceProps & { readonly id: RecurringTimeOfDay; readonly label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      disabled={disabled}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={[styles.tab, selected ? styles.tabSelected : null, disabled ? styles.dim : null]}
      testID={`recurring-time-${id}`}
    >
      <Image source={TIME_OF_DAY_TAB_ICONS[id]} style={styles.tabIcon} />
      <Text
        variant={selected ? 'bodyLargeStrong' : 'bodyLarge'}
        color={selected ? 'textPrimary' : 'textSubdued'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * `340:7539` "Slot" — 44 tall at a 16pt radius, a 14/20 time. Open: white with a 1.5pt `#FFEF99`
 * edge. Picked: `#E2FF68`, a 1.5pt black-25 % edge and a soft lift, the time SemiBold. Taken: black
 * at 3 %, the time at 25 %.
 */
function SlotChip({
  label,
  selected,
  disabled = false,
  onPress,
}: ChoiceProps & { readonly label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      disabled={disabled}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={[
        styles.slot,
        disabled ? styles.slotTaken : selected ? styles.slotPicked : styles.slotOpen,
      ]}
    >
      <Text
        variant={selected && !disabled ? 'bodyLargeStrong' : 'bodyLarge'}
        color={disabled ? 'textDisabledSoft' : 'textPrimary'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** `340:7539` — three 118pt slots across 370: 8 apart, both ways. */
const SLOT_GAP = 8;

const styles = StyleSheet.create({
  /** The title sits right on the carousel, whose cards carry their own 8pt top margin. */
  section: { gap: 0 },
  /** The carousel's dots, 16, the tabs, 12, the start times. */
  times: { gap: lightTheme.space.md, marginTop: lightTheme.space.lg },
  row: { flexDirection: 'row' },
  cell: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.borderTimeTabs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: lightTheme.space.xs,
    paddingBottom: lightTheme.space.s10,
  },
  /** The 2pt underline sits on the 1pt rule: pulled down by 1 so the two overlap. */
  tabSelected: {
    borderBottomWidth: 2,
    borderBottomColor: lightTheme.colors.borderTimeTabSelected,
    marginBottom: -1,
  },
  tabIcon: { width: 18, height: 18 },
  dim: { opacity: 0.4 },
  slot: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
  },
  slotOpen: {
    borderWidth: 1.5,
    borderColor: lightTheme.colors.borderStartTime,
    backgroundColor: lightTheme.colors.surface,
  },
  slotPicked: {
    borderWidth: 1.5,
    borderColor: lightTheme.colors.borderDurationFocus,
    backgroundColor: lightTheme.colors.surfaceStartTimeSelected,
    boxShadow: '0 0 12px rgba(0,0,0,0.1)',
  },
  slotTaken: { backgroundColor: lightTheme.colors.surfaceStartTimeUnavailable },
});
