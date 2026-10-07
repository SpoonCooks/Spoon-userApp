import type { RecurringBookingDto, VisitSummaryDto } from '@features/recurringSetup';

import type {
  CalendarDay,
  CalendarDayKind,
  CalendarWeek,
  DayVisit,
  DayVisits,
  LiveCalendarModel,
  UpNextFixture,
} from './data/calendar';

/**
 * The booking (`GET /v1/me/recurring-bookings/{id}`, DEC-086) → what the Live booking tab draws.
 * Pure, so every rule is testable without a network.
 *
 *   calendar      every month the booking's window and visit dates touch, one Mon → Sun row per
 *                 week, split at month ends as `1286:6575` draws it; a date is past / today /
 *                 upcoming by the backend's own `days[].group`, and unmarked without visits
 *   pop-up        that date's visits, in start order: "1st Visit · 7:00 PM · 1 hr" over
 *                 "Completed · Cook Sanchita", "Cancelled by you", or the cook — and, while no
 *                 cook is named yet, the "Cook confirmed by …" card (no faces: the backend names
 *                 nobody before the T−3h debit, so none are invented)
 *   Up next       the backend's `upNext`; absent when nothing is left to run. Its photo is the
 *                 assigned cook's own, and there is none while the cook is not yet named
 *   progress      "3 done · 1 cancelled · 3 to go", the thread filled by done of all visits
 *
 * `todayId` is the Asia/Kolkata date (`todayInKolkata`), only for the Up-next "TODAY" wording.
 */
export function liveCalendarFrom(booking: RecurringBookingDto, todayId: string): LiveCalendarModel {
  const groupByDate = new Map(booking.days.map((day) => [day.date, day.group]));
  const visitsByDate = new Map(booking.days.map((day) => [day.date, day.visits]));

  const dates = [booking.window.startDate, booking.window.endDate, ...groupByDate.keys()].sort();
  const first = dates[0] ?? todayId;
  const last = dates[dates.length - 1] ?? todayId;

  const { done, cancelled, toGo } = booking.counts;
  const total = done + cancelled + toGo;

  return {
    upNext: booking.upNext === null ? null : upNextOf(booking.upNext, todayId),
    progressLabel: `${done} done · ${cancelled} cancelled · ${toGo} to go`,
    progressFraction: total === 0 ? 0 : done / total,
    weekdays: WEEKDAYS,
    weeks: weeksBetween(first, last, (id) => {
      const group = groupByDate.get(id);
      return group === undefined || (visitsByDate.get(id)?.length ?? 0) === 0 ? 'none' : group;
    }),
    hint: 'Tap a date to check its details',
    visitsByDay: Object.fromEntries(
      booking.days
        .filter((day) => day.visits.length > 0)
        .map((day) => [day.date, dayVisitsOf(day.visits)]),
    ),
  };
}

/** Asia/Kolkata's calendar date now — a fixed UTC+5:30, no daylight saving. */
export function todayInKolkata(now: Date = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
/** The calendar's own month spelling (`1047:6213`): "Sept", not "Sep". */
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
] as const;

function parts(id: string): { year: number; month: number; day: number } {
  const [year, month, day] = id.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

function idOf(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 0 = Monday … 6 = Sunday, from the calendar date alone (no time zone involved). */
function weekdayIndex(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Whole months from `first`'s to `last`'s, one row per Mon → Sun week, a month's rows never
 * holding another month's dates (blank cells instead), as `1286:6575` draws Sept → Oct.
 */
function weeksBetween(
  first: string,
  last: string,
  kindOf: (id: string) => CalendarDayKind,
): CalendarWeek[] {
  const end = parts(last);
  let { year, month } = parts(first);
  const weeks: CalendarWeek[] = [];

  while (year < end.year || (year === end.year && month <= end.month)) {
    const label = MONTHS[month - 1] ?? '';
    let row: (CalendarDay | null)[] = Array.from(
      { length: weekdayIndex(year, month, 1) },
      () => null,
    );
    for (let day = 1; day <= daysInMonth(year, month); day += 1) {
      const index = weekdayIndex(year, month, day);
      const id = idOf(year, month, day);
      row.push({ id, day, month: label, weekday: WEEKDAYS[index] ?? '', kind: kindOf(id) });
      if (index === 6) {
        weeks.push({ id: `w-${id}`, monthLabel: label, days: row });
        row = [];
      }
    }
    if (row.length > 0) {
      const id = row.find((cell) => cell !== null)?.id ?? idOf(year, month, 1);
      weeks.push({
        id: `w-${id}`,
        monthLabel: label,
        days: [...row, ...Array.from({ length: 7 - row.length }, () => null)],
      });
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return weeks;
}

function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][value % 10] ?? 'th';
  return `${value}${value % 10 > 3 ? 'th' : suffix}`;
}

/** "30 mins", "1 hr", "1.5 hrs", "2 hrs" — the Live booking file's own wording. */
export function durationText(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${value} ${hours === 1 ? 'hr' : 'hrs'}`;
}

/** `"19:00"` → `"7:00 PM"`. */
export function clockText(hhmm: string): string {
  const [hours, minutes] = hhmm.split(':').map(Number) as [number, number];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** An instant as its Asia/Kolkata wall clock, `"5 PM"` on the hour, else `"5:30 PM"`. */
function kolkataClock(instant: string): string {
  const local = new Date(new Date(instant).getTime() + 330 * 60_000);
  const text = clockText(
    `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`,
  );
  return text.replace(':00 ', ' ');
}

function cookName(visit: VisitSummaryDto): string | null {
  return visit.cook?.displayName ?? null;
}

function dayVisitOf(visit: VisitSummaryDto): DayVisit {
  const title = `${ordinal(visit.visitNumber)} Visit · ${clockText(visit.startTime)} · ${durationText(visit.durationMinutes)}`;
  const cook = cookName(visit);

  if (visit.displayState === 'completed') {
    return {
      id: visit.visitId,
      status: 'completed',
      title,
      meta: cook === null ? 'Completed' : `Completed · ${cook}`,
    };
  }
  if (visit.displayState === 'cancelled') {
    return {
      id: visit.visitId,
      status: 'cancelled',
      title,
      meta:
        visit.cancelledBy === 'customer'
          ? 'Cancelled by you'
          : visit.cancelledBy === 'payment_failed'
            ? 'Cancelled · payment failed'
            : 'Cancelled by Spoon',
    };
  }
  if (cook !== null) {
    return { id: visit.visitId, status: 'unassigned', title, meta: cook };
  }
  return {
    id: visit.visitId,
    status: 'unassigned',
    title,
    meta: 'Cook pending',
    pool: {
      title: `Cook confirmed by ${kolkataClock(visit.cookConfirmBy)}`,
      subtitle: 'Familiar cooks from your Pool',
    },
  };
}

function dayVisitsOf(visits: readonly VisitSummaryDto[]): DayVisits {
  const ordered = [...visits].sort((a, b) => a.start.localeCompare(b.start));
  const plans = [...new Set(ordered.map((visit) => visit.planNumber))].sort((a, b) => a - b);
  const count = `${ordered.length} ${ordered.length === 1 ? 'visit' : 'visits'}`;
  const planLabel =
    plans.length === 1 ? `Plan ${plans[0]} · ${count}` : `Plans ${plans.join(' & ')} · ${count}`;
  return { planLabel, visits: ordered.map(dayVisitOf) };
}

function upNextOf(visit: VisitSummaryDto, todayId: string): UpNextFixture {
  const today = parts(todayId);
  const tomorrow = new Date(Date.UTC(today.year, today.month - 1, today.day + 1))
    .toISOString()
    .slice(0, 10);
  const { month, day, year } = parts(visit.date);
  const when =
    visit.date === todayId
      ? 'TODAY'
      : visit.date === tomorrow
        ? 'TOMORROW'
        : `${WEEKDAYS[weekdayIndex(year, month, day)]}, ${day} ${MONTHS[month - 1]}`.toUpperCase();
  const cook = cookName(visit);
  const photoUrl = visit.cook?.profileImageUrl ?? null;
  return {
    label: `UP NEXT · ${when}`,
    title: `${ordinal(visit.visitNumber)} Visit, ${clockText(visit.startTime)}`,
    meta: `${durationText(visit.durationMinutes)} • ${cook ?? 'Cook pending'}`,
    ...(photoUrl === null ? {} : { photo: { uri: photoUrl } }),
  };
}
