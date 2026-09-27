import type {
  RecurringAutopayDetail,
  RecurringAutopayMethod,
  RecurringDateRow,
  RecurringDateVisitPlan,
  RecurringDayCell,
  RecurringDurationOption,
  RecurringPickedDay,
  RecurringPlanConfirmation,
  RecurringReviewDateRow,
  RecurringTimeOfDay,
  RecurringVisitCharge,
  RecurringVisitDraft,
} from './types';

/** `M T W T F S S` — the calendar header on Step 1. */
export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });

export interface RecurringCalendarDemo {
  readonly rangeLabel: string;
  readonly weeks: readonly (readonly RecurringDayCell[])[];
  /** A 3-day starting selection — the wireframe's own "under minimum" state (2a). */
  readonly preselectedIds: readonly string[];
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Monday of the week containing `date` — the grid's own week starts Monday, per the wireframe. */
function mondayOfWeek(date: Date): Date {
  const sinceMonday = (date.getDay() + 6) % 7;
  return addDays(date, -sinceMonday);
}

function sundayOfWeek(date: Date): Date {
  return addDays(mondayOfWeek(date), 6);
}

function toId(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function chunk<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

/**
 * Fixture for Step 1 ("Pick your days"), reproducing the wireframe's own worked example rather
 * than reading `today` — there is no availability endpoint yet for this to be a real read of, and
 * a fixture that quietly drifted with the clock would fall out of sync with the one-time-Schedule
 * carve-out and the "no cooks" day the design calls out by name.
 *
 * Global rules the wireframe states: recurring window opens today + 3 and runs 21 days; today and
 * the following 2 days belong to the existing one-time Schedule flow and never overlap with it.
 */
export function buildDemoCalendar(): RecurringCalendarDemo {
  const opened = new Date(2026, 8, 26); // Sat Sep 26 — "opened on" in the wireframe
  const windowStart = addDays(opened, 3); // Sep 29 — today + 3
  const windowEnd = addDays(windowStart, 20); // Oct 19 — a 21-day window
  const noCookId = toId(new Date(2026, 9, 10)); // Oct 10 — the wireframe's "day with no cooks"

  const gridStart = mondayOfWeek(opened);
  const gridEnd = sundayOfWeek(windowEnd);

  const days: RecurringDayCell[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    const id = toId(cursor);
    const inWindow = cursor >= windowStart && cursor <= windowEnd;
    days.push({
      id,
      dayOfMonth: cursor.getDate(),
      label: `${WEEKDAY_FORMATTER.format(cursor)}, ${MONTH_DAY_FORMATTER.format(cursor)}`,
      disabled: !inWindow,
      unavailable: id === noCookId,
    });
  }

  return {
    rangeLabel: `${MONTH_DAY_FORMATTER.format(windowStart)} – ${MONTH_DAY_FORMATTER.format(windowEnd)}`,
    weeks: chunk(days, 7),
    preselectedIds: [0, 1, 2].map((offset) => toId(addDays(windowStart, offset))),
  };
}

/**
 * Step 2 ("Time & duration") fixtures.
 *
 * The wireframe is really three states of one screen — `2c` (one visit, no Days control), `2d`
 * (two visits, the second scoped to "Some" of the picked days) and `2e` (three visits, all on
 * every day) — reached by tapping "+ Add visit" up to twice, not three fixed tabs. Prices are the
 * wireframe's own struck/discounted pairs; there is no pricing endpoint yet for these to be a
 * read of.
 */
export const DURATION_OPTIONS: readonly RecurringDurationOption[] = [
  { id: 'd30', label: '30 mins', minutes: 30, price: '₹69', strikePrice: '₹150' },
  { id: 'd45', label: '45 mins', minutes: 45, price: '₹99', strikePrice: '₹225' },
  { id: 'd60', label: '1 hr', minutes: 60, price: '₹129', strikePrice: '₹300' },
  { id: 'd90', label: '1.5 hr', minutes: 90, price: '₹189', strikePrice: '₹450' },
  { id: 'd120', label: '2 hr', minutes: 120, price: '₹259', strikePrice: '₹600' },
  { id: 'd150', label: '2.5 hr', minutes: 150, price: '₹319', strikePrice: '₹750' },
] as const;

export function durationMinutes(durationId: string | null): number {
  return DURATION_OPTIONS.find((option) => option.id === durationId)?.minutes ?? 0;
}

export const MAX_VISITS = 3;

/**
 * The 11 days Step 1 would have handed over, had the two screens been wired together (they are
 * not — see the file banners). This is what Step 2's "Some" day-subset picker offers, and what
 * every visit's own day-count is measured against.
 */
export function buildDemoPickedDays(): readonly RecurringPickedDay[] {
  const dates = [
    new Date(2026, 8, 29),
    new Date(2026, 8, 30),
    new Date(2026, 9, 1),
    new Date(2026, 9, 2),
    new Date(2026, 9, 6),
    new Date(2026, 9, 7),
    new Date(2026, 9, 8),
    new Date(2026, 9, 9),
    new Date(2026, 9, 13),
    new Date(2026, 9, 14),
    new Date(2026, 9, 15),
  ];
  const shortFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  return dates.map((date) => ({
    id: toId(date),
    shortLabel: shortFormatter.format(date),
    dayOfMonth: date.getDate(),
  }));
}

/** Step 2 opens on `2c` — a single, unremovable Visit 1, at the wireframe's own 1:15 PM / 1.5 hr. */
export function buildDemoVisits(): readonly RecurringVisitDraft[] {
  return [
    {
      id: 'visit-1',
      label: 'Visit 1',
      daysMode: 'all',
      selectedDayIds: [],
      timeOfDay: 'afternoon',
      durationId: 'd90',
      startMinutes: 13 * 60 + 15, // 1:15 PM
    },
  ];
}

/** A new visit added via "+ Add visit" — no time chosen yet, same shape `2c`'s note describes. */
export function buildNewVisit(id: string, label: string): RecurringVisitDraft {
  return {
    id,
    label,
    daysMode: 'all',
    selectedDayIds: [],
    timeOfDay: 'afternoon',
    durationId: 'd60',
    startMinutes: null,
  };
}

/** The days a visit actually runs on. Visit 1 (`isPrimary`) has no Days control — it's every day. */
export function visitDayIds(
  visit: RecurringVisitDraft,
  isPrimary: boolean,
  allDayIds: readonly string[],
): readonly string[] {
  if (isPrimary || visit.daysMode === 'all') return allDayIds;
  return visit.selectedDayIds;
}

/** `2d`'s own default the first time a visit switches to "Some" — the first 6 of the 11 days. */
export function defaultSomeDayIds(allDayIds: readonly string[]): readonly string[] {
  return allDayIds.slice(0, 6);
}

/** Each time-of-day's own start-time grid — afternoon is the wireframe's own noon–3:45 PM. */
export function buildStartMinutesFor(timeOfDay: RecurringTimeOfDay): readonly number[] {
  const RANGE: Record<RecurringTimeOfDay, { start: number; count: number }> = {
    morning: { start: 6 * 60, count: 20 }, // 6:00 – 10:45 AM
    afternoon: { start: 12 * 60, count: 16 }, // 12:00 – 3:45 PM
    evening: { start: 18 * 60, count: 16 }, // 6:00 – 9:45 PM
  };
  const { start, count } = RANGE[timeOfDay];
  return Array.from({ length: count }, (_, index) => start + index * 15);
}

/**
 * A start time with no cross-visit conflict still isn't a blank yes/no — the cook's own
 * availability varies by day. There is no such endpoint yet, so this is illustrative fixture
 * data standing in for one: a repeating pattern of "every day", a partial count against however
 * many days THIS visit runs on, and the occasional fully-booked slot, matching the shape (not the
 * exact numbers) of `2c` / `2d`'s own "9/11 days" / "5/6 days" / "full" captions.
 */
export function coverageFor(
  slotIndex: number,
  dayCount: number,
): { label: string; disabled: boolean } {
  const pattern = ['all', 'all', 'partial', 'all', 'all', 'full', 'all', 'partial'] as const;
  const kind = pattern[slotIndex % pattern.length];
  if (kind === 'all') return { label: 'All days', disabled: false };
  if (kind === 'full') return { label: 'Full', disabled: true };
  const span = Math.max(1, dayCount - 1);
  const covered = Math.max(1, dayCount - 1 - (slotIndex % span));
  return { label: `${covered}/${dayCount} days`, disabled: false };
}

export function formatClock(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Step 3 ("Times by date") fixtures.
 *
 * `buildDemoVisitPlans` reproduces the wireframe's own 3-visit example (45 min / 7:30 AM,
 * 1.5 hr / 1:15 PM, 1 hr / 7:00 PM) rather than reusing Step 2's fixture: the two screens aren't
 * wired together yet (see the file banners), and Step 2's own Visit 3 has no default time yet
 * ("Pick time"), which Step 3 has nothing sensible to show. `count` exists only so the dev preview
 * can show the wireframe's 1/2/3-visit variants; the real screen always renders however many
 * plans it's given.
 */
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export function buildDemoVisitPlans(count: 1 | 2 | 3 = 3): readonly RecurringDateVisitPlan[] {
  const all: readonly RecurringDateVisitPlan[] = [
    {
      visitId: 'visit-1',
      visitLabel: 'Visit 1',
      durationLabel: '45 mins',
      defaultMinutes: 7 * 60 + 30,
    },
    {
      visitId: 'visit-2',
      visitLabel: 'Visit 2',
      durationLabel: '1.5 hr',
      defaultMinutes: 13 * 60 + 15,
    },
    { visitId: 'visit-3', visitLabel: 'Visit 3', durationLabel: '1 hr', defaultMinutes: 19 * 60 },
  ];
  const plans = all.slice(0, count);
  // A single visit a day carries no number — "Visit", not "Visit 1".
  return count === 1 ? [{ ...plans[0]!, visitLabel: 'Visit' }] : plans;
}

/** The wireframe's own worked dates — a subset of Step 1's window, not all of it. */
function buildDemoDates(): readonly Date[] {
  return [
    new Date(2026, 8, 29),
    new Date(2026, 8, 30),
    new Date(2026, 9, 1),
    new Date(2026, 9, 2),
    new Date(2026, 9, 6),
    new Date(2026, 9, 7),
  ];
}

/**
 * Two dates come back from the server as "the default time is already booked out here" — the
 * wireframe's Thu Oct 1 and Wed Oct 7 rows. Which visit that hits rotates with how many exist so
 * every visit count still demonstrates the state.
 */
export function buildDemoDateRows(
  visitPlans: readonly RecurringDateVisitPlan[],
): readonly RecurringDateRow[] {
  const dates = buildDemoDates();
  const unavailable = new Map<number, number>([
    [2, Math.min(1, visitPlans.length - 1)], // Thu Oct 1
    [5, Math.min(2, visitPlans.length - 1)], // Wed Oct 7
  ]);

  return dates.map((date, dateIndex) => {
    const unavailableVisitIndex = unavailable.get(dateIndex);
    return {
      id: toId(date),
      label: DATE_LABEL_FORMATTER.format(date),
      visits: visitPlans.map((plan, visitIndex) => ({
        ...plan,
        overrideMinutes: null,
        unavailableAtDefault: visitIndex === unavailableVisitIndex,
      })),
    };
  });
}

/**
 * Step 4 ("Review plan") fixtures — the wireframe's own worked example: 8 dates, alternating a
 * single-visit day ("1:15 PM") with a two-visit day shown as a first-to-last span
 * ("1:15 PM – 7:00 PM"), plus the two per-visit charges its footer note states.
 */
export function buildDemoReviewDates(): readonly RecurringReviewDateRow[] {
  const dates: readonly { date: Date; twoVisits: boolean }[] = [
    { date: new Date(2026, 9, 2), twoVisits: false },
    { date: new Date(2026, 9, 6), twoVisits: true },
    { date: new Date(2026, 9, 7), twoVisits: false },
    { date: new Date(2026, 9, 8), twoVisits: true },
    { date: new Date(2026, 9, 9), twoVisits: false },
    { date: new Date(2026, 9, 13), twoVisits: true },
    { date: new Date(2026, 9, 14), twoVisits: false },
    { date: new Date(2026, 9, 15), twoVisits: true },
  ];

  return dates.map(({ date, twoVisits }) => ({
    id: toId(date),
    label: DATE_LABEL_FORMATTER.format(date),
    timeSummary: twoVisits ? '1:15 PM – 7:00 PM' : '1:15 PM',
  }));
}

export function buildDemoVisitCharges(): readonly RecurringVisitCharge[] {
  return [
    { visitLabel: 'Visit 1', amount: '₹198' },
    { visitLabel: 'Visit 2', amount: '₹135' },
  ];
}

/** Step 5 ("Autopay") fixtures — the wireframe's own two methods and mandate terms. */
export const AUTOPAY_METHODS: readonly RecurringAutopayMethod[] = [
  { id: 'upi', label: 'UPI Autopay', description: 'Approve in your UPI app', ctaLabel: 'UPI' },
  {
    id: 'card',
    label: 'Credit / debit card',
    description: 'Saved securely with Razorpay',
    ctaLabel: 'card',
  },
] as const;

export function buildDemoAutopayDetails(): readonly RecurringAutopayDetail[] {
  return [
    { label: 'Charge per visit', value: '₹135 – ₹198' },
    { label: 'When', value: '24 hrs before each visit' },
    { label: 'Reminder', value: 'SMS 24 hrs before the charge' },
    { label: 'Max per charge', value: '₹1,000' },
    { label: 'Skipped visits', value: 'Not charged' },
  ];
}

/** Step 6 ("Plan confirmed") fixture — the wireframe's own worked example. */
export function buildDemoPlanConfirmation(): RecurringPlanConfirmation {
  return {
    visitsCount: 17,
    daysCount: 11,
    rangeLabel: 'Sep 29 – Oct 15',
    autopayMethodLabel: 'UPI',
    firstVisitDateLabel: 'Tue, Sep 29',
    firstVisitTimeLabel: '1:15 PM',
  };
}
