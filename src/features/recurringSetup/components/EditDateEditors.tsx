import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import { TIME_OF_DAY_ICONS } from '../art';
import { useRecurringStartTimes } from '../api';
import { useRecurringPlanning } from '../planning';
import {
  TIME_OF_DAY_BANDS,
  clashes,
  durationMinutes,
  formatStartTime,
  startTimesFor,
} from '../data';
import type { RecurringBusyWindow } from '../data';
import { durationOpen } from '../editDateDraft';
import type { EditDateDraft } from '../editDateDraft';
import type { RecurringTimeOfDay } from '../types';
import { DurationCarousel } from './DurationCarousel';

/**
 * The three editors Edit date (`494:676`) opens under its header, one at a time — whichever
 * chip is outlined. Each is the choice Schedule offers (`288:516`), on its own:
 *
 *  - time of the day: the Morning / Afternoon / Evening pills;
 *  - duration: the snapping carousel of tiles;
 *  - start time: the four-across grid of slots in the picked band.
 *
 * `494:676` draws only the duration one (a carousel 24 below the header); the other two keep the
 * same 24 above them and the screen's 16 gutters.
 */

/** `1221:4505` — the carousel runs edge to edge, 24 below the header. */
export function DurationEditor({
  draft,
  busy,
  onPick,
}: {
  readonly draft: EditDateDraft;
  readonly busy: readonly RecurringBusyWindow[];
  readonly onPick: (durationId: string) => void;
}) {
  const planning = useRecurringPlanning();
  return (
    <View style={styles.duration}>
      <DurationCarousel
        options={planning.durations.map((option) => ({
          ...option,
          disabled: !durationOpen(draft.timeOfDay, option.id, busy),
        }))}
        selectedId={draft.durationId}
        onSelect={onPick}
        testID="recurring-edit-date-duration"
      />
    </View>
  );
}

/** `922:1829` — the time-of-day pills: 36 tall, px 16 (px 12 on "Afternoon"), 12 apart. */
export function TimeOfDayEditor({
  value,
  onPick,
}: {
  readonly value: RecurringTimeOfDay;
  readonly onPick: (timeOfDay: RecurringTimeOfDay) => void;
}) {
  return (
    <View style={styles.pills}>
      {TIME_OF_DAY_BANDS.map((band) => (
        <TimePill
          key={band.id}
          id={band.id}
          label={band.label}
          selected={band.id === value}
          onPress={() => onPick(band.id)}
        />
      ))}
    </View>
  );
}

/**
 * `922:1892` — the start times of the picked band, four across 8 apart. Anything that would
 * overlap the plan's other visits is greyed, and — as on Schedule — a start no pool Cook can take
 * on this date once the backend has answered. Greyed too until a duration is picked, since which
 * starts fit depends on it.
 */
export function StartTimeEditor({
  draft,
  busy,
  dayId,
  onPick,
}: {
  readonly draft: EditDateDraft;
  readonly busy: readonly RecurringBusyWindow[];
  readonly dayId: string;
  readonly onPick: (startMinutes: number) => void;
}) {
  const planning = useRecurringPlanning();
  const startTimes = useRecurringStartTimes({
    addressId: planning.addressId,
    dates: [dayId],
    durationMinutes: draft.durationId === null ? null : durationMinutes(draft.durationId),
  });
  /** Starts a pool Cook can take on the date; `null` until the backend answers. */
  const offered = useMemo(() => {
    if (startTimes.state.status !== 'ready') return null;
    return new Set(
      startTimes.state.data.startTimes
        .filter((slot) => slot.coverage === 'all')
        .map((slot) => minutesOf(slot.startTime)),
    );
  }, [startTimes.state]);

  const rows: (readonly number[])[] = [];
  const starts = startTimesFor(draft.timeOfDay);
  for (let index = 0; index < starts.length; index += SLOT_COLUMNS) {
    rows.push(starts.slice(index, index + SLOT_COLUMNS));
  }

  return (
    <View style={styles.slots}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.slotRow}>
          {Array.from({ length: SLOT_COLUMNS }, (_, column) => {
            const minutes = row[column];
            if (minutes === undefined) return <View key={`empty-${column}`} style={styles.cell} />;
            const disabled =
              draft.durationId === null ||
              clashes(minutes, durationMinutes(draft.durationId), busy) ||
              (offered !== null && !offered.has(minutes));
            return (
              <View key={minutes} style={styles.cell}>
                <SlotChip
                  label={formatStartTime(minutes)}
                  selected={minutes === draft.startMinutes}
                  disabled={disabled}
                  onPress={() => onPick(minutes)}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** `"08:30"` → 510, the flow's own minutes-after-midnight. */
function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * `922:1830` — the time-of-day pill: 36 tall, px 16 (px 12 on "Afternoon"), a 14pt pictogram 4
 * from the label. Selected is `#FFE666` with Elevation/1; unselected `#FFF7CC`. The three share
 * the row in Figma's own widths (118 / 110 / 118).
 */
function TimePill({
  id,
  label,
  selected,
  onPress,
}: {
  readonly id: RecurringTimeOfDay;
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[
        styles.pill,
        id === 'afternoon' ? styles.pillNarrow : styles.pillWide,
        selected ? styles.selected : styles.idle,
        selected ? styles.pillLift : null,
      ]}
      testID={`recurring-edit-date-time-${id}`}
    >
      <Image source={TIME_OF_DAY_ICONS[id]} style={styles.pillIcon} />
      <Text variant="bodyLargeStrong" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

/** `922:1893` — the Slot chip: p 8 at an 8pt radius, a SemiBold 14/20 time. */
function SlotChip({
  label,
  selected,
  disabled,
  onPress,
}: {
  readonly label: string;
  readonly selected: boolean;
  /** `922:1897` — taken: `color/surface/disabled`, not pressable. */
  readonly disabled: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      disabled={disabled}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={[styles.slot, disabled ? styles.disabled : selected ? styles.selected : styles.idle]}
      testID={`recurring-edit-date-start-${label}`}
    >
      <Text variant="bodyLargeStrong" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

/** `922:1892` — four 86.5 chips across 370. */
const SLOT_COLUMNS = 4;
const SLOT_GAP = 8;

const styles = StyleSheet.create({
  /** `1221:4505` — the carousel's own pt 24 (the track draws its tiles 12 clear of the edge). */
  duration: { paddingTop: lightTheme.space.xl },
  /** The pills and slots share the screen's 16 gutters and the carousel's 24 lead. */
  pills: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: lightTheme.space.xl,
    paddingHorizontal: lightTheme.space.lg,
  },
  slots: {
    gap: SLOT_GAP,
    paddingTop: lightTheme.space.xl,
    paddingHorizontal: lightTheme.space.lg,
  },
  slotRow: { flexDirection: 'row', gap: SLOT_GAP },
  cell: { flex: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.xs,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.xs,
  },
  /** 118 : 110 : 118 — grown from a zero basis, they land on Figma's widths at 370. */
  pillWide: { flexGrow: 118, flexBasis: 0, paddingHorizontal: lightTheme.space.lg },
  pillNarrow: { flexGrow: 110, flexBasis: 0, paddingHorizontal: lightTheme.space.md },
  pillLift: { boxShadow: innerShadows.elevation1 },
  pillIcon: { width: 14, height: 14 },
  slot: {
    padding: lightTheme.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.xs,
  },
  idle: { backgroundColor: lightTheme.colors.surfaceAccent },
  selected: { backgroundColor: lightTheme.colors.surfaceBrandTint },
  disabled: { backgroundColor: lightTheme.colors.surfaceDisabledSoft },
});
