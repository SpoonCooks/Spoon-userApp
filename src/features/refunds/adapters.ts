import { formatPaise } from '@core/format';

import type { CustomerRefundDto, RefundTrackerDto } from './api';

/**
 * The refund tracker as the card draws it (DEC-090; handoff Part 1 A, copy in A4).
 *
 * Everything here is the server's `tracker` read into words; nothing is summed or derived from a
 * booking total. The three breakdown versions are the doc's (A2):
 *
 *   full      Amount paid, Refund amount.
 *   partial   Amount paid, Cancellation fee (25% or 50%), Refund amount.
 *   spoon     Amount paid, "Cancelled by Spoon · No fee", Refund amount.
 *
 * The bank reference is shown only once the refund is completed, labelled by what the bank
 * issued (RRN for UPI, ARN for a card, UTR for netbanking). A failed refund never shows why: the
 * reason is for Ops; the customer gets support.
 */

export type RefundStatus = RefundTrackerDto['status'];

export interface RefundBreakdownLine {
  readonly label: string;
  readonly amount: string;
  /** The fee line is subtracted. */
  readonly deducted?: boolean;
  /** A line with no amount ("Cancelled by Spoon · No fee"). */
  readonly note?: boolean;
}

export interface RefundStepView {
  readonly key: 'initiated' | 'processed' | 'completed';
  readonly title: string;
  /** "8 Oct, 11:00 AM" once the step has happened; undefined while it is still pending. */
  readonly when: string | undefined;
  readonly done: boolean;
}

export interface RefundTrackerView {
  readonly refundId: string;
  readonly bookingId: string | null;
  readonly title: string;
  /** The visit's date and time ("Sat, 10 Oct, 1:00 PM"), else when the refund was raised. */
  readonly date: string;
  /** "Recurring · Plan 1, visit 1 of 3" for a Recurring visit. */
  readonly recurringLine: string | undefined;
  /** "Cancelled by you" / "Cancelled by Spoon"; absent when the cause is neither. */
  readonly cancelledBy: string | undefined;
  readonly breakdownKind: 'spoon' | 'full' | 'partial';
  readonly breakdown: readonly RefundBreakdownLine[];
  readonly total: { readonly label: string; readonly amount: string };
  readonly status: RefundStatus;
  readonly statusLabel: string;
  readonly destination: string;
  readonly steps: readonly RefundStepView[];
  /** "RRN: 664320396937" — only for a completed refund with a number; drawn under step 3. */
  readonly reference: string | undefined;
  /** The WhatsApp message a failed refund's "Contact support" opens with. */
  readonly supportMessage: string;
}

const STEP_TITLES: Record<RefundStepView['key'], string> = {
  initiated: 'Refund initiated',
  processed: 'Refund processed',
  completed: 'Refund completed',
};

const STATUS_LABELS: Record<RefundStatus, string> = {
  in_progress: 'Refund in progress',
  completed: 'Refund completed',
  failed: 'Refund failed',
};

/**
 * A day on the service clock. Formatted here rather than through `@features/scheduled`, which
 * depends on booking — and booking's refund schema depends on this feature.
 */
function formatOn(
  timeZone: string | undefined,
  at: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const instant = new Date(at);
  if (timeZone !== undefined) {
    try {
      return new Intl.DateTimeFormat('en-IN', { ...options, timeZone }).format(instant);
    } catch {
      // Falls through to the device's own zone.
    }
  }
  return new Intl.DateTimeFormat('en-IN', options).format(instant);
}

/** "8 Oct, 11:00 AM" — a step's date and time (A2). */
function stepLabel(timeZone: string | undefined, at: string): string {
  return formatOn(timeZone, at, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function durationLabel(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function cancelledByLabel(cause: string): string | undefined {
  if (cause === 'customer_cancel') return 'Cancelled by you';
  if (cause === 'spoon_cancel') return 'Cancelled by Spoon';
  return undefined;
}

function breakdownOf(
  tracker: RefundTrackerDto,
): Pick<RefundTrackerView, 'breakdownKind' | 'breakdown' | 'total'> {
  const { paidPaise, feePercent, feePaise, refundPaise } = tracker.breakdown;
  const total = { label: 'Refund amount', amount: formatPaise(refundPaise) };
  if (tracker.cause === 'spoon_cancel' && feePaise === 0) {
    return {
      breakdownKind: 'spoon',
      breakdown: [
        { label: 'Amount paid', amount: formatPaise(paidPaise) },
        { label: 'Cancelled by Spoon · No fee', amount: '', note: true },
      ],
      total,
    };
  }
  if (feePaise === 0) {
    return {
      breakdownKind: 'full',
      breakdown: [{ label: 'Amount paid', amount: formatPaise(paidPaise) }],
      total,
    };
  }
  return {
    breakdownKind: 'partial',
    breakdown: [
      { label: 'Amount paid', amount: formatPaise(paidPaise) },
      {
        label: `Cancellation fee (${feePercent}%)`,
        amount: `– ${formatPaise(feePaise)}`,
        deducted: true,
      },
    ],
    total,
  };
}

/** A reference the bank issued, or nothing for a type this build does not know. */
function referenceLabel(reference: RefundTrackerDto['reference']): string | undefined {
  if (reference === null) return undefined;
  const type = ['RRN', 'ARN', 'UTR'].includes(reference.type) ? reference.type : 'Reference';
  return `${type}: ${reference.number}`;
}

export function refundTrackerFrom(
  refund: CustomerRefundDto,
  options: { readonly timeZone?: string | undefined } = {},
): RefundTrackerView {
  const { tracker } = refund;
  const { timeZone } = options;
  const recurring = tracker.recurring;

  // A2: the visit's title and date. The title names the visit by its length; the date carries the
  // start time. A refund with no service on record is dated by when it was raised.
  const title =
    refund.durationMinutes === null || refund.durationMinutes === undefined
      ? 'Cook visit'
      : `Cook visit · ${durationLabel(refund.durationMinutes)}`;
  const date =
    refund.serviceStart === null || refund.serviceStart === undefined
      ? `Refund raised ${stepLabel(timeZone, refund.requestedAt)}`
      : formatOn(timeZone, refund.serviceStart, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

  const steps = (['initiated', 'processed', 'completed'] as const).map((key) => {
    const at = tracker.steps.find((step) => step.key === key)?.at ?? null;
    return {
      key,
      title: STEP_TITLES[key],
      when: at === null ? undefined : stepLabel(timeZone, at),
      done: at !== null,
    };
  });

  const reference = tracker.status === 'completed' ? referenceLabel(tracker.reference) : undefined;
  const supportReference = [
    refund.bookingId === null ? undefined : `booking ${refund.bookingId}`,
    `refund ${refund.refundId}`,
  ]
    .filter((part) => part !== undefined)
    .join(', ');

  return {
    refundId: refund.refundId,
    bookingId: refund.bookingId,
    title,
    date,
    recurringLine:
      recurring === null
        ? undefined
        : `Recurring · Plan ${recurring.planNumber}, visit ${recurring.visitNumber} of ${recurring.planVisitCount}`,
    cancelledBy: cancelledByLabel(tracker.cause),
    ...breakdownOf(tracker),
    status: tracker.status,
    statusLabel: STATUS_LABELS[tracker.status],
    destination: 'Original source',
    steps,
    reference,
    supportMessage: `Hi Spoon, my refund didn't go through (${supportReference}). Please help.`,
  };
}
