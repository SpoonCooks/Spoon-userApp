import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import { TIME_OF_DAY_ICONS } from '../art';
import { PlanBanner } from '../components/PlanBanner';
import { RecurringFooter } from '../components/RecurringFooter';
import { SelectedDays } from '../components/SelectedDays';
import {
  DURATION_OPTIONS,
  TIME_OF_DAY_BANDS,
  formatStartTime,
  ordinal,
  startTimesFor,
} from '../data';
import type { RecurringTimeOfDay, RecurringVisitChoice } from '../types';

/**
 * Recurring setup — Schedule, one plan's visit at a time.
 *
 * Source: Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User): `229:1802` / `288:401` / `288:516` (Plan 1:
 * time, duration, start time) and `340:7110` / `340:7455` / `340:7539` (the last plan).
 *
 * The Plan banner names the plan and its visit, then the plan's days, then three choices that open
 * one after another: time of the day, then duration, then start time. Changing the time of day
 * clears the start time, whose options depend on it. The CTA unlocks once a start time is picked.
 *
 * CTA copy is the frames': "Save & Schedule Plan N+1" while plans remain, "Save & Continue" on the
 * last. (The note under `340:7539` words them "Move to Plan (i+1)" / "Continue"; the frames win.)
 *
 * Start times are every 30 minutes across the band and all available until availability is read.
 */
export interface RecurringScheduleScreenProps {
  /** 1-based. */
  readonly planNumber: number;
  /** 1-based: which visit on the plan's days this schedules. */
  readonly visitNumber: number;
  readonly dayIds: readonly string[];
  /** A choice already saved for this visit, to edit rather than start blank. */
  readonly initial?: RecurringVisitChoice | undefined;
  /** "Save & Schedule Plan 3", or "Save & Continue" on the last plan. */
  readonly ctaLabel: string;
  readonly onBack: () => void;
  readonly onSave: (choice: RecurringVisitChoice) => void;
  readonly testID?: string;
}

export function RecurringScheduleScreen({
  planNumber,
  visitNumber,
  dayIds,
  initial,
  ctaLabel,
  onBack,
  onSave,
  testID = 'recurring-schedule-screen',
}: RecurringScheduleScreenProps) {
  const [timeOfDay, setTimeOfDay] = useState<RecurringTimeOfDay | null>(initial?.timeOfDay ?? null);
  const [durationId, setDurationId] = useState<string | null>(initial?.durationId ?? null);
  const [startMinutes, setStartMinutes] = useState<number | null>(initial?.startMinutes ?? null);
  const complete = timeOfDay !== null && durationId !== null && startMinutes !== null;

  const pickTimeOfDay = (next: RecurringTimeOfDay) => {
    if (next !== timeOfDay) setStartMinutes(null);
    setTimeOfDay(next);
  };

  return (
    <Screen
      scroll
      tone="plain"
      padded={false}
      showsScrollIndicator={false}
      contentStyle={styles.content}
      testID={testID}
      header={
        <ScreenHeader density="nav" title="Schedule" onBack={onBack} testID={`${testID}-header`} />
      }
      footer={
        <RecurringFooter
          layout="pill"
          label={ctaLabel}
          disabled={!complete}
          onPress={() => {
            if (timeOfDay !== null && durationId !== null && startMinutes !== null) {
              onSave({ timeOfDay, durationId, startMinutes });
            }
          }}
          testID={`${testID}-save`}
        />
      }
    >
      <PlanBanner
        planNumber={planNumber}
        subtitle={`${dayIds.length} day${dayIds.length === 1 ? '' : 's'} · ${ordinal(visitNumber)} Visit`}
        testID={`${testID}-banner`}
      />

      <SelectedDays dayIds={dayIds} testID={`${testID}-days`} />

      <Section title="Time of the day">
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
                onPress={() => setDurationId(option.id)}
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
                onPress={() => setStartMinutes(minutes)}
              />
            ))}
          </Grid>
        </Section>
      )}
    </Screen>
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
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${price}, was ${strikePrice}`}
      style={[styles.duration, selected ? styles.choiceSelected : styles.choiceIdle]}
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
function SlotChip({ label, selected, onPress }: ChoiceProps & { readonly label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.slot, selected ? styles.choiceSelected : styles.choiceIdle]}
    >
      <Text variant="bodyLargeStrong" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

/** `288:550` — three 115.33 tiles across 370: 12 apart, both ways. */
const DURATION_GAP = 12;
/** `288:583` — four 86.5 chips across 370: 8 apart, both ways. */
const SLOT_GAP = 8;

const styles = StyleSheet.create({
  /** `288:519` — p 16, 24 between blocks. */
  content: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
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
