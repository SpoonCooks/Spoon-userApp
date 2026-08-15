import type { DetailRow, FeeScheduleRow } from '@ui';

/**
 * Cancellation view model — Figma `6:2` / `104:2260` / `104:2336` / `115:2703`.
 *
 * Every figure is server-provided and rendered. The fee schedule is CONTENT; the applicable fee,
 * the paid amount and the refund amount all arrive from the backend, and nothing is subtracted,
 * multiplied or tiered by the client.
 *
 * TODO(backend-contract): no cancellation endpoints, fee payload or reason-code encoding exist.
 * PRODUCT RULE (closes B-19): the design draws no free-text field, but the confirmed rule is that
 * choosing "Others" REVEALS a text input and Continue stays disabled until it has content. The
 * reason carrying that behaviour is flagged by `requiresDetail`, so the rule is data-driven rather
 * than a hardcoded match on the label "Others".
 */
export interface CancellationReasonOption {
  readonly id: string;
  readonly label: string;
  /** `Others` — selecting it reveals a required free-text field. */
  readonly requiresDetail?: boolean;
}

export interface CancellationNote {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

export interface CancellationViewModel {
  readonly title: string;
  readonly helpLabel: string;
  readonly feeColumns: readonly [string, string];
  /** Rendered as content rows — never evaluated to pick a tier. */
  readonly feeSchedule: readonly FeeScheduleRow[];
  readonly notes: readonly CancellationNote[];
  readonly reasonTitle: string;
  readonly reasons: readonly CancellationReasonOption[];
  /** Shown when the selected reason sets `requiresDetail`. */
  readonly reasonDetailPlaceholder: string;
  readonly continueLabel: string;
  readonly refundTitle: string;
  /** Original paid, processing fee and refund amount — all three from the server. */
  readonly refundRows: readonly DetailRow[];
  readonly refundMethodTitle: string;
  readonly refundMethodBody: string;
  readonly cancelCtaLabel: string;
  readonly confirmedTitle: string;
  readonly bookAgainTitle: string;
  readonly bookAgainYesLabel: string;
  readonly bookAgainNoLabel: string;
  readonly reschedulePromptTitle: string;
  readonly reschedulePromptBody: string;
  readonly rescheduleCtaLabel: string;
  /** Ruling R-3 — server-supplied; absent hides the reschedule block. */
  readonly rescheduleAllowed?: boolean;
}
