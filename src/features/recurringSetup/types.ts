/**
 * Feature: recurring setup — Spoon — User (`cCQlzTeiObQkpVBzwI8mZi`): pick days and plans, schedule
 * each plan's visits, then the Summary, where visits and plans are added, edited and deleted.
 *
 * No backend contract is wired yet (availability, pricing, plan endpoints), so the flow runs on
 * local state and the design's own prices.
 */

/** One bookable date on Step 1 ("Pick your days"). */
export interface RecurringWindowDay {
  /** Local calendar date (`yyyy-mm-dd`), stable enough to key a Set of selections. */
  readonly id: string;
  readonly dayOfMonth: number;
  /** 0 = Monday … 6 = Sunday: the column the date sits in. */
  readonly weekday: number;
  /** 0 = January … 11 = December. */
  readonly month: number;
  /** Screen-reader label, e.g. "Monday, September 28". */
  readonly label: string;
}

/** One calendar row: seven Monday-first slots (null outside the window) and its month label. */
export interface RecurringWindowRow {
  readonly monthLabel: string;
  readonly days: readonly (RecurringWindowDay | null)[];
}

/** The 21-day Recurring window, laid out for Step 1. */
export interface RecurringWindow {
  readonly rows: readonly RecurringWindowRow[];
  /** Every bookable date in order: the earliest picked is the start, the latest the end. */
  readonly orderedIds: readonly string[];
}

/** A duration choice on Schedule (`288:552`), with the minutes to schedule with. */
export interface RecurringDurationOption {
  readonly id: string;
  /** e.g. "1.5 hr" — a label, never a computed duration (matches `PriceTile`). */
  readonly label: string;
  readonly minutes: number;
  /** e.g. "₹189" — pre-formatted, as `PriceTile` requires. */
  readonly price: string;
  /** e.g. "₹450" — the struck original. */
  readonly strikePrice: string;
}

export type RecurringTimeOfDay = 'morning' | 'afternoon' | 'evening';

/** One visit's choices on the Schedule screen (Spoon — User `288:516`). */
export interface RecurringVisitChoice {
  readonly timeOfDay: RecurringTimeOfDay;
  /** A `DURATION_OPTIONS` id. */
  readonly durationId: string;
  /** Start, in minutes after midnight (Asia/Kolkata wall clock). */
  readonly startMinutes: number;
  /**
   * The plan days this visit runs on, earliest first. Absent on a plan's 1st visit, which always
   * runs on every plan day; a later visit (`332:6093`) picks a subset of them.
   */
  readonly dayIds?: readonly string[] | undefined;
}

/** A plan as the recurring flow carries it: its days and the visits booked on them. */
export interface RecurringPlanDraft {
  readonly id: string;
  /** Local dates, earliest first. */
  readonly dayIds: readonly string[];
  /** The 1st visit runs on every plan day; later ones on their own `dayIds`. */
  readonly visits: readonly RecurringVisitChoice[];
}
