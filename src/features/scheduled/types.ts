import type { DurationHelpContent } from '@ui';

import type { DurationOptionViewModel } from '@features/booking';

/**
 * Scheduled / Reschedule view models.
 *
 * Confirmed C-1: ONE screen with progressive disclosure — Day → Time → Duration → Start time.
 * Confirmed C-2/C-3: reschedule is the same screen with `mode: 'reschedule'`, and it has NO
 * Duration section, so `durations` is simply absent in that mode.
 *
 * Boundary — everything selectable here is server data:
 *  - `days` is whatever the backend offers. **No booking horizon is encoded** (blocker B-8): if
 *    the server sends 3 days, 3 render; if it sends 30, 30 render.
 *  - `periods` and `slotsByPeriod` come from the server, including which slots are `disabled`.
 *    The client generates no times and evaluates no availability.
 *  - `primaryCtaLabel` arrives pre-formatted with any amount.
 */

export type ScheduleMode = 'book' | 'reschedule';

export interface ScheduleDayOption {
  readonly id: string;
  /** Weekday line above the date, e.g. "TODAY". */
  readonly caption: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SchedulePeriodOption {
  readonly id: string;
  readonly label: string;
  readonly icon: 'sunrise' | 'sun' | 'moon';
  readonly disabled?: boolean;
}

export interface ScheduleSlotOption {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface ScheduleSectionTitles {
  readonly day: string;
  readonly time: string;
  readonly duration: string;
  readonly startTime: string;
}

export interface ScheduleViewModel {
  readonly mode: ScheduleMode;
  readonly title: string;
  readonly sectionTitles: ScheduleSectionTitles;
  readonly days: readonly ScheduleDayOption[];
  readonly periods: readonly SchedulePeriodOption[];
  /** Absent in reschedule mode — rescheduling moves *when*, never *how long*. */
  readonly durations?: readonly DurationOptionViewModel[];
  /** Keyed by period id. */
  readonly slotsByPeriod: Readonly<Record<string, readonly ScheduleSlotOption[]>>;
  readonly primaryCtaLabel: string;
  /**
   * `275:4180` — the underlined line beneath the CTA ("Check payment details"), exactly as the
   * Instant sheet draws it. Book mode only; reschedule takes no payment so it supplies none.
   *
   * This replaced the superseded `37:3912` inset `Pay →` pill and the `#F1F5F9` "Share your
   * requests" bar, neither of which appears in the finalized "Scheduled flow" section
   * `267:3521`. See the audit for the Meal Brief entry-point consequence.
   */
  readonly paymentDetailsLabel?: string;
  /** Set when the server says this booking may no longer be rescheduled (ruling R-3). */
  readonly blockedMessage?: string;
  /**
   * `333:3624` / `333:3643` - the "Help me pick" link on the Duration label row and the sheet it
   * raises. Design CONTENT, not availability: it explains how to choose a duration, it does not
   * decide which durations exist. Absent in reschedule mode, which offers no duration at all.
   */
  readonly durationHelp?: ScheduleDurationHelp;
}

/** The shared `@ui` shape — Scheduled and Instant raise the same sheet. */
export type ScheduleDurationHelp = DurationHelpContent;

export interface ScheduleSelection {
  readonly dayId: string | null;
  readonly periodId: string | null;
  readonly durationId: string | null;
  readonly slotId: string | null;
}
