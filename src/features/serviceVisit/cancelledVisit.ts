import { formatPaise } from '@core/format';
import { bookingStrikeOf } from '@features/booking';
import type { BookingDetailDto, RefundDto } from '@features/booking';
import { visitDemoModel } from '@features/recurringLive';
import type {
  VisitDetailsModel,
  VisitRefundData,
  VisitRefundTracker,
} from '@features/recurringLive';
import { refundTrackerFrom } from '@features/refunds';
import type { RefundStatus } from '@features/refunds';

import { clock, day, dayMonthClock, duration, isoDay, paymentSheetFrom } from './model';

/*
 * ------------------------------------------------------------------ Cancelled by Spoon (one-time)
 *
 * Figma `2342:4195`, dev note `2342:4405`: ops or the system cancelled a ONE-TIME visit before the
 * cook marked arrived. The apology card replaces "Visit cancelled"; the refund is always 100%,
 * auto-initiated at cancel, so its tracker starts at Initiated.
 *
 * The reason line is read from the cancellation's `reasonCode` — never its free-text
 * `reasonDetail`, which is the operator's own words and may name the cook. The codes are V0's:
 * the system paths (`cancelForServiceFailure` callers) and the Admin/Ops cancel's
 * `adminReasonCodes`. Every line is about Spoon, never about a named cook.
 */
export const SPOON_CANCEL_REASONS: Readonly<Record<string, string>> = {
  // System — recovery after a cook dropped out found nobody (`fulfilment/resolution-service`).
  RECOVERY_NOT_POSSIBLE: 'None of our cooks could make it to your booked slot.',
  // System — paid, but no cook was ever assigned (`captured-without-assignment-recovery`).
  CAPTURED_WITHOUT_ASSIGNMENT: 'None of our cooks could make it to your booked slot.',
  // System — the slot passed with no cook at the door (`overdue-reconciliation-service`).
  SERVICE_WINDOW_ELAPSED_UNSERVED: 'We couldn’t get a cook to you within your booked slot.',
  // Ops (`adminReasonCodes`).
  COOK_UNAVAILABLE: 'None of our cooks could make it to your booked slot.',
  COOK_EMERGENCY:
    'Your cook had an emergency, and we couldn’t find another cook for your booked slot in time.',
  OPERATIONAL_RECOVERY: 'None of our cooks could make it to your booked slot.',
  CAPACITY_CONFLICT: 'We didn’t have a cook free for your booked slot.',
  SOCIETY_ACCESS_ISSUE: 'We couldn’t arrange entry to your society for this visit.',
  SERVICEABILITY_CHANGE: 'We’re no longer able to serve your address in this slot.',
  PAYMENT_RESOLUTION: 'We had to cancel this visit while we sort out an issue with its payment.',
  DUPLICATE_PAYMENT: 'This visit was booked twice, so we cancelled the extra one.',
  TECHNICAL_FAILURE: 'A technical problem on our side stopped this visit from going ahead.',
};

/** `OPS_CORRECTION`, `OTHER`, no code, or one this build does not know. */
export const SPOON_CANCEL_DEFAULT_REASON = 'We couldn’t keep your booked slot this time.';

/**
 * Cancelled by `operations` / `system`, yet not Spoon's doing — the apology would be untrue:
 * the customer's own abandoned or expired checkout (nothing was paid), and Ops cancelling at the
 * customer's request.
 */
const NOT_SPOONS_DOING: ReadonlySet<string> = new Set([
  'ABANDONED_CHECKOUT',
  'CHECKOUT_EXPIRED',
  'CUSTOMER_REQUEST',
]);

export function spoonCancelReason(reasonCode: string | null | undefined): string {
  if (reasonCode === null || reasonCode === undefined) return SPOON_CANCEL_DEFAULT_REASON;
  return SPOON_CANCEL_REASONS[reasonCode] ?? SPOON_CANCEL_DEFAULT_REASON;
}

/** The refund a cancellation owes, as the server states it. */
function refundPaiseOf(booking: BookingDetailDto, refund: RefundDto | null): number | null {
  return refund?.amountPaise ?? booking.cancellation?.refundAmountPaise ?? null;
}

/** A one-time, paid visit that ops or the system cancelled for a reason of Spoon's own. */
export function isSpoonCancellation(booking: BookingDetailDto, refund: RefundDto | null): boolean {
  const cancellation = booking.cancellation;
  if ((booking.recurring ?? null) !== null || cancellation === null) return false;
  const by = cancellation.cancelledBy ?? null;
  if (by === null || by === 'customer') return false;
  if (NOT_SPOONS_DOING.has(cancellation.reasonCode ?? '')) return false;
  const refundPaise = refundPaiseOf(booking, refund);
  return refund !== null || (refundPaise !== null && refundPaise > 0);
}

export interface SpoonCancelledData {
  /** "Thu, 1 Oct, 6:40 PM". */
  readonly when: string | null;
  readonly reason: string;
  /** "Full ₹299 refund started, no deductions". */
  readonly refundLine: string;
  /** What "Rebook a visit" prefills on `/scheduled`: the same day and length. */
  readonly rebook: { readonly date: string | null; readonly durationId: string };
}

export function spoonCancelledFrom(
  booking: BookingDetailDto,
  refund: RefundDto | null,
): SpoonCancelledData | null {
  if (!isSpoonCancellation(booking, refund)) return null;
  const at = booking.cancellation?.cancelledAt ?? null;
  const start = booking.scheduledStart ?? booking.timing.actualStart;
  const refundPaise = refundPaiseOf(booking, refund) ?? booking.price.totalAmountPaise;
  return {
    when: at === null ? null : `${day(at)}, ${clock(at)}`,
    reason: spoonCancelReason(booking.cancellation?.reasonCode),
    refundLine: `Full ${formatPaise(refundPaise)} refund started, no deductions`,
    rebook: {
      date: start === null ? null : isoDay(start),
      durationId: `dur-${String(booking.durationMinutes)}`,
    },
  };
}

/** "Talk to us" (`2342:4368`) — the Help chat opens on this booking: its id and its slot. */
export function spoonCancelHelpMessage(booking: BookingDetailDto): string {
  const start = booking.scheduledStart ?? booking.timing.actualStart;
  const visit = start === null ? 'my visit' : `my visit on ${day(start)}, ${clock(start)}`;
  return `Hi Spoon, ${visit} (booking ${booking.id}) was cancelled by Spoon. Can you help me?`;
}

const TRACKER_STATUS: Record<RefundStatus, string> = {
  in_progress: 'In progress',
  completed: 'Completed',
  failed: 'Failed',
};

/** `2342:4234` — the refund's three steps, from the server's tracker when it sends one. */
function spoonRefundTracker(
  booking: BookingDetailDto,
  refund: RefundDto | null,
  amount: string,
): VisitRefundTracker {
  const tracker = refund?.tracker ?? null;
  if (refund !== null && tracker !== null) {
    const view = refundTrackerFrom({ ...refund, tracker }, { timeZone: 'Asia/Kolkata' });
    return {
      title: `Booking refund ${amount}`,
      destination: `To: ${view.destination}`,
      status: TRACKER_STATUS[view.status],
      steps: view.steps.map((step) => ({ title: step.title, when: step.when, done: step.done })),
    };
  }
  const settled = refund?.state === 'succeeded';
  const initiatedAt = refund?.requestedAt ?? booking.cancellation?.cancelledAt ?? null;
  const completedAt = refund?.completedAt ?? null;
  return {
    title: `Booking refund ${amount}`,
    destination: 'To: Original source',
    status: settled
      ? TRACKER_STATUS.completed
      : refund?.state === 'failed_terminal'
        ? TRACKER_STATUS.failed
        : TRACKER_STATUS.in_progress,
    steps: [
      {
        title: 'Refund initiated',
        ...(initiatedAt === null ? {} : { when: dayMonthClock(initiatedAt) }),
        done: true,
      },
      { title: 'Refund processed', done: settled },
      {
        title: 'Refund completed',
        ...(settled && completedAt !== null ? { when: dayMonthClock(completedAt) } : {}),
        done: settled,
      },
    ],
  };
}

/**
 * Visit details / upcoming · Cancelled for a ONE-TIME booking — Figma `2165:11853`, dev note
 * `2226:4224`. Drawn by the recurring Visit details screen's cancelled variant, which is the same
 * frame; this maps a booking (and its refund, when there is one) onto it:
 *
 *   - "Visit cancelled · By you / By Spoon · <when>"; no "Your plan continues" (one-time).
 *   - Payment & refund itemises amount paid, GST and the cancellation fee; the refund is the
 *     server's figure. Pill: Refund initiated → Refunded.
 *   - Refund to: the masked original method; the refund ID is shown for copying.
 *   - Timeline: initiated date, then the 5–7 working day credit note.
 *   - The dock drops Modify booking.
 *
 * A booking cancelled before it was ever paid has nothing to refund: the charge card then says
 * nothing was charged.
 */
/** `2165:11890` — the one-time refund's last step; the Recurring summary no longer draws it. */
const REFUND_CREDIT_NOTE = 'It takes 5-7 working days for the amount to get credited to source';

export function cancelledVisitModelFrom(
  booking: BookingDetailDto,
  refund: RefundDto | null,
  cookName: string | null,
): VisitDetailsModel {
  const base = visitDemoModel('cancelled');
  const start = booking.scheduledStart ?? booking.timing.actualStart;
  const length = duration(booking.durationMinutes);
  const end =
    start === null
      ? null
      : new Date(Date.parse(start) + booking.durationMinutes * 60_000).toISOString();
  const cancellation = booking.cancellation;
  const by =
    cancellation?.cancelledBy === 'customer'
      ? 'By you'
      : cancellation === null
        ? 'Cancelled'
        : 'By Spoon';
  const at = cancellation?.cancelledAt ?? null;

  const paid = booking.price.totalAmountPaise;
  const feePaise = cancellation?.chargeAmountPaise ?? 0;
  const refundPaise = refund?.amountPaise ?? cancellation?.refundAmountPaise ?? null;
  const charged = refund !== null || (refundPaise !== null && refundPaise > 0) || feePaise > 0;
  const method = booking.paymentMethod ?? null;
  const was = bookingStrikeOf(booking.price)?.totalPaise ?? null;

  const spoon = isSpoonCancellation(booking, refund);
  const refundAmount = formatPaise(refundPaise ?? Math.max(0, paid - feePaise));
  const refundData: VisitRefundData | null = charged
    ? {
        title: 'Payment & refund',
        badge:
          refund?.state === 'succeeded'
            ? 'Refunded'
            : refund?.state === 'failed_terminal'
              ? 'Refund failed'
              : 'Refund initiated',
        lines: [
          {
            label: 'Amount paid',
            detail: `Cook visit ${length} ${formatPaise(booking.price.serviceAmountPaise)} + GST ${formatPaise(booking.price.taxAmountPaise)}`,
            ...(was === null ? {} : { was: formatPaise(was) }),
            amount: formatPaise(paid),
          },
          { label: 'GST', amount: formatPaise(booking.price.taxAmountPaise), minor: true },
          { label: 'Cancellation fee', amount: `– ${formatPaise(feePaise)}`, minor: true },
        ],
        total: {
          label: 'Refund amount',
          detail: feePaise === 0 ? 'Full refund, inclusive of taxes' : 'Inclusive of taxes',
          // `2165:11890` — a full refund strikes the same "was" price.
          ...(was === null || feePaise > 0 ? {} : { was: formatPaise(was) }),
          amount: refundAmount,
        },
        modeEyebrow: 'REFUND TO',
        ...(method === null
          ? {}
          : {
              mode: method.detail === null ? method.label : `${method.label} · ${method.detail}`,
            }),
        idEyebrow: 'REFUND ID',
        ...(refund === null ? {} : { refundId: refund.refundId }),
        steps: [
          {
            title: 'Refund initiated',
            ...(refund !== null
              ? { when: day(refund.requestedAt) }
              : at === null
                ? {}
                : { when: day(at) }),
          },
          ...(refund?.state === 'failed_terminal'
            ? []
            : [{ title: REFUND_CREDIT_NOTE, note: true }]),
        ],
      }
    : null;
  // `2342:4201` — cancelled by Spoon: "Refund started" on the Neutral badge, "Full refund, no
  // deductions", and the refund tracker in place of the mode and timeline.
  const shownRefund: VisitRefundData | null =
    refundData === null || !spoon
      ? refundData
      : {
          ...refundData,
          badge:
            refund?.state === 'succeeded'
              ? 'Refunded'
              : refund?.state === 'failed_terminal'
                ? 'Refund failed'
                : 'Refund started',
          badgeTone: refund?.state === 'succeeded' ? 'positive' : 'neutral',
          total: { ...refundData.total, detail: 'Full refund, no deductions' },
          tracker: spoonRefundTracker(booking, refund, refundAmount),
        };

  return {
    ...base,
    variant: 'cancelled',
    banner: {
      date: start === null ? length : day(start),
      slot: start === null || end === null ? length : `${clock(start)} – ${clock(end)} · ${length}`,
    },
    menu: [],
    cancelled: {
      ...base.cancelled,
      byline: at === null ? by : `${by} · ${day(at)}, ${clock(at)}`,
      nextVisit: null,
    },
    recipe: null,
    prep: null,
    prepChecked: [],
    charge: {
      ...base.charge,
      amount: formatPaise(0),
      title: 'Nothing charged',
      body: 'This visit was cancelled before payment — nothing was charged.',
    },
    refund: shownRefund,
    paymentSheet: paymentSheetFrom(booking, cookName),
    modifySheet: null,
    paymentFailed: false,
  };
}
