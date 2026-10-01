import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Screen, ScreenHeader } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { PlanBanner } from '../components/PlanBanner';
import { PlanVisitsHeader } from '../components/PlanVisitsHeader';
import { RecurringFooter } from '../components/RecurringFooter';
import { SelectedDays } from '../components/SelectedDays';
import { VisitChoices } from '../components/VisitChoices';
import { busyWindowsFor, ordinal, planSubtitle, visitCaption } from '../data';
import type { RecurringVisitChoice } from '../types';

/**
 * Recurring setup — Schedule, one plan's visit at a time.
 *
 * Source: Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User): `229:1802` / `288:401` / `288:516` (Plan 1:
 * time, duration, start time) and `340:7110` / `340:7455` / `340:7539` (the last plan).
 *
 * The Plan banner names the plan and its visit, then the plan's days, then the three choices
 * (`VisitChoices`). The CTA unlocks once a start time is picked.
 *
 * CTA copy is the frames': "Save & Schedule Plan N+1" while plans remain, "Save & Continue" on the
 * last. (The note under `340:7539` words them "Move to Plan (i+1)" / "Continue"; the frames win.)
 *
 * Start times are every 30 minutes across the band and all available until availability is read.
 *
 * Adding a further visit to a plan (`addingVisit`) — `332:5681` / `332:5921` / `332:5718`: the
 * Plan card and its visits replace the banner, the first section is titled "Time", and anything
 * that would overlap the plan's other visits on these days is greyed out — a 1 hr 9 AM 1st visit
 * takes 9 to 10 AM away from the 2nd. A duration with no start time left in the band greys too.
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
  /** Set when this schedules a further visit on a plan. */
  readonly addingVisit?:
    | {
        readonly planDayIds: readonly string[];
        /** The visits numbered before this one — the header's greyed cards. */
        readonly visitsBefore: readonly RecurringVisitChoice[];
        /** Every other visit on the plan, whose times this one must not overlap. */
        readonly otherVisits: readonly RecurringVisitChoice[];
      }
    | undefined;
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
  addingVisit,
  testID = 'recurring-schedule-screen',
}: RecurringScheduleScreenProps) {
  const [choice, setChoice] = useState<RecurringVisitChoice | null>(initial ?? null);

  const busy = useMemo(
    () =>
      addingVisit === undefined
        ? []
        : busyWindowsFor(addingVisit.planDayIds, addingVisit.otherVisits, dayIds),
    [addingVisit, dayIds],
  );

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
          label={ctaLabel}
          disabled={choice === null}
          onPress={() => {
            if (choice !== null) onSave(choice);
          }}
          testID={`${testID}-save`}
        />
      }
    >
      {addingVisit === undefined ? (
        <PlanBanner
          planNumber={planNumber}
          subtitle={`${dayIds.length} day${dayIds.length === 1 ? '' : 's'} · ${ordinal(visitNumber)} Visit`}
          testID={`${testID}-banner`}
        />
      ) : (
        <PlanVisitsHeader
          planNumber={planNumber}
          subtitle={planSubtitle(addingVisit.planDayIds.length, addingVisit.visitsBefore.length)}
          bookedVisits={addingVisit.visitsBefore.map(visitCaption)}
          testID={`${testID}-plan`}
        />
      )}

      <SelectedDays dayIds={dayIds} testID={`${testID}-days`} />

      <VisitChoices
        initial={initial}
        busy={busy}
        timeLabel={addingVisit === undefined ? 'Time of the day' : 'Time'}
        onChange={setChoice}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** `288:519` — p 16, 24 between blocks. */
  content: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
});
