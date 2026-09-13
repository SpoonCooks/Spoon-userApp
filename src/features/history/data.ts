import { useMemo, useState } from 'react';

import {
  isFinishedBooking,
  useActiveBookings,
  useBookingHistory,
  useRefunds,
} from '@features/booking';
import type { BookingSummaryDto } from '@features/booking';
import { useCatalogue } from '@features/catalogue';
import { ready } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { currentSkewMs, slotHasEnded } from '@core/time';

import { formatPaise } from '@core/format';
import { formatServiceDate, serviceDateIn } from '@features/scheduled';
import type { StatusTone } from '@ui';

import { bookingListFrom, cookFieldsFrom, headlineFor } from './adapters';
import {
  DEMO_BOOKING_HISTORY,
  DEMO_REFUND_HISTORY,
  DEMO_UPCOMING_BOOKINGS,
} from '@/demo/fixtures/screens';
import type { BookingListViewModel } from './types';

/**
 * My bookings — Upcoming tab. `GET /v1/me/bookings/active`, the SAME read Home's carousel uses,
 * shared via `useActiveBookings`.
 *
 * ## Why this filters, when it used to take the endpoint's set verbatim
 *
 * The endpoint keeps a finished booking for a server-side backstop counted from `actual_end`,
 * measured in days. That is right for the endpoint — it also has to keep completed-but-unrated
 * work reachable — but this tab is called UPCOMING, and a booking whose slot has already passed
 * is not. Observed on staging: two Sep 11 bookings were still sitting under Upcoming on Sep 12.
 *
 * So a row is dropped here only when BOTH are true: the server says the booking is over
 * (`isFinishedBooking` — `completed` or `cancelled`, never a live status), and the slot it was
 * booked for has elapsed. A service that started late or ran long is still live, so it stays put
 * however old its booked window looks.
 *
 * Nothing disappears. The Past tab reads `GET /v1/me/bookings`, which carries these rows already
 * — the two tabs have always overlapped for exactly this set, deliberately, so what changes here
 * is only where they stop being shown twice.
 */
export function isStillUpcoming(booking: BookingSummaryDto, now: Date): boolean {
  if (!isFinishedBooking(booking.status)) return true;
  return !slotHasEnded(booking.scheduledStart, booking.durationMinutes, now);
}

export function useUpcomingBookingsData(): ScreenQuery<BookingListViewModel> {
  const active = useActiveBookings();
  const catalogue = useCatalogue();
  const timeZone =
    catalogue.state.status === 'ready' ? catalogue.state.data.operatingWindow.timeZone : undefined;

  /*
   * The clock is read ONCE, when the screen opens, rather than on a ticking one.
   *
   * This is a list the customer pushes, reads and leaves, so the boundary it needs is "as of when
   * I opened this" — a row that crosses its end time while being looked at moves on the next
   * visit, which is a limit worth having in exchange for a screen that does not re-render every
   * second. Home keeps the ticking clock, because Home has live countdowns to draw.
   *
   * Skew-corrected for the same reason Home corrects it: a wrong device clock must not be what
   * decides which tab a booking belongs to.
   */
  const [nowMs] = useState(() => Date.now() - currentSkewMs());

  const state = useMemo(() => {
    if (active.state.status !== 'ready') return active.state;

    const now = new Date(nowMs);

    return ready(
      bookingListFrom({
        base: DEMO_UPCOMING_BOOKINGS,
        bookings: active.state.data.filter((booking) => isStillUpcoming(booking, now)),
        timeZone,
      }),
    );
  }, [active.state, timeZone, nowMs]);

  return { state, refetch: active.refetch };
}

/**
 * My bookings — Past tab. `GET /v1/me/bookings`, cursor-paginated
 * (`limit`/`cursorCreatedAt`/`cursorId`) but read here with no params, same as before this screen
 * grew a second tab — a long-history customer only sees the backend's first page. Known scope
 * limit, not a regression; infinite scroll is a follow-up, not part of this change.
 *
 * The two fixtures below (`DEMO_BOOKING_HISTORY`, `DEMO_UPCOMING_BOOKINGS`) supply only the
 * screen's static copy — title and empty-state text. A real account with no bookings returns `[]`
 * and the designed empty state renders as drawn.
 */
export function useBookingHistoryData(): ScreenQuery<BookingListViewModel> {
  const history = useBookingHistory();
  // Only for the service timezone the card dates are written on. Home and Schedule already read
  // this catalogue, so it is warm in the cache and adds no request; the list still renders if it
  // has not loaded, with the dates falling back to the device clock.
  const catalogue = useCatalogue();
  const timeZone =
    catalogue.state.status === 'ready' ? catalogue.state.data.operatingWindow.timeZone : undefined;

  const state = useMemo(() => {
    if (history.state.status !== 'ready') return history.state;
    return ready(
      bookingListFrom({
        base: DEMO_BOOKING_HISTORY,
        bookings: history.state.data,
        timeZone,
      }),
    );
  }, [history.state, timeZone]);

  return { state, refetch: history.refetch };
}

export interface MyBookingsData {
  readonly upcoming: ScreenQuery<BookingListViewModel>;
  readonly past: ScreenQuery<BookingListViewModel>;
}

/**
 * Both tabs, fetched unconditionally — cheap (TanStack Query dedupes by key regardless of how
 * many times a hook calling it renders), and it is what makes switching tabs instant once both
 * have loaded rather than re-fetching on every switch.
 */
export function useMyBookingsData(): MyBookingsData {
  const upcoming = useUpcomingBookingsData();
  const past = useBookingHistoryData();
  return { upcoming, past };
}

/**
 * Refund `state` -> the pill the frames draw.
 *
 * `RefundState` is `requested | provider_pending | succeeded | failed_retryable |
 * failed_terminal | reconcile_required` (DEC-067). The drawn vocabulary on `71:615` covers two of
 * those ideas — settled, and still moving — so:
 *
 *   succeeded                                   -> "Refunded", the money has landed
 *   requested / provider_pending / failed_retryable -> "Processing", it is still on its way
 *                                                  (a retryable failure IS retried automatically)
 *   reconcile_required / failed_terminal        -> NO pill
 *
 * The last line is deliberate and it is the one the contract argues for out loud: those two are
 * real durable outcomes where nobody yet knows the money is coming, and labelling them
 * "Processing" would tell a customer it is. No frame draws a "Failed" or "Needs review" pill
 * (defect D-15), so none is invented here — the row shows the refund and its amount, and the pill
 * is simply absent.
 *
 * The raw `state` string was previously rendered straight into the pill. It never appeared,
 * because the schema read `status` and the backend sends `state`, so the field parsed as
 * `undefined` and every refund drew an unlabelled row. Had it worked it would have printed
 * `provider_pending` at the customer.
 */
const REFUND_PRESENTATION: Record<string, { readonly label: string; readonly tone: StatusTone }> = {
  succeeded: { label: 'Refunded', tone: 'positive' },
  requested: { label: 'Processing', tone: 'info' },
  provider_pending: { label: 'Processing', tone: 'info' },
  failed_retryable: { label: 'Processing', tone: 'info' },
};

/**
 * Refunds — `GET /v1/me/refunds`.
 *
 * Every field on the row is the backend's `RefundRecord`: `refundId` identifies it, `amountPaise`
 * is the money, `state` chooses the pill. Nothing is summed and no refund is derived from a
 * booking total.
 */
export function useRefundHistoryData(): ScreenQuery<BookingListViewModel> {
  const refunds = useRefunds();
  // The service timezone, for the same reason the history list reads it: the booking date on a
  // refund row is calendar-day semantics on the service clock.
  const catalogue = useCatalogue();
  const timeZone =
    catalogue.state.status === 'ready' ? catalogue.state.data.operatingWindow.timeZone : undefined;

  const state = useMemo(() => {
    if (refunds.state.status !== 'ready') return refunds.state;

    return ready<BookingListViewModel>({
      ...DEMO_REFUND_HISTORY,
      bookings: refunds.state.data.map((refund) => {
        const presentation = REFUND_PRESENTATION[refund.state];
        // `71:615` heads the row with the BOOKING — "12th Apr • 1 hr" and the cook — and dates
        // the refund outcome underneath. A response from a deployment that predates the booking
        // context falls back to the amount-only headline the row always had.
        const hasBooking =
          refund.serviceStart !== null &&
          refund.serviceStart !== undefined &&
          refund.durationMinutes !== null &&
          refund.durationMinutes !== undefined;
        const outcomeAt = refund.completedAt ?? refund.requestedAt;
        const outcomeDay = formatServiceDate(serviceDateIn(timeZone, new Date(outcomeAt)), {
          day: 'numeric',
          month: 'short',
        });
        return {
          id: refund.refundId,
          headline: hasBooking
            ? headlineFor(
                {
                  scheduledStart: refund.serviceStart ?? null,
                  durationMinutes: refund.durationMinutes ?? 60,
                },
                timeZone,
              )
            : `Refund • ${formatPaise(refund.amountPaise)}`,
          ...cookFieldsFrom(refund.cook),
          amount: formatPaise(refund.amountPaise),
          subtitle:
            refund.completedAt !== null
              ? `Refund complete - ${outcomeDay}`
              : `Refund processing - ${outcomeDay}`,
          ...(presentation === undefined
            ? {}
            : { statusLabel: presentation.label, statusTone: presentation.tone }),
        };
      }),
    });
  }, [refunds.state, timeZone]);

  return { state, refetch: refunds.refetch };
}
