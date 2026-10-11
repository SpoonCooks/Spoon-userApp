import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  useBookingDetail,
  useBookingRefunds,
  useCancelBooking,
  useCancellationPreview,
  useRescheduleOptions,
  useTracking,
  bookingStrikeOf,
} from '@features/booking';
import type { BookingDetailDto, CancellationPreviewDto } from '@features/booking';
import { useCatalogue } from '@features/catalogue';
import type { Catalogue } from '@features/catalogue';

import { reasonsFrom } from '../adapters';

import { CancelVisitSheet } from './CancelVisitSheet';
import type { CancelStep } from './CancelVisitSheet';
import type { CancelQuote, CancelReason, CancelRefund, CancelVisit } from './model';

/**
 * The redesigned cancel flow for a ONE-TIME booking (`/booking/[id]`).
 *
 *  - `GET /v1/bookings/:id` -> the slot, the cook, `cook_en_route`, the price's GST split
 *  - `GET /v1/bookings/:id/cancellation-preview` -> the fee, refund and `cancellable` (C2, C4)
 *  - `GET /v1/bookings/:id/reschedule-options` -> whether reschedule is still offered
 *  - `GET /v1/catalogue` -> the reasons
 *  - `POST /v1/bookings/:id/cancel` -> sent once, under one idempotency scope per booking
 *  - `GET /v1/bookings/:id/refunds` -> C5's refund tracker
 *
 * Every read waits for the sheet to open, so a booking detail that never shows the sheet costs
 * nothing extra.
 */
export interface BookingCancelVisit {
  readonly open: (step?: CancelStep) => void;
  readonly sheet: ReactNode;
}

export function useBookingCancelVisit(
  bookingId: string | null,
  options: {
    readonly onReschedule: () => void;
    /** C5's Done / ✕: "→ Bookings". */
    readonly onDone: () => void;
    readonly onBookVisit: () => void;
  },
): BookingCancelVisit {
  const [step, setStep] = useState<CancelStep | null>(null);
  const live = step !== null ? bookingId : null;
  const detail = useBookingDetail(live);
  const preview = useCancellationPreview(step === 'done' ? null : live);
  const reschedule = useRescheduleOptions(live);
  const catalogue = useCatalogue({ enabled: live !== null });
  const tracking = useTracking(
    live !== null && detail.state.status === 'ready' && detail.state.data.status === 'cook_en_route'
      ? live
      : null,
  );
  const refunds = useBookingRefunds(step === 'done' ? live : null);
  const cancel = useCancelBooking();

  const booking = detail.state.status === 'ready' ? detail.state.data : null;
  const visit = useMemo(
    () =>
      booking === null
        ? null
        : visitFrom(
            booking,
            tracking.state.status === 'ready'
              ? minutesUntilIso(tracking.state.data.eta.estimatedArrivalAt)
              : null,
          ),
    [booking, tracking.state],
  );
  /** The quote the customer confirmed: C5 draws it once the preview is no longer asked for. */
  const [confirmedQuote, setConfirmedQuote] = useState<CancelQuote | null>(null);
  const quote =
    preview.state.status === 'ready' && booking !== null
      ? quoteFromPreview(preview.state.data, booking)
      : null;

  const refund: CancelRefund | null = useMemo(() => {
    if (refunds.state.status !== 'ready') return null;
    const first = refunds.state.data[0];
    if (first === undefined) return null;
    return {
      amountPaise: first.amountPaise,
      method: first.tracker?.method ?? null,
      refunded: first.state === 'succeeded' || first.tracker?.status === 'completed',
      initiatedAt: first.requestedAt,
      creditedAt: first.completedAt,
    };
  }, [refunds.state]);

  const onConfirm = useCallback(
    async (reasonCode: string, detailText: string) => {
      if (bookingId === null) return false;
      setConfirmedQuote(quote);
      try {
        await cancel.mutateAsync({
          bookingId,
          reasonCode,
          ...(detailText === '' ? {} : { reasonDetail: detailText }),
          scope: `booking.cancel:${bookingId}`,
        });
        return true;
      } catch {
        // A booking already cancelled is answered with the recorded decision (a success), which
        // is how "already cancelled jumps straight to C5" holds; anything else stays on C4.
        return false;
      }
    },
    [bookingId, cancel, quote],
  );

  const open = useCallback((first: CancelStep = 'modify') => setStep(first), []);
  const close = useCallback(() => setStep(null), []);

  const reasons = catalogue.state.status === 'ready' ? cancelReasonsFrom(catalogue.state.data) : [];

  return {
    open,
    sheet:
      step === null || visit === null ? null : (
        <CancelVisitSheet
          visible
          step={step}
          onStepChange={setStep}
          visit={visit}
          quote={step === 'done' ? (confirmedQuote ?? quote) : quote}
          reasons={reasons}
          canReschedule={reschedule.state.status === 'ready' && reschedule.state.data.reschedulable}
          onReschedule={() => {
            close();
            options.onReschedule();
          }}
          onClose={close}
          onConfirm={onConfirm}
          refund={refund}
          onBoundary={preview.refetch}
          onDone={() => {
            close();
            options.onDone();
          }}
          onBookVisit={() => {
            close();
            options.onBookVisit();
          }}
          testID="cancel-visit"
        />
      ),
  };
}

export function visitFrom(booking: BookingDetailDto, etaMinutes: number | null): CancelVisit {
  return {
    startsAt: booking.scheduledStart ?? new Date().toISOString(),
    durationMinutes: booking.durationMinutes,
    cookName: booking.cook?.name ?? null,
    cookOnTheWay: booking.status === 'cook_en_route',
    etaMinutes,
    wasRescheduled: (booking.rescheduleCount ?? 0) > 0,
    paidWith:
      booking.paymentMethod === null || booking.paymentMethod === undefined
        ? null
        : booking.paymentMethod.detail === null
          ? booking.paymentMethod.label
          : `${booking.paymentMethod.label} · ${booking.paymentMethod.detail}`,
  };
}

/**
 * The preview, as the sheets draw it. `feePercent` is the server's complement of its refund
 * percent; only when an older deployment omits it is it read off the server's own two amounts.
 */
export function quoteFromPreview(
  preview: CancellationPreviewDto,
  booking: BookingDetailDto,
): CancelQuote {
  const paid = preview.capturedAmountPaise;
  const feePercent =
    preview.refundPercent === null || preview.refundPercent === undefined
      ? paid === 0
        ? 0
        : Math.round((preview.chargeAmountPaise * 100) / paid)
      : 100 - preview.refundPercent;
  return {
    cancellable: preview.cancellable,
    feePercent,
    feePaise: preview.chargeAmountPaise,
    refundPaise: preview.refundAmountPaise,
    paidPaise: paid,
    servicePaise: booking.price.serviceAmountPaise,
    taxPaise: booking.price.taxAmountPaise,
    wasPaidPaise: bookingStrikeOf(booking.price)?.totalPaise ?? null,
  };
}

/** Whole minutes until a server instant, never negative; null when there is none. */
function minutesUntilIso(iso: string | null): number | null {
  if (iso === null) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.round((at - Date.now()) / 60_000));
}

/** The catalogue's customer reasons as the sheet takes them (the machine-only code left out). */
export function cancelReasonsFrom(catalogue: Catalogue): readonly CancelReason[] {
  return reasonsFrom(catalogue).map((reason) => ({
    code: reason.id,
    label: reason.label,
    requiresDetail: reason.requiresDetail === true,
  }));
}
