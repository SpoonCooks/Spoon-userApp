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

/**
 * A boundary in the words `6:22` uses: hours where the boundary is whole hours, minutes below.
 *
 * The published boundaries are minutes (180, 60). Printing them as minutes gave rows reading
 * "More than 180 mins before" against a design that says "More than 3 hrs to start time" — the
 * same rule, stated in a unit nobody cancelling a booking thinks in.
 */
function boundaryLabel(minutes: number): string {
  if (minutes % 60 !== 0) return `${minutes} mins`;
  const hours = minutes / 60;
  return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
}

/**
 * `104:2298` / `6:22` — one row of the published cancellation schedule.
 *
 * The column is headed "Fee as percentage", so each row states the FEE. This used to state the
 * refund instead — "75% refund" under a fee column — which inverted every number on the one
 * screen whose entire job is to tell a customer what cancelling costs.
 *
 * The fee is the band's published `chargePercent`, never `100 - refundPercent`: that complement
 * is only true under the captured-gross basis, and the service-base arithmetic leaves a
 * non-refundable tax residual that makes it wrong. A band that publishes no fee and refunds
 * everything is "Free"; one that publishes no fee and refunds less is shown as a refund, because
 * stating a fee the policy has not published would be inventing the number.
 */
export function feeScheduleFrom(catalogue: Catalogue): readonly FeeScheduleRow[] {
  return catalogue.cancellation.bands.map((band) => {
    const { minMinutesToStart: min, maxMinutesToStart: max } = band;

    // A window description, written from the published boundaries rather than restated.
    const window =
      min !== undefined && max !== undefined
        ? `Between ${boundaryLabel(max)} to ${boundaryLabel(min)} to start time`
        : min !== undefined
          ? `More than ${boundaryLabel(min)} to start time`
          : max !== undefined
            ? `Within ${boundaryLabel(max)} to start time`
            : 'Any time';

    // `6:22` draws a full refund in the "free" green. Supplied from the published percentage,
    // not derived by matching on the words.
    if (band.refundPercent === 100) {
      return { label: window, value: 'Free', free: true };
    }

    return {
      label: window,
      value:
        band.chargePercent === undefined
          ? `${band.refundPercent}% refund`
          : `${band.chargePercent}%`,
    };
  });
}

/** The reasons the customer may pick, and which of them demand a free-text detail. */
export function reasonsFrom(catalogue: Catalogue) {
  return catalogue.cancellation.reasons.map((reason) => ({
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
          { label: 'Amount paid', value: formatPaise(preview.capturedAmountPaise) },
          { label: 'Cancellation fee', value: formatPaise(preview.chargeAmountPaise) },
          { label: 'Refund', value: formatPaise(preview.refundAmountPaise) },
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
