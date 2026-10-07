import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RecurringTabsHeader } from '../components/RecurringTabsHeader';
import type { RecurringTab } from '../components/RecurringTabsHeader';
import { BookingDetails } from '../components/summary/BookingDetails';
import { PlanVisitBar } from '../components/summary/PlanVisitBar';
import { SummaryCalendar } from '../components/summary/SummaryCalendar';
import { VisitHistory } from '../components/summary/VisitHistory';
import {
  SUMMARY_ACTIVE_PLAN_ID,
  SUMMARY_CALENDAR,
  SUMMARY_EDITED_FIRST_VISIT,
  SUMMARY_PLANS,
  SUMMARY_VISITS,
} from '../data/summary';

/**
 * Recurring live booking — the "Manage plans" tab (Summary).
 *
 * Source: Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`, frames `1017:433` ("Summary / live ·
 * 1st Visit"), `1017:5997` ("· 2nd Visit") and `1017:6054` ("· edited, unsaved"). Top to bottom:
 * `Header / Recurring tabs` on Manage plans, the `Plan + visit bar` (`1017:436`) — both pinned —
 * then a scrolling white body (16 padding, 24 between blocks): the plan's selected dates, the
 * visit's booking details as captioned photo tiles, and its visit history. The edited frame adds
 * a white footer (px 16 / py 12) carrying a pill "Save changes" CTA.
 *
 * STATIC ONLY, per task: plan / visit switching is local UI state over fixture data
 * (`data/summary.ts`); every other control is a callback left to the caller. `edited` shows the
 * `1017:6054` state — the 1st Visit's start time moved to 10:00 AM with "Save changes" below.
 */
export interface RecurringPlansScreenProps {
  readonly onBack: () => void;
  readonly onTabChange?: (tab: RecurringTab) => void;
  readonly onDelete?: () => void;
  /** "Save changes" — only drawn while `edited`. */
  readonly onSave?: () => void;
  readonly onEditDates?: () => void;
  readonly onAddPlan?: () => void;
  readonly onAddVisit?: () => void;
  readonly onHistoryPress?: (visitId: string, rowId: string) => void;
  /** Which visit opens first: 1 → `1017:433`, 2 → `1017:5997`. */
  readonly initialVisit?: 1 | 2;
  /** `1017:6054` — the unsaved-edit state. */
  readonly edited?: boolean;
  readonly testID?: string;
}

export function RecurringPlansScreen({
  onBack,
  onTabChange,
  onDelete,
  onSave,
  onEditDates,
  onAddPlan,
  onAddVisit,
  onHistoryPress,
  initialVisit = 1,
  edited = false,
  testID = 'recurring-plans-screen',
}: RecurringPlansScreenProps) {
  const visits = edited
    ? SUMMARY_VISITS.map((visit) =>
        visit.id === SUMMARY_EDITED_FIRST_VISIT.id ? SUMMARY_EDITED_FIRST_VISIT : visit,
      )
    : SUMMARY_VISITS;
  const [planId, setPlanId] = useState(SUMMARY_ACTIVE_PLAN_ID);
  const [visitId, setVisitId] = useState(() => (visits[initialVisit - 1] ?? visits[0])?.id ?? '');
  const visit = visits.find((candidate) => candidate.id === visitId) ?? visits[0];

  return (
    <Screen
      scroll
      padded={false}
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <View>
          <RecurringTabsHeader
            tab="plans"
            onBack={onBack}
            onTabChange={(tab) => onTabChange?.(tab)}
            onDelete={() => onDelete?.()}
            testID={`${testID}-header`}
          />
          <PlanVisitBar
            plans={SUMMARY_PLANS}
            activePlanId={planId}
            visits={visits}
            activeVisitId={visitId}
            onPlanChange={setPlanId}
            onVisitChange={setVisitId}
            onAddPlan={() => onAddPlan?.()}
            onAddVisit={() => onAddVisit?.()}
            testID={`${testID}-bar`}
          />
        </View>
      }
      footer={
        edited ? (
          <Button
            label="Save changes"
            onPress={() => onSave?.()}
            flat
            labelVariant="spoonButton"
            style={styles.save}
            testID={`${testID}-save`}
          />
        ) : undefined
      }
    >
      <SummaryCalendar
        calendar={SUMMARY_CALENDAR}
        onEdit={() => onEditDates?.()}
        testID={`${testID}-calendar`}
      />
      {visit === undefined ? null : (
        <>
          <BookingDetails tiles={visit.details} testID={`${testID}-details`} />
          <VisitHistory
            countLabel={visit.historyCount}
            rows={visit.history}
            onRowPress={(rowId) => onHistoryPress?.(visit.id, rowId)}
            testID={`${testID}-history`}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** `1017:437` — 16 all round, 24 between the three blocks. */
  body: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
  /**
   * `1017:6227` — the footer is py 12 where `Screen`'s is pt 8, so the CTA drops 4. `43:81` is a
   * full pill, min 48 tall (py 12 / px 16) with Spoon/Button, and draws no lift. Its 12pt bottom
   * padding sits ABOVE the home-indicator strip, which `Screen`'s inset gutter already covers.
   */
  save: {
    marginTop: lightTheme.space.xs,
    marginBottom: lightTheme.space.md,
    minHeight: 48,
    paddingVertical: lightTheme.space.md,
    paddingHorizontal: lightTheme.space.lg,
    borderRadius: lightTheme.radius.pill,
  },
});
