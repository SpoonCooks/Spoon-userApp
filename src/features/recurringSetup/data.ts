import type {
  RecurringAutopayDetail,
  RecurringAutopayMethod,
  RecurringDateRow,
  RecurringDateVisitPlan,
  RecurringDurationOption,
  RecurringPickedDay,
  RecurringPlanDraft,
  RecurringPlanConfirmation,
  RecurringReviewDateRow,
  RecurringReviewSummary,
  RecurringTimeOfDay,
  RecurringVisitCharge,
  RecurringVisitChoice,
  RecurringVisitDraft,
  RecurringWindow,
  RecurringWindowDay,
  RecurringWindowRow,
} from './types';

/** Step 1's header row (`144:2414`), Monday first. The eighth column carries no heading. */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });

/**
 * The month column's labels. Figma (`144:2474`) writes September as "Sept"; every other month
 * takes its usual three letters.
 */
const MONTH_LABELS = [
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

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toId(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** A local calendar date as `yyyy-mm-dd` — not `toISOString`, which shifts IST midnight a day back. */
function toLocalId(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Recurring's window (DEC-084): it opens today + 3 and runs 21 days. */
export const RECURRING_WINDOW_OFFSET_DAYS = 3;
export const RECURRING_WINDOW_LENGTH_DAYS = 21;

/**
 * Step 1 ("Pick your days", `144:2404`): exactly the 21 bookable dates and nothing else.
 *
 * Per the frame's logic note, dates are NOT padded out to fill a week. Rows run Monday to Sunday,
 * and a row also breaks where the month changes, so each row's eighth column can name one month
 * ("Sept", "Oct"). Slots outside the window are `null` and draw nothing.
 */
export function buildRecurringWindow(today: Date): RecurringWindow {
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const windowStart = addDays(first, RECURRING_WINDOW_OFFSET_DAYS);

  const days: RecurringWindowDay[] = [];
  for (let offset = 0; offset < RECURRING_WINDOW_LENGTH_DAYS; offset += 1) {
    const date = addDays(windowStart, offset);
    days.push({
      id: toLocalId(date),
      dayOfMonth: date.getDate(),
      weekday: (date.getDay() + 6) % 7,
      month: date.getMonth(),
      label: `${WEEKDAY_FORMATTER.format(date)}, ${MONTH_DAY_FORMATTER.format(date)}`,
    });
  }

  const rows: RecurringWindowRow[] = [];
  let slots: (RecurringWindowDay | null)[] = [];
  let rowMonth = days[0]?.month ?? 0;
  const flush = () => {
    if (slots.some((slot) => slot !== null)) {
      rows.push({ monthLabel: MONTH_LABELS[rowMonth] ?? '', days: slots });
    }
    slots = [];
  };
  for (const day of days) {
    // A new Monday, or a new month mid-week, starts a new row.
    if (slots.length > 0 && (day.weekday === 0 || day.month !== rowMonth)) flush();
    if (slots.length === 0) {
      rowMonth = day.month;
      slots = Array.from({ length: 7 }, () => null);
    }
    slots[day.weekday] = day;
  }
  flush();

  return { rows, orderedIds: days.map((day) => day.id) };
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
 * The 11 days Step 1 would have handed over, had the steps been wired together (they are not —
 * see the file banners). Every later step's fixture is built on these same days: Step 2's "Some"
 * picker, Step 3's per-date rows and Step 4's day-by-day list.
 */
const PICKED_DATES: readonly Date[] = [
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

/** "Tue, Sep 29" — the date label Steps 3 and 4 use. */
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export function buildDemoPickedDays(): readonly RecurringPickedDay[] {
  const shortFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  return PICKED_DATES.map((date) => ({
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

/**
 * A visit added via "+ Add visit" — as `2e` draws the one just added: all days, afternoon,
 * 45 mins, and no time yet ("Pick time").
 */
export function buildNewVisit(id: string, label: string): RecurringVisitDraft {
  return {
    id,
    label,
    daysMode: 'all',
    selectedDayIds: [],
    timeOfDay: 'afternoon',
    durationId: 'd45',
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

/**
 * `2d`'s own default the first time a visit switches to "Some": every other day — Sep 29, Oct 1,
 * 6, 8, 13 and 15 — the same six Step 4's Visit 2 runs on.
 */
export function defaultSomeDayIds(allDayIds: readonly string[]): readonly string[] {
  return allDayIds.filter((_, index) => index % 2 === 0);
}

/** Each time-of-day's own start-time grid — afternoon is the wireframe's own noon–3:45 PM. */
export function buildStartMinutesFor(timeOfDay: RecurringTimeOfDay): readonly number[] {
  const RANGE: Record<RecurringTimeOfDay, { start: number; count: number }> = {
    morning: { start: 6 * 60, count: 20 }, // 6:00 – 10:45 AM
    afternoon: { start: 12 * 60, count: 16 }, // 12:00 – 3:45 PM
    evening: { start: 18 * 60 + 30, count: 8 }, // 6:30 – 8:15 PM, as `2d` draws it
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
export type SlotCoverage = 'all' | 'partial' | 'full';

/**
 * Per-slot coverage as the board draws it: `'all'`, `'full'`, or how many of the visit's days the
 * slot is NOT free on — so `2c`'s "9/11 days" is `2`, and `2d`'s "5/6 days" is `1`. Stored as
 * days-missing so the label stays right whatever day count the visit has.
 *
 * The board's placeholder data differs per state, so it's split by visit the same way: Visit 1's
 * afternoon is `2c`'s grid; an added visit's afternoon is `2e`'s, where every slot not taken by
 * another visit is free (2:45 PM included); evening is `2d`'s for both. Morning is never drawn,
 * so it reuses a repeating pattern.
 */
type CoverageEntry = 'all' | 'full' | number;

const PRIMARY_COVERAGE: Record<RecurringTimeOfDay, readonly CoverageEntry[]> = {
  morning: ['all', 'all', 2, 'all', 'all', 'full', 'all', 1],
  afternoon: ['all', 'all', 2, 'all', 'all', 'all', 'all', 4, 'full', 'all', 1, 'full'],
  evening: ['all', 'all', 'all', 1, 'all', 'full', 'all', 'all'],
};

const ADDED_COVERAGE: Record<RecurringTimeOfDay, readonly CoverageEntry[]> = {
  ...PRIMARY_COVERAGE,
  afternoon: [],
};

export function coverageFor(
  timeOfDay: RecurringTimeOfDay,
  slotIndex: number,
  dayCount: number,
  isPrimary: boolean,
): { kind: SlotCoverage; label: string } {
  const pattern = (isPrimary ? PRIMARY_COVERAGE : ADDED_COVERAGE)[timeOfDay];
  const entry = timeOfDay === 'morning' ? pattern[slotIndex % pattern.length] : pattern[slotIndex];
  if (entry === undefined || entry === 'all') return { kind: 'all', label: 'all days' };
  if (entry === 'full') return { kind: 'full', label: 'full' };
  return { kind: 'partial', label: `${Math.max(1, dayCount - entry)}/${dayCount} days` };
}

export function durationLabel(durationId: string | null): string {
  return DURATION_OPTIONS.find((option) => option.id === durationId)?.label ?? '';
}

/**
 * "1:15 PM", or "01:15 PM" with `padHour`. The wireframe pads the hour ONLY in Step 2's
 * start-time grid, where it keeps the four columns aligned; its tabs and Steps 3–4 don't.
 */
export function formatClock(minutes: number, padHour = false): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour24 + 11) % 12) + 1;
  const hour = padHour ? String(hour12).padStart(2, '0') : String(hour12);
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Step 3 ("Times by date") fixtures — `2f1` / `2f2` / `2f3` transcribed as drawn, one per visit
 * count, rather than slicing one list: each state has its own visits, its own booked-out dates and
 * (`2f2` only) two per-date overrides. Indexes are into `PICKED_DATES`. `count` exists only so the
 * dev preview can show all three; the real screen renders however many plans it's given.
 */
const TIMES_BY_DATE_STATES: Record<
  1 | 2 | 3,
  {
    readonly plans: readonly RecurringDateVisitPlan[];
    readonly unavailable: readonly { readonly day: number; readonly visit: number }[];
    readonly overrides: readonly {
      readonly day: number;
      readonly visit: number;
      readonly minutes: number;
    }[];
  }
> = {
  // `2f1` — one visit a day carries no number: "Visit", not "Visit 1".
  1: {
    plans: [
      {
        visitId: 'visit-1',
        visitLabel: 'Visit',
        durationLabel: '1.5 hr',
        defaultMinutes: 13 * 60 + 15,
      },
    ],
    unavailable: [
      { day: 2, visit: 0 }, // Thu Oct 1
      { day: 5, visit: 0 }, // Wed Oct 7
    ],
    overrides: [],
  },
  // `2f2`
  2: {
    plans: [
      {
        visitId: 'visit-1',
        visitLabel: 'Visit 1',
        durationLabel: '1.5 hr',
        defaultMinutes: 13 * 60 + 15,
      },
      { visitId: 'visit-2', visitLabel: 'Visit 2', durationLabel: '1 hr', defaultMinutes: 19 * 60 },
    ],
    unavailable: [
      { day: 2, visit: 0 }, // Thu Oct 1, 1:15 PM
      { day: 5, visit: 1 }, // Wed Oct 7, 7:00 PM
    ],
    overrides: [
      { day: 4, visit: 0, minutes: 12 * 60 + 45 }, // Tue Oct 6 → 12:45 PM
      { day: 9, visit: 1, minutes: 19 * 60 + 30 }, // Wed Oct 14 → 7:30 PM
    ],
  },
  // `2f3`
  3: {
    plans: [
      {
        visitId: 'visit-1',
        visitLabel: 'Visit 1',
        durationLabel: '45 min',
        defaultMinutes: 7 * 60 + 30,
      },
      {
        visitId: 'visit-2',
        visitLabel: 'Visit 2',
        durationLabel: '1.5 hr',
        defaultMinutes: 13 * 60 + 15,
      },
      { visitId: 'visit-3', visitLabel: 'Visit 3', durationLabel: '1 hr', defaultMinutes: 19 * 60 },
    ],
    unavailable: [
      { day: 2, visit: 1 }, // Thu Oct 1, 1:15 PM
      { day: 5, visit: 2 }, // Wed Oct 7, 7:00 PM
      { day: 8, visit: 0 }, // Tue Oct 13, 7:30 AM
    ],
    overrides: [],
  },
};

export function buildDemoTimesByDate(count: 1 | 2 | 3): {
  readonly plans: readonly RecurringDateVisitPlan[];
  readonly rows: readonly RecurringDateRow[];
} {
  const { plans, unavailable, overrides } = TIMES_BY_DATE_STATES[count];
  const rows = PICKED_DATES.map((date, day) => ({
    id: toId(date),
    label: DATE_LABEL_FORMATTER.format(date),
    visits: plans.map((plan, visit) => ({
      ...plan,
      overrideMinutes:
        overrides.find((entry) => entry.day === day && entry.visit === visit)?.minutes ?? null,
      unavailableAtDefault: unavailable.some((entry) => entry.day === day && entry.visit === visit),
    })),
  }));
  return { plans, rows };
}

/**
 * Step 4 ("Review plan") fixtures — `2g` as drawn: a two-visit plan where Visit 1 runs all 11 days
 * and Visit 2 runs 6 of them, so 17 visits. Every day is listed, each visit's time separately.
 */
export function buildDemoReviewPlan(): {
  readonly summary: RecurringReviewSummary;
  readonly dates: readonly RecurringReviewDateRow[];
} {
  const visit2Days = new Set([0, 2, 4, 6, 8, 10]); // Sep 29, Oct 1, 6, 8, 13, 15
  const dates = PICKED_DATES.map((date, day) => ({
    id: toId(date),
    label: DATE_LABEL_FORMATTER.format(date),
    times: visit2Days.has(day) ? ['1:15 PM', '7:00 PM'] : ['1:15 PM'],
  }));
  const visitsCount = dates.reduce((sum, row) => sum + row.times.length, 0);

  return {
    summary: {
      daysCount: dates.length,
      visitsCount,
      rangeLabel: 'Sep 29 – Oct 15',
      visits: [
        { label: 'Visit 1', detail: '1:15 PM · 1.5 hr · all 11 days', price: '₹189' },
        { label: 'Visit 2', detail: '7:00 PM · 1 hr · 6 days', price: '₹129' },
      ],
    },
    dates,
  };
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

/**
 * Schedule (`288:516`) — the three time-of-day bands, read off the start-time artwork's captions
 * (`586:3820`): "5 AM - 11:45 AM", "12 PM to 4:45 PM", "5 PM onwards". The evening band has no
 * stated end; it runs to 9:45 PM here, an assumption until availability says otherwise.
 */
export const TIME_OF_DAY_BANDS: readonly {
  readonly id: RecurringTimeOfDay;
  readonly label: string;
  readonly fromMinutes: number;
  readonly toMinutes: number;
}[] = [
  { id: 'morning', label: 'Morning', fromMinutes: 5 * 60, toMinutes: 11 * 60 + 45 },
  { id: 'afternoon', label: 'Afternoon', fromMinutes: 12 * 60, toMinutes: 16 * 60 + 45 },
  { id: 'evening', label: 'Evening', fromMinutes: 17 * 60, toMinutes: 21 * 60 + 45 },
];

/** Start times are offered every 30 minutes until availability is read from the backend. */
const START_STEP_MINUTES = 30;

/** The start times a band offers, earliest first. */
export function startTimesFor(timeOfDay: RecurringTimeOfDay): readonly number[] {
  const band = TIME_OF_DAY_BANDS.find((entry) => entry.id === timeOfDay);
  if (band === undefined) return [];
  const starts: number[] = [];
  for (let minutes = band.fromMinutes; minutes <= band.toMinutes; minutes += START_STEP_MINUTES) {
    starts.push(minutes);
  }
  return starts;
}

/** "9:00 AM" — the Slot chip's label (`288:585`). */
export function formatStartTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

/** "1st", "2nd", "3rd", "4th", "11th", "21st" … */
export function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

/** "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat", "Sun" — the Selected days labels (`340:7096`). */
const SELECTED_DAY_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'] as const;

/** A picked local date as the Selected days grid shows it. */
export function selectedDayLabel(id: string): { readonly weekday: string; readonly day: number } {
  const [year, month, day] = id.split('-').map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  return { weekday: SELECTED_DAY_WEEKDAYS[(date.getDay() + 6) % 7] ?? '', day };
}

/** The days a visit runs on: its own pick, or every plan day for a plan's 1st visit. */
export function visitDays(
  planDayIds: readonly string[],
  visit: Pick<RecurringVisitChoice, 'dayIds'>,
): readonly string[] {
  return visit.dayIds ?? planDayIds;
}

/** "1 hr · 9:00 AM" — a scheduled visit's tab caption (`408:1731`). */
export function visitCaption(visit: RecurringVisitChoice): string {
  return `${durationLabel(visit.durationId)} · ${formatStartTime(visit.startMinutes)}`;
}

/** A booked stretch of the day, in minutes after midnight: `[from, to)`. */
export interface RecurringBusyWindow {
  readonly fromMinutes: number;
  readonly toMinutes: number;
}

/**
 * When the plan's other visits already have the cook on any of `dayIds` (`332:5718`'s note: a
 * 1 hr 9 AM 1st visit greys the 2nd visit out from 9 to 10 AM).
 */
export function busyWindowsFor(
  planDayIds: readonly string[],
  visits: readonly RecurringVisitChoice[],
  dayIds: readonly string[],
): readonly RecurringBusyWindow[] {
  const wanted = new Set(dayIds);
  return visits
    .filter((visit) => visitDays(planDayIds, visit).some((id) => wanted.has(id)))
    .map((visit) => ({
      fromMinutes: visit.startMinutes,
      toMinutes: visit.startMinutes + durationMinutes(visit.durationId),
    }));
}

/** Whether a visit starting at `startMinutes` for `minutes` would overlap a busy window. */
export function clashes(
  startMinutes: number,
  minutes: number,
  busy: readonly RecurringBusyWindow[],
): boolean {
  const end = startMinutes + minutes;
  return busy.some((window) => startMinutes < window.toMinutes && end > window.fromMinutes);
}

/**
 * `444:10267` — "4 days · 1st Visit": the plan's days and the latest visit it already has. The
 * frames show "1st Visit" while the 2nd is being added.
 */
export function planSubtitle(dayCount: number, bookedCount: number): string {
  return `${dayCount} day${dayCount === 1 ? '' : 's'} · ${ordinal(Math.max(bookedCount, 1))} Visit`;
}

const SHORT_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** "Wed, 7 Oct" — the Edit date heading (`512:1233`). */
export function editDateLabel(id: string): string {
  const [year, month, day] = id.split('-').map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  const weekday = SHORT_WEEKDAYS[(date.getDay() + 6) % 7] ?? '';
  return `${weekday}, ${day} ${SHORT_MONTHS[month - 1] ?? ''}`;
}

/**
 * A plan with one date taken off one of its visits — what editing (`494:676`) or deleting
 * (`586:4315`) a date does to the plan it came from.
 *
 * The visit keeps its other days; a visit left with none is dropped. The date stays on the plan
 * while another visit still runs on it. Returns null when the plan has no visit left.
 */
export function withoutVisitDay(
  plan: RecurringPlanDraft,
  visitIndex: number,
  dayId: string,
): RecurringPlanDraft | null {
  const visits = plan.visits.flatMap((visit, index) => {
    if (index !== visitIndex) return [visit];
    const left = visitDays(plan.dayIds, visit).filter((id) => id !== dayId);
    return left.length === 0 ? [] : [{ ...visit, dayIds: left }];
  });
  if (visits.length === 0) return null;
  const stillBooked = visits.some((visit) => visitDays(plan.dayIds, visit).includes(dayId));
  return {
    ...plan,
    dayIds: stillBooked ? plan.dayIds : plan.dayIds.filter((id) => id !== dayId),
    visits,
  };
}

/** "Afternoon", "60 minutes", "9:00 AM" — a visit as the dialogs' tags list it (`586:4379`). */
export function visitTags(visit: RecurringVisitChoice): readonly string[] {
  const band = TIME_OF_DAY_BANDS.find((entry) => entry.id === visit.timeOfDay);
  return [
    band?.label ?? '',
    `${durationMinutes(visit.durationId)} minutes`,
    formatStartTime(visit.startMinutes),
  ];
}

/** "Afternoon · 60 minutes · 9:00 AM" — a visit as the Delete plan rows detail it (`542:1681`). */
export function visitDetail(visit: RecurringVisitChoice): string {
  return visitTags(visit).join(' · ');
}

/** "4 days · 2 visits" — a plan as the Start over rows detail it (`542:1757`). */
export function planDetail(plan: RecurringPlanDraft): string {
  const days = plan.dayIds.length;
  const visits = plan.visits.length;
  return `${days} day${days === 1 ? '' : 's'} · ${visits} visit${visits === 1 ? '' : 's'}`;
}

/**
 * A plan with one visit removed (`542:1534`). The plan keeps only the days a remaining visit
 * still runs on. Null when it was the plan's only visit — that is deleting the plan.
 */
export function withoutVisit(
  plan: RecurringPlanDraft,
  visitIndex: number,
): RecurringPlanDraft | null {
  const visits = plan.visits.filter((_, index) => index !== visitIndex);
  if (visits.length === 0) return null;
  const booked = new Set(visits.flatMap((visit) => visitDays(plan.dayIds, visit)));
  return { ...plan, dayIds: plan.dayIds.filter((id) => booked.has(id)), visits };
}
