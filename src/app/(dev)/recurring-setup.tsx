import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import {
  RecurringDaysScreen,
  RecurringInfoProvider,
  RecurringPlanFlow,
} from '@features/recurringSetup';
import type { RecurringPlanDraft, RecurringPlanFlowSeed } from '@features/recurringSetup';
import { RouteScaffold } from '@ui';

/**
 * Recurring setup — DEV PREVIEW, DEVELOPMENT ONLY. `spoon://recurring-setup` runs the whole flow;
 * `?step=` opens it on one screen, with plans already made where that screen needs them:
 *
 *   1               the day picker on its own
 *   add-plans       the day picker with two plans' days (`plan`: the one shown, default 1)
 *   schedule        Schedule for plan 1's visit, nothing chosen yet
 *   schedule-pn     Schedule for plan 2's visit, after plan 1 is scheduled
 *   summary         the Summary (`plan` and `visit`, 1-based: the tab and the visit shown)
 *   summary-edit    the Summary with its dates in edit mode (`494:1039`)
 *   summary-undo    the Summary just after a visit was deleted (`568:2909`)
 *   summary-sheet   the Summary with the bin's "Manage your plans" sheet open (`542:1442`)
 *   visit-days      pick the days a further visit runs on
 *   visit-schedule  Schedule for that further visit
 *   edit-date       Edit date for one date of plan 2's 1st visit
 *
 * The real routes (`(app)/recurring-setup/*.tsx`) sit behind `(app)/_layout.tsx`'s session guard
 * like every other authenticated screen, so they redirect to `/login` on a device with no
 * signed-in session — which this build has no way to establish without a live backend. This route
 * exists purely so the screens being built for this flow can be looked at on a device while that
 * is true, the same reason `showcase.tsx` and `menu.tsx` sit outside `(app)`.
 */
/** `144:2404` opens on Sep 28 = today + 3. */
const FIGMA_TODAY = new Date(2026, 8, 25);

/** Plan 1 on Sep 28, 30 and Oct 5; plan 2 on the four dates `1079:3207` draws. */
const PLAN_1_DAYS = ['2026-09-28', '2026-09-30', '2026-10-05'] as const;
const PLAN_2_DAYS = ['2026-10-02', '2026-10-07', '2026-10-17', '2026-10-18'] as const;

const UNSCHEDULED: readonly RecurringPlanDraft[] = [
  { id: 'plan-1', dayIds: PLAN_1_DAYS, visits: [] },
  { id: 'plan-2', dayIds: PLAN_2_DAYS, visits: [] },
];

const SCHEDULED: readonly RecurringPlanDraft[] = [
  {
    id: 'plan-1',
    dayIds: PLAN_1_DAYS,
    visits: [{ timeOfDay: 'morning', durationId: 'd90', startMinutes: 9 * 60 }],
  },
  {
    id: 'plan-2',
    dayIds: PLAN_2_DAYS,
    visits: [
      { timeOfDay: 'afternoon', durationId: 'd60', startMinutes: 9 * 60 },
      {
        timeOfDay: 'evening',
        durationId: 'd45',
        startMinutes: 18 * 60,
        dayIds: ['2026-10-07', '2026-10-17'],
      },
    ],
  },
];

function positive(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * The days `340:6550` / `334:6406` draw: plan 1 on Sep 28 and 29 and Oct 14 and 15 (the greyed
 * days when plan 2 is open), plan 2 on Oct 2, 7, 17 and 18.
 */
const FRAME_PLAN_1_DAYS = ['2026-09-28', '2026-09-29', '2026-10-14', '2026-10-15'] as const;
/** A run for the start / between / end highlights, and one more than the 14-day cap. */
const RUN_DAYS = ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-06'] as const;
const CAP_DAYS = [
  '2026-09-28',
  '2026-09-29',
  '2026-09-30',
  '2026-10-01',
  '2026-10-02',
  '2026-10-03',
  '2026-10-04',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08',
  '2026-10-09',
  '2026-10-10',
  '2026-10-11',
] as const;

function seedFor(step: string, plan: number, visit: number): RecurringPlanFlowSeed | undefined {
  const planIndex = Math.min(plan, SCHEDULED.length) - 1;
  switch (step) {
    // The day picker's own states, in the frames' data: Plan 1 alone with 4 days and the "+"
    // (`334:6406`), plan 2 open over plan 1's held days (`340:6550`), a drag's start / between / end
    // highlights, and the 14-day cap error.
    case 'days-p1':
      return {
        plans: [{ id: 'plan-1', dayIds: FRAME_PLAN_1_DAYS, visits: [] }],
        stage: { kind: 'days', activeId: 'plan-1' },
      };
    case 'days-p2':
      return {
        plans: [
          { id: 'plan-1', dayIds: FRAME_PLAN_1_DAYS, visits: [] },
          { id: 'plan-2', dayIds: PLAN_2_DAYS, visits: [] },
        ],
        stage: { kind: 'days', activeId: plan === 1 ? 'plan-1' : 'plan-2' },
      };
    case 'days-run':
      return {
        plans: [{ id: 'plan-1', dayIds: RUN_DAYS, visits: [] }],
        stage: { kind: 'days', activeId: 'plan-1' },
      };
    case 'days-cap':
      return {
        plans: [{ id: 'plan-1', dayIds: CAP_DAYS, visits: [] }],
        stage: { kind: 'days', activeId: 'plan-1', capError: true },
      };
    case 'add-plans':
      return {
        plans: UNSCHEDULED,
        stage: { kind: 'days', activeId: UNSCHEDULED[planIndex]?.id },
      };
    case 'schedule':
      return {
        plans: UNSCHEDULED,
        stage: { kind: 'schedule', planId: 'plan-1', visitIndex: 0, returnTo: 'sequence' },
      };
    case 'schedule-pn':
      return {
        plans: [{ ...SCHEDULED[0]! }, UNSCHEDULED[1]!],
        stage: { kind: 'schedule', planId: 'plan-2', visitIndex: 0, returnTo: 'sequence' },
      };
    case 'summary':
      return {
        plans: SCHEDULED,
        stage: {
          kind: 'summary',
          planIndex,
          visitIndex: Math.min(visit, SCHEDULED[planIndex]?.visits.length ?? 1) - 1,
        },
      };
    case 'summary-edit':
      return {
        plans: SCHEDULED,
        stage: { kind: 'summary', planIndex, visitIndex: 0, editing: true },
      };
    case 'summary-undo':
      // `568:2909` — plan 2's 2nd visit just deleted: its 1st visit alone, and the banner.
      return {
        plans: [SCHEDULED[0]!, { ...SCHEDULED[1]!, visits: [SCHEDULED[1]!.visits[0]!] }],
        stage: {
          kind: 'summary',
          planIndex: 1,
          visitIndex: 0,
          undoMessage: '2nd Visit deleted from Plan 2',
        },
      };
    case 'summary-sheet':
      // `542:1442` — the bin's "Manage your plans" sheet over plan 2's 1st visit.
      return {
        plans: SCHEDULED,
        stage: { kind: 'summary', planIndex: 1, visitIndex: 0, managing: 'sheet' },
      };
    case 'summary-delete-visit':
    case 'summary-delete-plan':
    case 'summary-start-over':
      // `542:1534` / `542:1611` / `542:1688` — the confirm dialogs the sheet's rows open.
      return {
        plans: SCHEDULED,
        stage: {
          kind: 'summary',
          planIndex: 1,
          visitIndex: 1,
          managing:
            step === 'summary-delete-visit'
              ? 'visit'
              : step === 'summary-delete-plan'
                ? 'plan'
                : 'startOver',
        },
      };
    case 'visit-days':
      return { plans: SCHEDULED, stage: { kind: 'visitDays', planId: 'plan-2', visitIndex: 1 } };
    case 'visit-schedule':
      return {
        plans: SCHEDULED,
        stage: {
          kind: 'schedule',
          planId: 'plan-2',
          visitIndex: 1,
          returnTo: 'summary',
          dayIds: ['2026-10-07', '2026-10-17'],
        },
      };
    // Schedule, Plan 1 / the last plan, with part of the visit already chosen: `-dur` has a time of
    // the day (`288:401` / `340:7455`: the Duration carousel opens above the pills), `-time` a time
    // and a duration (`288:516` / `340:7539`: the Start time grid opens), `-slot` all three (CTA
    // live). The step names are the section each state is drawn to show.
    // Plan 1 runs on the days `229:1802` draws (Mon 28 Sep – Thurs 2 Oct).
    case 'schedule-p1-dur':
    case 'schedule-p1-time':
    case 'schedule-p1-slot':
    case 'schedule-pn-dur':
    case 'schedule-pn-time':
    case 'schedule-pn-slot': {
      const last = step.startsWith('schedule-pn');
      const draft = step.endsWith('-dur')
        ? { timeOfDay: 'morning' as const }
        : step.endsWith('-time')
          ? { durationId: 'd60', timeOfDay: 'morning' as const }
          : { durationId: 'd60', timeOfDay: 'morning' as const, startMinutes: 9 * 60 };
      return {
        plans: [
          {
            id: 'plan-1',
            dayIds: ['2026-09-28', '2026-09-29', '2026-10-01', '2026-10-02'],
            visits: last ? [{ timeOfDay: 'morning', durationId: 'd60', startMinutes: 9 * 60 }] : [],
          },
          UNSCHEDULED[1]!,
        ],
        stage: {
          kind: 'schedule',
          planId: last ? 'plan-2' : 'plan-1',
          visitIndex: 0,
          returnTo: 'sequence',
          draft,
        },
      };
    }
    // Visit addition (`332:5869` days picked; `332:5921` / `332:5681` / `332:5718` the schedule):
    // Plan 1 on Fri 2, Wed 7, Sat 17 and Sun 18 Oct, its 1st visit 1 hr at 9:00 AM.
    case 'visit-days-none':
    case 'visit-days-picked':
    case 'visit-schedule-dur':
    case 'visit-schedule-time':
    case 'visit-schedule-slot': {
      const days = ['2026-10-02', '2026-10-07', '2026-10-17'];
      const draft = step.endsWith('-dur')
        ? { timeOfDay: 'morning' as const }
        : step.endsWith('-time')
          ? { durationId: 'd60', timeOfDay: 'morning' as const }
          : { durationId: 'd60', timeOfDay: 'morning' as const, startMinutes: 10 * 60 };
      return {
        plans: [
          {
            id: 'plan-1',
            dayIds: PLAN_2_DAYS,
            visits: [{ timeOfDay: 'morning', durationId: 'd60', startMinutes: 9 * 60 }],
          },
        ],
        stage:
          step === 'visit-days-none'
            ? { kind: 'visitDays', planId: 'plan-1', visitIndex: 1 }
            : step === 'visit-days-picked'
              ? { kind: 'visitDays', planId: 'plan-1', visitIndex: 1, dayIds: days }
              : {
                  kind: 'schedule',
                  planId: 'plan-1',
                  visitIndex: 1,
                  returnTo: 'summary',
                  dayIds: days,
                  draft,
                },
      };
    }
    // Edit date (`494:676`): Plan 1's Wed 7 Oct, Morning / 1 hr / 8:30 AM, on each of the
    // header's three editors, with a pick made (Save changes live), and the delete dialog
    // (`586:4315`, over plan 2's Fri 2 Oct: Afternoon / 60 minutes / 9:00 AM).
    case 'edit-date':
    case 'edit-date-duration':
    case 'edit-date-changed':
    case 'edit-date-time':
    case 'edit-date-start': {
      const editStage = {
        kind: 'editDate',
        planId: 'plan-1',
        visitIndex: 0,
        dayId: '2026-10-07',
      } as const;
      return {
        plans: [
          {
            id: 'plan-1',
            dayIds: ['2026-09-28', '2026-09-30', '2026-10-07'],
            visits: [{ timeOfDay: 'morning', durationId: 'd60', startMinutes: 8 * 60 + 30 }],
          },
        ],
        stage:
          step === 'edit-date-time'
            ? { ...editStage, field: 'timeOfDay' }
            : step === 'edit-date-start'
              ? { ...editStage, field: 'startTime' }
              : step === 'edit-date-changed'
                ? { ...editStage, draft: { durationId: 'd90' } }
                : editStage,
      };
    }
    case 'edit-date-delete':
      return {
        plans: SCHEDULED,
        stage: {
          kind: 'editDate',
          planId: 'plan-2',
          visitIndex: 0,
          dayId: '2026-10-02',
          confirmingDelete: true,
        },
      };
    default:
      return undefined;
  }
}

export default function RecurringSetupPreviewRoute() {
  const router = useRouter();
  const { step, plan, visit } = useLocalSearchParams<{
    step?: string;
    plan?: string;
    visit?: string;
  }>();
  const goBack = () => router.back();
  const openInfo = () => router.push('/recurring-landing');

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Recurring setup preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  if (step === '1') {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <RecurringInfoProvider onOpen={openInfo}>
          <RecurringDaysScreen onBack={goBack} today={FIGMA_TODAY} />
        </RecurringInfoProvider>
      </>
    );
  }

  // The redesigned flow end to end: days and plans → Schedule per plan → Summary. Pinned to the
  // date the Figma frames are drawn for (window Sep 28 – Oct 18), so it can be compared against
  // them side by side. The real route uses today. Swipe-back is off: a sweep across the calendar
  // from its Monday column would otherwise start the stack's back gesture.
  const seed =
    step === undefined ? undefined : seedFor(step, positive(plan, 1), positive(visit, 1));
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <RecurringPlanFlow
        key={`${step ?? 'flow'}-${plan ?? ''}-${visit ?? ''}`}
        onExit={goBack}
        onOpenInfo={openInfo}
        today={FIGMA_TODAY}
        {...(seed === undefined ? {} : { seed })}
      />
    </>
  );
}
