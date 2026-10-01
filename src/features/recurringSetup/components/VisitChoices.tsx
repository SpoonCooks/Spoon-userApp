import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import { TIME_OF_DAY_ICONS } from '../art';
import {
  DURATION_OPTIONS,
  TIME_OF_DAY_BANDS,
  clashes,
  durationMinutes,
  formatStartTime,
  startTimesFor,
} from '../data';
import type { RecurringBusyWindow } from '../data';
import type { RecurringTimeOfDay, RecurringVisitChoice } from '../types';

/**
 * The three choices that schedule a visit, opening one after another: time of the day, then
 * duration, then start time — Schedule (`288:516`, `332:5718`) and Edit date (`494:676`).
 *
 * Changing the time of day clears the start time, whose options depend on it. Anything that
 * would overlap `busy` is greyed out, and a duration with no free start left in the band greys
 * too. Rendered as three siblings so they take the screen's own 24pt spacing.
 */
export interface VisitChoicesProps {
  readonly initial?: RecurringVisitChoice | undefined;
  /** The cook's other visits on these days. */
  readonly busy: readonly RecurringBusyWindow[];
  /** "Time of the day", or "Time" on a further visit (`332:5722`). */
  readonly timeLabel: string;
  /** The complete choice, or null while one is still missing. */
  readonly onChange: (choice: RecurringVisitChoice | null) => void;
}

export function VisitChoices({ initial, busy, timeLabel, onChange }: VisitChoicesProps) {
  const [timeOfDay, setTimeOfDay] = useState<RecurringTimeOfDay | null>(initial?.timeOfDay ?? null);
  const [durationId, setDurationId] = useState<string | null>(initial?.durationId ?? null);
  const [startMinutes, setStartMinutes] = useState<number | null>(initial?.startMinutes ?? null);

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

  /** A duration is open while some start in the band still fits around the other visits. */
  const durationOpen = (band: RecurringTimeOfDay, id: string) =>
    startTimesFor(band).some((start) => !clashes(start, durationMinutes(id), busy));

  const pickTimeOfDay = (next: RecurringTimeOfDay) =>
    commit(
      next,
      durationId !== null && durationOpen(next, durationId) ? durationId : null,
      next === timeOfDay ? startMinutes : null,
    );
  const pickDuration = (next: string) =>
    commit(
      timeOfDay,
      next,
      startMinutes !== null && !clashes(startMinutes, durationMinutes(next), busy)
        ? startMinutes
        : null,
    );

  return (
    <>
      <Section title={timeLabel}>
        <View style={styles.row}>
          {TIME_OF_DAY_BANDS.map((band) => (
            <TimePill
              key={band.id}
              id={band.id}
              label={band.label}
              selected={band.id === timeOfDay}
              onPress={() => pickTimeOfDay(band.id)}
            />
          ))}
        </View>
      </Section>

      {timeOfDay === null ? null : (
        <Section title="Duration">
          <Grid columns={3} gap={DURATION_GAP}>
            {DURATION_OPTIONS.map((option) => (
              <DurationTile
                key={option.id}
                label={option.label}
                price={option.price}
                strikePrice={option.strikePrice}
                selected={option.id === durationId}
                disabled={!durationOpen(timeOfDay, option.id)}
                onPress={() => pickDuration(option.id)}
              />
            ))}
          </Grid>
        </Section>
      )}

      {timeOfDay === null || durationId === null ? null : (
        <Section title="Start time">
          <Grid columns={4} gap={SLOT_GAP}>
            {startTimesFor(timeOfDay).map((minutes) => (
              <SlotChip
                key={minutes}
                label={formatStartTime(minutes)}
                selected={minutes === startMinutes}
                disabled={clashes(minutes, durationMinutes(durationId), busy)}
                onPress={() => commit(timeOfDay, durationId, minutes)}
              />
            ))}
          </Grid>
        </Section>
      )}
    </>
  );
}

/** `288:520` / `288:550` / `288:583` — a Body 14/20 label, 8 above its options. */
function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="bodyLarge" color="textPrimary">
        {title}
      </Text>
      {children}
    </View>
  );
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
 * `288:522` — the time-of-day pill: 36 tall, px 16 (px 12 on "Afternoon"), a 14pt pictogram 4
 * from the label. Selected is `#FFE666` with Elevation/1; unselected `#FFF7CC`. The three share
 * the row in Figma's own widths (118 / 110 / 118).
 */
function TimePill({
  id,
  label,
  selected,
  onPress,
}: ChoiceProps & { readonly id: RecurringTimeOfDay; readonly label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[
        styles.pill,
        id === 'afternoon' ? styles.pillNarrow : styles.pillWide,
        selected ? styles.choiceSelected : styles.choiceIdle,
        selected ? styles.pillLift : null,
      ]}
      testID={`recurring-time-${id}`}
    >
      <Image source={TIME_OF_DAY_ICONS[id]} style={styles.pillIcon} />
      <Text variant="bodyLargeStrong" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

/** `288:552` — 60 tall, p 8, the label over a struck price and the price, 8 apart. */
function DurationTile({
  label,
  price,
  strikePrice,
  selected,
  disabled = false,
  onPress,
}: ChoiceProps & {
  readonly label: string;
  readonly price: string;
  readonly strikePrice: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      disabled={disabled}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${label}, ${price}, was ${strikePrice}`}
      style={[styles.duration, choiceTone(selected, disabled)]}
    >
      <Text variant="headingBold" color="textPrimary">
        {label}
      </Text>
      <View style={styles.priceRow}>
        <Text variant="bodyStrong" color="textSubdued" style={styles.strike}>
          {strikePrice}
        </Text>
        <Text variant="bodyStrong" color="textPrimary">
          {price}
        </Text>
      </View>
    </Pressable>
  );
}

/** `288:585` — the Slot chip: p 8 at an 8pt radius, a SemiBold 14/20 time. */
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
      style={[styles.slot, choiceTone(selected, disabled)]}
    >
      <Text variant="bodyLargeStrong" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

function choiceTone(selected: boolean, disabled: boolean) {
  if (disabled) return styles.choiceDisabled;
  return selected ? styles.choiceSelected : styles.choiceIdle;
}

/** `288:550` — three 115.33 tiles across 370: 12 apart, both ways. */
const DURATION_GAP = 12;
/** `288:583` — four 86.5 chips across 370: 8 apart, both ways. */
const SLOT_GAP = 8;

const styles = StyleSheet.create({
  section: { gap: lightTheme.space.sm },
  row: { flexDirection: 'row', gap: 12 },
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
  choiceIdle: { backgroundColor: lightTheme.colors.surfaceAccent },
  choiceSelected: { backgroundColor: lightTheme.colors.surfaceBrandTint },
  choiceDisabled: { backgroundColor: lightTheme.colors.surfaceDisabledSoft },
  duration: {
    height: 60,
    padding: lightTheme.space.sm,
    gap: lightTheme.space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.xs,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.sm },
  strike: { textDecorationLine: 'line-through' },
  slot: {
    padding: lightTheme.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.xs,
  },
});
