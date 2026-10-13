import { formatPaise } from '@core/format';
import { bookingStrikeOf } from '@features/booking';
import type { BookingDetailDto, RefundDto } from '@features/booking';
import { visitDemoModel } from '@features/recurringLive';
import type { VisitDetailsModel, VisitRefundData } from '@features/recurringLive';

import { clock, day, duration, paymentSheetFrom } from './model';

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
          amount: formatPaise(refundPaise ?? Math.max(0, paid - feePaise)),
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
      body: 'This visit was cancelled before payment, so nothing was charged.',
    },
    refund: refundData,
    paymentSheet: paymentSheetFrom(booking, cookName),
    modifySheet: null,
    paymentFailed: false,
  };
}
