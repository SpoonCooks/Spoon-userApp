/**
 * Feature: recurring setup.
 *
 * Design source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`,
 * section "v2 · Turn 2 · Recurring setup rules" — a wireframe, not a pixel-accurate mock. See
 * docs/CLAUDE_DESIGN_RECURRING_SETUP.md for the full capture and open questions.
 *
 * No backend contract exists yet for this feature (no availability, pricing or plan endpoints),
 * so every screen here renders from local fixture data until one does.
 */

/** One cell in the Step 1 "Pick your days" calendar. */
export interface RecurringDayCell {
  /** ISO calendar date (`yyyy-mm-dd`), stable enough to key a Set of selections. */
  readonly id: string;
  readonly dayOfMonth: number;
  /** Screen-reader label, e.g. "Tuesday, September 29". */
  readonly label: string;
  /** Outside the bookable window (past, one-time-Schedule-owned, or beyond the 21-day horizon). */
  readonly disabled: boolean;
  /** Inside the window but with no cook coverage — greyed out and non-selectable. */
  readonly unavailable: boolean;
}

/** A duration choice on Step 2 — mirrors `PriceTile`'s own fields plus the minutes to schedule with. */
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
export type RecurringDaysMode = 'all' | 'some';

/** One of the days picked on Step 1, as Step 2's "Some days" picker shows it. */
export interface RecurringPickedDay {
  readonly id: string;
  /** e.g. "Tue". */
  readonly shortLabel: string;
  readonly dayOfMonth: number;
}

/**
 * One of up to 3 per-day visits on Step 2 — its own days/time-of-day/duration/start-time.
 *
 * `daysMode` / `selectedDayIds` are meaningless for the FIRST visit: it has no Days control at
 * all and implicitly runs on every day Step 1 picked (`2c`'s own rule). They exist so a second or
 * third visit can be scoped to a subset — `selectedDayIds` is kept even while `daysMode` is
 * `'all'`, so flipping back to `'some'` restores the last pick instead of clearing it.
 */
export interface RecurringVisitDraft {
  readonly id: string;
  /** "Visit 1" / "Visit 2" / "Visit 3" — the tab caption, and re-numbered on add/remove. */
  readonly label: string;
  readonly daysMode: RecurringDaysMode;
  readonly selectedDayIds: readonly string[];
  readonly timeOfDay: RecurringTimeOfDay;
  readonly durationId: string | null;
  /** Minutes since midnight, or `null` for "Pick time" — never chosen yet. */
  readonly startMinutes: number | null;
}

/** A plan-level visit as Step 3 sees it — the default time Step 2 settled on for every day. */
export interface RecurringDateVisitPlan {
  readonly visitId: string;
  /** "Visit" when there's only one a day, otherwise "Visit 1" / "Visit 2" / "Visit 3". */
  readonly visitLabel: string;
  readonly durationLabel: string;
  readonly defaultMinutes: number;
}

/** One visit's time on one specific date — the default, or a per-date override. */
export interface RecurringDateVisitTime extends RecurringDateVisitPlan {
  readonly overrideMinutes: number | null;
  /** The default time is booked out on this date — a pick is required, not just offered. */
  readonly unavailableAtDefault: boolean;
}

/** One row of Step 3 "Times by date" — a date and each visit's time on it. */
export interface RecurringDateRow {
  readonly id: string;
  /** e.g. "Tue, Sep 29". */
  readonly label: string;
  readonly visits: readonly RecurringDateVisitTime[];
}

/** One row of Step 4's "Day by day" list — a date and each visit's time on it. */
export interface RecurringReviewDateRow {
  readonly id: string;
  /** e.g. "Fri, Oct 2". */
  readonly label: string;
  /** One entry per visit that day, e.g. ["1:15 PM", "7:00 PM"] — separate times, not a span. */
  readonly times: readonly string[];
}

/** The top of Step 4 — plan totals, then one summary line per visit. */
export interface RecurringReviewSummary {
  readonly daysCount: number;
  readonly visitsCount: number;
  /** e.g. "Sep 29 – Oct 15". */
  readonly rangeLabel: string;
  /** e.g. { label: "Visit 1 · 1:15 PM · 1.5 hr · all 11 days", price: "₹189" } — excl. tax. */
  readonly visits: readonly { readonly label: string; readonly price: string }[];
}

/** One visit's per-charge line in Step 4's footer note — server-priced, pre-formatted. */
export interface RecurringVisitCharge {
  readonly visitLabel: string;
  /** e.g. "₹198" — incl. tax, unlike Step 2's duration prices. */
  readonly amount: string;
}

/** A payment method offered on Step 5 "Autopay". */
export interface RecurringAutopayMethod {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** e.g. "UPI" — the short form the CTA reads ("Approve with UPI"), never the full `label`. */
  readonly ctaLabel: string;
}

/** One label/value line in Step 5's mandate-terms table. */
export interface RecurringAutopayDetail {
  readonly label: string;
  readonly value: string;
}

/** Step 6 "Plan confirmed" — the settled plan, summarised. */
export interface RecurringPlanConfirmation {
  readonly visitsCount: number;
  readonly daysCount: number;
  /** e.g. "Sep 29 – Oct 15". */
  readonly rangeLabel: string;
  /** e.g. "UPI" — the short form Step 5's CTA also used. */
  readonly autopayMethodLabel: string;
  /** e.g. "Tue, Sep 29". */
  readonly firstVisitDateLabel: string;
  /** e.g. "1:15 PM". */
  readonly firstVisitTimeLabel: string;
}
