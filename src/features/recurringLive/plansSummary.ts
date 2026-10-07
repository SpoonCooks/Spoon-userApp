import { DURATION_PHOTOS, START_TIME_PHOTOS, TIME_OF_DAY_PHOTOS } from '@features/recurringSetup';
import type { RecurringBookingDto, VisitSummaryDto } from '@features/recurringSetup';

import { clockText, liveCalendarFrom } from './adapters';
import type {
  PlansSummaryModel,
  SummaryCalendar,
  SummaryDateMark,
  SummaryHistoryRow,
  SummaryVisit,
} from './data/summary';
import { dayLabel } from './visitDetails';

/**
 * The "Manage plans" tab on a real booking (`1017:433`): one tab per plan, the plan's dates on the
 * booking's calendar, and per visit its time of day, duration and start time over its past visits.
 *
 * Read-only: the backend can read a plan but not change one yet, so the screen draws no editing
 * controls for it (see `RecurringPlansScreen`).
 */
type Plan = RecurringBookingDto['plans'][number];
type PlanVisit = Plan['visits'][number];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BANDS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' } as const;

function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  return `${value}${['th', 'st', 'nd', 'rd'][value % 10] ?? 'th'}`;
}

/** `1067:2179` — the booking's weeks, the plan's first and last dates marked apart. */
function calendarOf(booking: RecurringBookingDto, plan: Plan, todayId: string): SummaryCalendar {
  const days = [...plan.days].sort();
  const first = days[0];
  const last = days[days.length - 1];
  const markOf = (id: string): SummaryDateMark | undefined => {
    if (!days.includes(id)) return undefined;
    if (id === first) return 'start';
    if (id === last) return 'end';
    return 'selected';
  };
  return {
    title: `Plan ${plan.planNumber} selected dates`,
    weekdays: WEEKDAYS,
    rows: liveCalendarFrom(booking, todayId).weeks.map((week) => ({
      id: week.id,
      month: week.monthLabel,
      cells: week.days.map((day) => {
        if (day === null) return null;
        const mark = markOf(day.id);
        return mark === undefined ? { day: day.day } : { day: day.day, mark };
      }),
    })),
  };
}

function historyRowOf(visit: VisitSummaryDto, todayId: string): SummaryHistoryRow | null {
  if (visit.status !== 'completed' && visit.status !== 'cancelled') return null;
  const day =
    visit.date === todayId ? `Today, ${dayLabel(visit.date).split(', ')[1]}` : dayLabel(visit.date);
  const title = `${day} · ${clockText(visit.startTime)}`;
  if (visit.status === 'completed') {
    return {
      id: visit.visitId,
      status: 'done',
      title,
      meta: visit.cook === null ? 'Completed' : `Completed · ${visit.cook.displayName}`,
    };
  }
  const by =
    visit.cancelledBy === 'customer'
      ? 'Cancelled by you'
      : visit.cancelledBy === 'payment_failed'
        ? 'Cancelled · payment didn’t go through'
        : 'Cancelled by Spoon';
  return { id: visit.visitId, status: 'cancelled', title, meta: by };
}

function visitOf(plan: Plan, visit: PlanVisit, todayId: string): SummaryVisit {
  const history = plan.history
    .filter((past) => past.visitNumber === visit.visitNumber)
    .sort((a, b) => b.start.localeCompare(a.start))
    .map((past) => historyRowOf(past, todayId))
    .filter((row): row is SummaryHistoryRow => row !== null);
  const duration = DURATION_PHOTOS[visit.durationMinutes];
  return {
    id: `visit-${visit.visitNumber}`,
    label: `${ordinal(visit.visitNumber)} Visit`,
    details: [
      {
        key: visit.timeOfDay,
        caption: BANDS[visit.timeOfDay],
        source: TIME_OF_DAY_PHOTOS[visit.timeOfDay],
      },
      {
        key: 'duration',
        caption: `${visit.durationMinutes} minutes`,
        ...(duration === undefined ? {} : { source: duration }),
      },
      {
        key: 'startTime',
        caption: clockText(visit.startTime),
        source: START_TIME_PHOTOS[visit.timeOfDay],
      },
    ],
    historyCount: `${history.length} past visit${history.length === 1 ? '' : 's'}`,
    history,
  };
}

export function plansSummaryFrom(booking: RecurringBookingDto, todayId: string): PlansSummaryModel {
  const plans = [...booking.plans]
    .sort((a, b) => a.planNumber - b.planNumber)
    .map((plan) => ({
      id: `plan-${plan.planNumber}`,
      label: `Plan ${plan.planNumber}`,
      calendar: calendarOf(booking, plan, todayId),
      visits: [...plan.visits]
        .sort((a, b) => a.visitNumber - b.visitNumber)
        .map((visit) => visitOf(plan, visit, todayId)),
    }));
  return { plans, activePlanId: plans[0]?.id ?? '' };
}
