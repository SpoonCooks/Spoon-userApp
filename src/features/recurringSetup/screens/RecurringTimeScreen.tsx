import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Chip,
  ChipGroup,
  Icon,
  PriceTile,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
} from '@ui';
import type { ChipOption } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import {
  DURATION_OPTIONS,
  MAX_VISITS,
  buildDemoPickedDays,
  buildDemoVisits,
  buildNewVisit,
  buildStartMinutesFor,
  coverageFor,
  defaultSomeDayIds,
  durationMinutes,
  formatClock,
  visitDayIds,
} from '../data';
import type { RecurringDaysMode, RecurringTimeOfDay, RecurringVisitDraft } from '../types';

/**
 * Recurring setup — Step 2 "Time & duration".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, states `2c`
 * (one visit, the default), `2d` (two visits, the second scoped to "Some" days) and `2e` (three
 * visits, all on every day). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md — a wireframe, not a
 * pixel-accurate mock, and NOT three separate screens: it's one screen that grows from `2c` to
 * `2e` as "+ Add visit" is tapped, which is what this renders. Reuses the app's existing pieces —
 * `ChipGroup` for every single-select row (Days mode, Time of day, Start time, exactly like
 * `ScheduleScreen`), `PriceTile`'s duration grid, `SectionHeader`, `Button`. The visit tabs and
 * the day-subset picker fall back to the bare `Chip` primitive instead: the tabs mix a radio
 * group with a trailing "+ Add visit" action, and the day picker is multi-select — neither shape
 * fits `ChipGroup`, which is single-select only.
 *
 * STATIC ONLY, per task: visits, the picked-day list and the per-slot "day coverage" figures are
 * local fixture data (`buildDemoVisits`, `buildDemoPickedDays`, `coverageFor`) — there is no
 * availability endpoint yet, and this screen isn't wired to Step 1's actual selection. What IS
 * real: adding/removing visits (up to 3), scoping a visit to a day subset, and the conflict check
 * between visits that share a day and an overlapping time.
 */

export interface RecurringTimeScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (visits: readonly RecurringVisitDraft[]) => void;
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

export function RecurringTimeScreen({
  onBack,
  onContinue,
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

  const totalVisits = visits.reduce(
    (sum, visit, index) => sum + visitDayIds(visit, index === 0, allDayIds).length,
    0,
  );

  const startTimeOptions: readonly ChipOption[] = startMinutesGrid.map((minutes, slotIndex) => {
    const conflict = conflictLabel(
      visits,
      allDayIds,
      activeVisit.id,
      activeDayIds,
      minutes,
      activeDurationMinutes,
    );
    const coverage = conflict === null ? coverageFor(slotIndex, activeDayIds.length) : null;
    // Already chosen, so never greyed out — a past pick doesn't retroactively become invalid
    // just because this fixture's illustrative coverage pattern lands on it.
    const alreadyChosen = activeVisit.startMinutes === minutes;
    return {
      id: String(minutes),
      caption: conflict ?? coverage!.label,
      label: formatClock(minutes),
      disabled: !alreadyChosen && (conflict !== null || coverage!.disabled),
    };
  });

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Time & duration" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text variant="caption" color="textSecondary">
              {totalVisits} visits · {allDayIds.length} days
            </Text>
            <Pressable accessibilityRole="button" hitSlop={lightTheme.space.sm}>
              <Text variant="micro" color="textPrimary" style={styles.underline}>
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
      <View style={styles.tabs}>
        {visits.map((visit) => (
          <Chip
            key={visit.id}
            caption={visit.label}
            label={visit.startMinutes === null ? 'Pick time' : formatClock(visit.startMinutes)}
            selected={visit.id === activeVisitId}
            onPress={() => setActiveVisitId(visit.id)}
            testID={`${testID}-visit-tab-${visit.id}`}
          />
        ))}
        {visits.length >= MAX_VISITS ? null : (
          <Pressable
            onPress={addVisit}
            accessibilityRole="button"
            accessibilityLabel="Add visit"
            style={({ pressed }) => [styles.addVisit, pressed ? styles.pressed : null]}
            testID={`${testID}-add-visit`}
          >
            <Icon name="plus" size={14} color="textPrimary" />
            <Text variant="bodyBlack" color="textPrimary">
              Add visit
            </Text>
          </Pressable>
        )}
      </View>

      {isPrimary ? null : (
        <View style={styles.section}>
          <SectionHeader title="Days" />
          <ChipGroup
            options={[
              { id: 'all', label: `All ${allDayIds.length}` },
              {
                id: 'some',
                label:
                  activeVisit.daysMode === 'some'
                    ? `Some · ${activeVisit.selectedDayIds.length}`
                    : 'Some',
              },
            ]}
            selectedId={activeVisit.daysMode}
            onSelect={(id) =>
              updateVisit(activeVisit.id, {
                daysMode: id as RecurringDaysMode,
                selectedDayIds:
                  id === 'some' && activeVisit.selectedDayIds.length === 0
                    ? defaultSomeDayIds(allDayIds)
                    : activeVisit.selectedDayIds,
              })
            }
            testID={`${testID}-days-mode`}
          />

          {activeVisit.daysMode !== 'some' ? null : (
            <View style={styles.dayGrid}>
              {pickedDays.map((day) => {
                const selected = activeVisit.selectedDayIds.includes(day.id);
                return (
                  <Chip
                    key={day.id}
                    caption={day.shortLabel}
                    label={String(day.dayOfMonth)}
                    selected={selected}
                    onPress={() =>
                      updateVisit(activeVisit.id, {
                        selectedDayIds: selected
                          ? activeVisit.selectedDayIds.filter((id) => id !== day.id)
                          : [...activeVisit.selectedDayIds, day.id],
                      })
                    }
                    testID={`${testID}-day-${day.id}`}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Time of day" />
        <ChipGroup
          options={TIME_OF_DAY_OPTIONS}
          selectedId={activeVisit.timeOfDay}
          onSelect={(id) =>
            updateVisit(activeVisit.id, {
              timeOfDay: id as RecurringTimeOfDay,
              startMinutes: null,
            })
          }
          columns={3}
          testID={`${testID}-time-of-day`}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Duration" />
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((option) => (
            <View key={option.id} style={styles.durationCell}>
              <PriceTile
                label={option.label}
                price={option.price}
                strikePrice={option.strikePrice}
                selected={activeVisit.durationId === option.id}
                onPress={() =>
                  updateVisit(activeVisit.id, { durationId: option.id, startMinutes: null })
                }
                testID={`${testID}-duration-${option.id}`}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Start time"
          subtitle={
            TIME_OF_DAY_OPTIONS.find((option) => option.id === activeVisit.timeOfDay)!.label
          }
        />
        <ChipGroup
          options={startTimeOptions}
          selectedId={activeVisit.startMinutes === null ? null : String(activeVisit.startMinutes)}
          onSelect={(id) => updateVisit(activeVisit.id, { startMinutes: Number(id) })}
          columns={4}
          density="slot"
          accessibilityLabel="Start time"
          testID={`${testID}-start-time`}
        />
      </View>

      {isPrimary ? null : (
        <Button
          label={`Remove ${activeVisit.label}`}
          onPress={() => removeVisit(activeVisit.id)}
          variant="link"
          fullWidth={false}
          testID={`${testID}-remove-visit`}
        />
      )}
    </Screen>
  );
}

const HALF_GAP = lightTheme.space.sm / 2;

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  section: { gap: lightTheme.space.s6 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  addVisit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xxs,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s10,
    borderRadius: lightTheme.layout.optionRadius,
    backgroundColor: lightTheme.colors.surfaceTileIdle,
  },
  pressed: { opacity: 0.8 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -HALF_GAP,
    marginBottom: -lightTheme.space.sm,
  },
  durationCell: {
    width: '33.33%',
    paddingHorizontal: HALF_GAP,
    paddingBottom: lightTheme.space.sm,
  },
  footer: { gap: lightTheme.space.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  underline: { textDecorationLine: 'underline' },
});
