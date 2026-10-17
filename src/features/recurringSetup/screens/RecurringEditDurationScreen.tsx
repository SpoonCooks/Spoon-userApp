import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getUserMessage, isAppError } from '@core/errors';
import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { RecurringBookingDto, VisitDurationOptionsDto } from '../api';
import { DurationCarousel } from '../components/DurationCarousel';
import { EditDateHeader } from '../components/EditDateHeader';
import { RecurringFooter } from '../components/RecurringFooter';
import { durationIdFor, durationMinutes, editDateLabel } from '../data';
import { durationOptionsFrom } from '../planning';
import type { RecurringVisitChoice } from '../types';

/**
 * A live booking's Edit duration (DEC-093), from Manage plans' pencil. Laid out as setup's Edit date
 * (`494:676`): the date's booking as it stands in the header, the duration carousel below. Only the
 * duration of one day's visit changes; time of day and start stay, so those chips open nothing.
 *
 * The visit's upcoming dates sit above the carousel, the chosen one in the header. The prices are
 * the server's for today (`GET …/visits/{visitId}/duration-options`). A change is taken until the
 * day's Autopay notice, 27 hours before its first visit: the note under the carousel says so, and a
 * date past it shows why it cannot change.
 */
export interface EditDurationDate {
  readonly visitId: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
  /** The visit on that date as it stands. */
  readonly visit: RecurringVisitChoice;
}

export interface RecurringEditDurationScreenProps {
  readonly planNumber: number;
  /** The visit's upcoming dates, earliest first. */
  readonly dates: readonly EditDurationDate[];
  readonly selectedVisitId: string;
  readonly onSelectDate: (visitId: string) => void;
  /** The chosen date's options, or null while they load. */
  readonly options: VisitDurationOptionsDto | null;
  readonly saving: boolean;
  readonly onBack: () => void;
  readonly onSave: (durationMinutes: number) => void;
  readonly testID?: string;
}

export const EDIT_WINDOW_NOTE = '* Duration can be changed until 27 hours before the visit.';
export const EDIT_WINDOW_CLOSED_NOTE =
  '* This day’s Autopay notice has gone out, so its duration can no longer be changed.';

export function RecurringEditDurationScreen({
  planNumber,
  dates,
  selectedVisitId,
  onSelectDate,
  options,
  saving,
  onBack,
  onSave,
  testID = 'recurring-edit-duration-screen',
}: RecurringEditDurationScreenProps) {
  const selected = dates.find((entry) => entry.visitId === selectedVisitId) ?? dates[0];
  // The pick is per date: choosing another date starts again from that date's own duration.
  const [pick, setPick] = useState<{ readonly visitId: string; readonly durationId: string }>();
  const current = selected?.visit.durationId ?? null;
  const picked =
    pick !== undefined && pick.visitId === selected?.visitId ? pick.durationId : current;
  const ready = options !== null && options.visitId === selected?.visitId;
  const editable = ready && options.editable;
  const canSave = editable && !saving && picked !== null && picked !== current;

  return (
    <Screen
      tone="plain"
      padded={false}
      testID={testID}
      header={
        <View>
          <ScreenHeader
            density="nav"
            title="Edit duration"
            onBack={onBack}
            testID={`${testID}-header`}
          />
          {selected === undefined ? null : (
            <EditDateHeader
              planNumber={planNumber}
              dayId={selected.date}
              visit={selected.visit}
              active="duration"
              // Only the duration changes on a live booking.
              onSelect={() => undefined}
              testID={`${testID}-details`}
            />
          )}
        </View>
      }
      footer={
        <RecurringFooter
          label={saving ? 'Saving…' : 'Save changes'}
          disabled={!canSave}
          onPress={() => {
            if (canSave) onSave(durationMinutes(picked));
          }}
          testID={`${testID}-save`}
        />
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Its own height only: in the screen's column a ScrollView otherwise takes what is left.
        style={styles.dateStrip}
        contentContainerStyle={styles.dates}
        testID={`${testID}-dates`}
      >
        {dates.map((entry) => {
          const active = entry.visitId === selected?.visitId;
          return (
            <Pressable
              key={entry.visitId}
              onPress={() => onSelectDate(entry.visitId)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={editDateLabel(entry.date)}
              style={[styles.date, active ? styles.dateActive : null]}
              testID={`${testID}-date-${entry.date}`}
            >
              <Text variant="bodyStrong" color="textPrimary" numberOfLines={1}>
                {editDateLabel(entry.date)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.carousel}>
        {ready ? (
          <DurationCarousel
            options={durationOptionsFrom(options.options).map((option) => ({
              ...option,
              disabled: !options.editable,
            }))}
            selectedId={picked}
            onSelect={(durationId) => {
              if (selected !== undefined) setPick({ visitId: selected.visitId, durationId });
            }}
            testID={`${testID}-carousel`}
          />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text variant="body" color="textSecondary" style={styles.note} testID={`${testID}-note`}>
        {ready && !options.editable ? EDIT_WINDOW_CLOSED_NOTE : EDIT_WINDOW_NOTE}
      </Text>
    </Screen>
  );
}

/**
 * The dates one visit (a Plan's 1st, 2nd …) can still have its duration changed on: those still
 * `scheduled`, earliest first. A day past its notice is `notified` or later, so it is not offered.
 */
export function editDurationDatesFrom(
  booking: RecurringBookingDto,
  planNumber: number,
  visitNumber: number,
): readonly EditDurationDate[] {
  return booking.days
    .flatMap((day) => day.visits)
    .filter(
      (visit) =>
        visit.planNumber === planNumber &&
        visit.visitNumber === visitNumber &&
        visit.status === 'scheduled',
    )
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((visit) => {
      const [hours, minutes] = visit.startTime.split(':').map(Number) as [number, number];
      return {
        visitId: visit.visitId,
        date: visit.date,
        visit: {
          timeOfDay: visit.timeOfDay,
          durationId: durationIdFor(visit.durationMinutes),
          startMinutes: hours * 60 + minutes,
        },
      };
    });
}

const styles = StyleSheet.create({
  dateStrip: { flexGrow: 0 },
  dates: {
    alignItems: 'flex-start',
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
    gap: lightTheme.space.sm,
  },
  /** As Edit date's chips (`512:1264`): a `#FFF7CC` pill, the chosen one edged in black. */
  date: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  dateActive: { borderColor: lightTheme.colors.borderInk },
  carousel: { paddingTop: lightTheme.space.xl },
  /** Holds the carousel's height while the prices load, so the note does not jump. */
  placeholder: { height: 160 },
  note: { paddingHorizontal: lightTheme.space.lg, paddingTop: lightTheme.space.lg },
});

/** Why the change was refused, in the customer's words. */
export function durationChangeMessage(failure: unknown): string {
  if (!isAppError(failure)) return 'Please try again in a moment.';
  switch (failure.details?.reason) {
    case 'EDIT_WINDOW_CLOSED':
      return 'This day’s Autopay notice has gone out, so its duration can no longer be changed.';
    case 'BOOKING_NOT_LIVE':
      return 'This Recurring booking is no longer live.';
    case 'VISIT_OVERLAP':
      return 'At that length this visit would run into your next visit that day. Pick a shorter duration.';
    case 'VISIT_UNAVAILABLE':
      return 'No cook from your pool is free for that length on this day. Your visit stays as it was.';
    default:
      return getUserMessage(failure);
  }
}
