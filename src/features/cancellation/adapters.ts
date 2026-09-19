import { CLIENT_ONLY_CANCELLATION_REASONS } from '@features/booking';
import type { CancellationPreviewDto, RescheduleOptionsDto } from '@features/booking';
import type { Catalogue } from '@features/catalogue';
import { formatPaise } from '@core/format';

import type { FeeScheduleRow } from '@ui';

import type { CancellationViewModel } from './types';

/**
 * Cancellation adapters.
 *
 * ## The client decides nothing here
 *
 * The fee schedule is the catalogue's published bands. The refund figures are the preview's
 * numbers. Whether cancelling is allowed is `cancellable`, and whether the reschedule prompt
 * appears is `reschedulable`. Not one of them is derived from a status, a timestamp or a
 * percentage multiplied by an amount.
 *
 * The one rule the CLIENT is allowed to apply is the trivial input validation §19 permits:
 * a reason flagged `requiresDetail` must have non-empty text before the CTA fires. Even that is
 * belt-and-braces — the backend refuses the same request.
 */

/** `104:2298` — one row of the published cancellation schedule. */
export function feeScheduleFrom(catalogue: Catalogue): readonly FeeScheduleRow[] {
  return catalogue.cancellation.bands.map((band) => {
    const { minMinutesToStart: min, maxMinutesToStart: max } = band;

    // A window description, written from the published boundaries rather than restated.
    const window =
      min !== undefined && max !== undefined
        ? `${min}–${max} mins before`
        : min !== undefined
          ? `More than ${min} mins before`
          : max !== undefined
            ? `Less than ${max} mins before`
            : 'Any time';

    return {
      label: window,
      value: `${band.refundPercent}% refund`,
      // `6:22` draws a full refund in the "free" green. Supplied from the published percentage,
      // not derived by matching on the words.
      ...(band.refundPercent === 100 ? { free: true } : {}),
    };
  });
}

/**
 * The reasons the customer may pick, and which of them demand a free-text detail.
 *
 * The published list is not all offerable. `ABANDONED_CHECKOUT` is a normal catalogue entry —
 * nothing on the wire marks it machine-only — but the app SENDS it programmatically when it
 * gives back a hold nobody paid for. Rendered verbatim it would sit in this sheet as a reason a
 * customer could choose for cancelling a real booking, which reads as nonsense and would record
 * a cancellation the server then attributes to the system.
 */
export function reasonsFrom(catalogue: Catalogue) {
  return catalogue.cancellation.reasons
    .filter((reason) => !CLIENT_ONLY_CANCELLATION_REASONS.includes(reason.code))
    .map((reason) => ({
      id: reason.code,
      label: reason.label,
      // DATA, not a match on the label "Others".
      ...(reason.requiresDetail ? { requiresDetail: true } : {}),
    }));
}

/**
 * Composes the cancellation screen.
 *
 * `base` supplies copy the backend does not serve — headings, the CTA labels, the refund-method
 * blurb and the book-again prompts. Everything numeric comes from `preview`, and the schedule and
 * reason list come from `catalogue`.
 */
export function cancellationFrom(input: {
  readonly base: CancellationViewModel;
  readonly catalogue: Catalogue | null;
  readonly preview: CancellationPreviewDto | null;
  readonly reschedule: RescheduleOptionsDto | null;
  readonly previewPending?: boolean;
}): CancellationViewModel {
  const { base, catalogue, preview, reschedule } = input;

  const refundRows =
    preview === null
      ? input.previewPending === true
        ? []
        : base.refundRows
      : [
          // `104:2353` — the frame's own wording, and the same three labels `base.refundRows`
          // carries. These drifted apart: with a preview in hand (which is every real booking)
          // the screen drew "Amount paid / Cancellation fee / Refund" instead, and the refund
          // line lost the `total` emphasis that gives it the rule above it and the darker
          // label. Only the FIGURES are the server's; the words are the design's, on both paths.
          { label: 'Original Amount Paid', value: formatPaise(preview.capturedAmountPaise) },
          {
            label: 'Cancellation Processing Fee',
            value: formatPaise(preview.chargeAmountPaise),
          },
          {
            label: 'Refund Amount',
            value: formatPaise(preview.refundAmountPaise),
            emphasis: 'total' as const,
          },
        ];

  return {
    ...base,
    ...(catalogue === null
      ? {}
      : { feeSchedule: feeScheduleFrom(catalogue), reasons: reasonsFrom(catalogue) }),
    refundRows,
    ...(input.previewPending === true ? { refundPending: true } : { refundPending: false }),
    // Ruling R-3: absent hides the block entirely. The server owns the count and the limit.
    ...(reschedule === null ? {} : { rescheduleAllowed: reschedule.reschedulable }),
  };
}

/**
 * The one piece of client-side validation §19 allows.
 *
 * It gates the CTA so a customer is told before the round trip, and it never REPLACES the
 * server's refusal — the backend rejects a missing required detail regardless.
 */
export function isReasonSubmittable(input: {
  readonly requiresDetail: boolean;
  readonly detail: string;
}): boolean {
  return !input.requiresDetail || input.detail.trim().length > 0;
}
