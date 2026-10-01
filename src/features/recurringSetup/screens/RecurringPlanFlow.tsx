import { useState } from 'react';

import type { RecurringPlanDraft, RecurringVisitChoice } from '../types';
import { RecurringDaysScreen } from './RecurringDaysScreen';
import type { RecurringPlanDays } from './RecurringDaysScreen';
import { RecurringScheduleScreen } from './RecurringScheduleScreen';
import { RecurringSummaryScreen } from './RecurringSummaryScreen';

/**
 * The redesigned recurring flow, end to end on device: pick days (and plans) → schedule each
 * plan's visit in turn → Summary. Spoon — User `340:6661` … `316:4728`.
 *
 * Local state only — nothing is sent anywhere. "Book Now" hands the plans to `onComplete`.
 *
 *  - Days → Schedule: every plan without a visit is scheduled in plan order ("P1 → P2 → … Pn").
 *  - Schedule → Summary once no plan is left unscheduled.
 *  - Summary "+" plan: back to the calendar with a blank plan added and active.
 *  - Summary "+" visit: Schedule for that plan's next visit, then back to the Summary.
 *  - Summary pencil: back to the calendar on that plan. Visits survive a change of days.
 *  - Summary bin: removes the visit shown, or the plan when it is the plan's only visit.
 */
export interface RecurringPlanFlowProps {
  readonly onExit: () => void;
  readonly onComplete?: (plans: readonly RecurringPlanDraft[]) => void;
  /** The day the window is counted from. Defaults to now; the dev preview pins Figma's date. */
  readonly today?: Date;
}

type Stage =
  | { readonly kind: 'days'; readonly activeId?: string | undefined }
  | {
      readonly kind: 'schedule';
      readonly planId: string;
      readonly visitIndex: number;
      /** `sequence` walks every unscheduled plan; `summary` returns straight to the Summary. */
      readonly returnTo: 'sequence' | 'summary';
    }
  | { readonly kind: 'summary'; readonly planIndex: number; readonly visitIndex: number };

function nextPlanId(plans: readonly RecurringPlanDraft[]): string {
  const taken = new Set(plans.map((plan) => plan.id));
  let serial = plans.length + 1;
  while (taken.has(`plan-${serial}`)) serial += 1;
  return `plan-${serial}`;
}

export function RecurringPlanFlow({ onExit, onComplete, today }: RecurringPlanFlowProps) {
  const [plans, setPlans] = useState<readonly RecurringPlanDraft[]>([]);
  const [stage, setStage] = useState<Stage>({ kind: 'days' });
  /** Remounts the calendar each time the flow returns to it, so it opens on the plans given. */
  const [daysVisit, setDaysVisit] = useState(0);

  const goToDays = (next: readonly RecurringPlanDraft[], activeId?: string) => {
    setPlans(next);
    setDaysVisit((count) => count + 1);
    setStage({ kind: 'days', activeId });
  };

  /** The first plan with no visit, scheduled next; otherwise the Summary on `focusIndex`. */
  const advance = (next: readonly RecurringPlanDraft[], focusIndex: number) => {
    const pending = next.find((plan) => plan.visits.length === 0);
    if (pending !== undefined) {
      setStage({ kind: 'schedule', planId: pending.id, visitIndex: 0, returnTo: 'sequence' });
      return;
    }
    setStage({
      kind: 'summary',
      planIndex: Math.min(Math.max(focusIndex, 0), next.length - 1),
      visitIndex: 0,
    });
  };

  if (stage.kind === 'days') {
    return (
      <RecurringDaysScreen
        key={`days-${daysVisit}`}
        onBack={plans.some((plan) => plan.visits.length > 0) ? () => advance(plans, 0) : onExit}
        {...(today === undefined ? {} : { today })}
        initialPlans={plans.map((plan) => ({ id: plan.id, dayIds: plan.dayIds }))}
        {...(stage.activeId === undefined ? {} : { initialActiveId: stage.activeId })}
        scheduledPlanIds={new Set(plans.filter((plan) => plan.visits.length > 0).map((p) => p.id))}
        onContinue={(picked: readonly RecurringPlanDays[]) => {
          // Keep each plan's visits by id; plans emptied of days are dropped.
          const next = picked.map((entry) => ({
            id: entry.id,
            dayIds: entry.dayIds,
            visits: plans.find((plan) => plan.id === entry.id)?.visits ?? [],
          }));
          setPlans(next);
          const focus = next.findIndex((plan) => plan.id === stage.activeId);
          advance(next, focus === -1 ? next.length - 1 : focus);
        }}
      />
    );
  }

  if (stage.kind === 'schedule') {
    const index = plans.findIndex((plan) => plan.id === stage.planId);
    const plan = plans[index];
    if (plan === undefined) return null;
    const laterPending = plans.findIndex(
      (entry, entryIndex) => entryIndex > index && entry.visits.length === 0,
    );
    const ctaLabel =
      stage.returnTo === 'sequence' && laterPending !== -1
        ? `Save & Schedule Plan ${laterPending + 1}`
        : 'Save & Continue';
    return (
      <RecurringScheduleScreen
        key={`${plan.id}-${stage.visitIndex}`}
        planNumber={index + 1}
        visitNumber={stage.visitIndex + 1}
        dayIds={plan.dayIds}
        initial={plan.visits[stage.visitIndex]}
        ctaLabel={ctaLabel}
        onBack={() =>
          stage.returnTo === 'summary'
            ? setStage({
                kind: 'summary',
                planIndex: index,
                visitIndex: Math.max(0, Math.min(stage.visitIndex, plan.visits.length - 1)),
              })
            : goToDays(plans, plan.id)
        }
        onSave={(choice: RecurringVisitChoice) => {
          const visits = [...plan.visits];
          visits[stage.visitIndex] = choice;
          const next = plans.map((entry) => (entry.id === plan.id ? { ...entry, visits } : entry));
          setPlans(next);
          if (stage.returnTo === 'summary') {
            setStage({ kind: 'summary', planIndex: index, visitIndex: stage.visitIndex });
          } else {
            advance(next, index);
          }
        }}
      />
    );
  }

  return (
    <RecurringSummaryScreen
      plans={plans}
      planIndex={stage.planIndex}
      visitIndex={stage.visitIndex}
      onSelect={(planIndex, visitIndex) => setStage({ kind: 'summary', planIndex, visitIndex })}
      onAddPlan={() => {
        const id = nextPlanId(plans);
        goToDays([...plans, { id, dayIds: [], visits: [] }], id);
      }}
      onAddVisit={(planIndex) => {
        const plan = plans[planIndex];
        if (plan === undefined) return;
        setStage({
          kind: 'schedule',
          planId: plan.id,
          visitIndex: plan.visits.length,
          returnTo: 'summary',
        });
      }}
      onEditDays={(planIndex) => goToDays(plans, plans[planIndex]?.id)}
      onDelete={(planIndex, visitIndex) => {
        const plan = plans[planIndex];
        if (plan === undefined) return;
        if (plan.visits.length > 1) {
          const visits = plan.visits.filter((_, index) => index !== visitIndex);
          setPlans(plans.map((entry) => (entry === plan ? { ...entry, visits } : entry)));
          setStage({ kind: 'summary', planIndex, visitIndex: Math.max(0, visitIndex - 1) });
          return;
        }
        const next = plans.filter((entry) => entry !== plan);
        if (next.length === 0) {
          goToDays([]);
          return;
        }
        setPlans(next);
        setStage({ kind: 'summary', planIndex: Math.max(0, planIndex - 1), visitIndex: 0 });
      }}
      onBook={() => onComplete?.(plans)}
      onBack={() => goToDays(plans, plans[stage.planIndex]?.id)}
    />
  );
}
