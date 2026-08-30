import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useActiveBookings, useBookingDetail, useTracking } from '@features/booking';
import { addressLineOf, useAddresses } from '@features/address';
import { useCatalogue } from '@features/catalogue';
import { useInstantAvailability } from '@features/availability';
import { ready } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { currentSkewMs } from '@core/time';

import {
  formatClockLabel,
  formatDateLabel,
  formatTimeLabel,
  homeFrom,
  minutesUntil,
} from './adapters';
import { cookCardContentFor } from '@ui/components/cookCardContent';

import { homeBannerFor } from './state/homeBannerView';
import { DEMO_HOME_ACTIVE_BOOKING } from '@/demo/fixtures/home';
import type { HomeViewModel } from './types';

import type { BookingSummaryDto } from '@features/booking';

/**
 * Picks the one booking Home should project when the server returns more than one active row.
 * Live/actionable work outranks a completed unrated item; within a state the nearest upcoming
 * service start wins, and the id tie-breaker makes equal timestamps deterministic.
 */
export function selectHomeBooking(
  bookings: readonly BookingSummaryDto[],
): BookingSummaryDto | null {
  const rank: Readonly<Record<BookingSummaryDto['status'], number>> = {
    cook_en_route: 0,
    cook_arrived: 1,
    cooking: 2,
    assigned: 3,
    created: 4,
    completed: 5,
    cancelled: 6,
  };

  /*
   * Cancelled bookings are no longer filtered out.
   *
   * They were, and that quietly disabled a card the design draws and this app already fully
   * implements: `393:1072`, the apology leading to page 8c. A booking Spoon cancelled went
   * straight into Past bookings and Refunds while Home said nothing, so the customer's first news
   * of it was a refund line.
   *
   * The SERVER decides which cancellations qualify — its own, where money was actually taken, and
   * only while they are recent — so nothing here re-derives that. `rank` still puts them last,
   * because a live booking always outranks an apology, and `homeBannerFor` refuses to draw one
   * for a cancellation the customer made themselves.
   */
  return (
    bookings.slice().sort((left, right) => {
      const stateOrder = rank[left.status] - rank[right.status];
      if (stateOrder !== 0) return stateOrder;
      const leftStart =
        left.scheduledStart === null ? Number.POSITIVE_INFINITY : Date.parse(left.scheduledStart);
      const rightStart =
        right.scheduledStart === null ? Number.POSITIVE_INFINITY : Date.parse(right.scheduledStart);
      if (leftStart !== rightStart) return leftStart - rightStart;
      return left.id.localeCompare(right.id);
    })[0] ?? null
  );
}

/**
 * Home data.
 *
 * Three real reads, composed into the one designed screen:
 *
 *  - `GET /v1/me/addresses`  -> the header's address (the customer's default)
 *  - `GET /v1/me/bookings/active` -> whether the booking banner is drawn at all (ruling R-2)
 *  - `GET /v1/bookings/:id`  -> the cook, the timing and `allowedActions`, which the summary omits
 *  - `GET /v1/bookings/:id/tracking` -> the ETA, and ONLY while a cook is en route
 *  - `GET /v1/catalogue`     -> the instant arrival PROMISE behind "Spoon in 30 mins"
 *
 * `DEMO_HOME_ACTIVE_BOOKING` is no longer a data source. It is the static screen definition:
 * the promo panels, the two booking tiles, the cuisine mosaic, the reasons grid, the duration
 * matrix, the exclusions and the promise. None of that is domain state, and there is no endpoint
 * that serves it.
 *
 * PRODUCT_DECISION_PENDING: who owns that marketing content, and whether it should ever become
 * server-driven. Until that is answered it stays clearly static and clearly separate from the
 * domain reads above — which is what §18 asks for.
 *
 * Home renders as soon as the ADDRESS read settles. The active-booking read is additive: a Home
 * that is still fetching its booking shows the pre-booking variant rather than a spinner, which
 * is both faster and exactly what the design does when there is no booking.
 */
export function useHomeData(): ScreenQuery<HomeViewModel> {
  const addresses = useAddresses();
  const active = useActiveBookings();
  const catalogue = useCatalogue();

  const activeSummary =
    active.state.status === 'ready' ? selectHomeBooking(active.state.data) : null;

  // The summary carries no cook, no timing and no allowed actions, so the banner's cook, its
  // countdown and its rateability all come from the DETAIL. Fetched only when there IS a booking.
  const detail = useBookingDetail(activeSummary === null ? null : activeSummary.id, { poll: true });
  const detailData = detail.state.status === 'ready' ? detail.state.data : null;

  // Countdown labels are local display arithmetic over server timestamps. A one-second clock
  // state keeps the card live without making a network request; the detail/active reads resync the
  // authoritative timestamps and server clock offset.
  const liveCountdown = detailData?.status === 'cook_en_route' || detailData?.status === 'cooking';
  const [serverNowMs, setServerNowMs] = useState<number | null>(null);
  useEffect(() => {
    const updateClock = () => setServerNowMs(Date.now() - currentSkewMs());
    updateClock();
    if (!liveCountdown) return;
    const interval = setInterval(updateClock, 1_000);
    return () => clearInterval(interval);
  }, [liveCountdown]);

  /**
   * Tracking is read ONLY while a cook is travelling, because that is the one banner with an ETA
   * on it (`337:4284` "Arriving in 12 mins") and the endpoint 404s outside that window. Polling it
   * for a confirmed or completed booking would turn an expected absence into an error, and would
   * cost Home a request per interval for a number no card is showing.
   */
  const enRoute = detailData?.status === 'cook_en_route';
  const tracking = useTracking(enRoute && activeSummary !== null ? activeSummary.id : null);
  const trackingData = tracking.state.status === 'ready' ? tracking.state.data : null;

  /**
   * Can Spoon deliver an instant booking AT ALL right now?
   *
   * `3:684` promises "Spoon in 30 mins" in the header and again on the Instant tile. Both were
   * drawn unconditionally from the catalogue's arrival promise, so at 1 AM — with every cook off
   * shift and the Instant sheet about to refuse — Home still advertised a cook in 30 minutes.
   * The promise has to be answerable before it is made.
   *
   * The probe asks about the SHORTEST duration in the catalogue deliberately: it is the most
   * permissive question available, so a `false` here means no duration could be served, not that
   * one particular length was too long. Availability is a question about a specific duration, so
   * some duration has to be named; the shortest is the one that cannot produce a false negative.
   */
  const defaultAddressId =
    addresses.state.status === 'ready'
      ? ((addresses.state.data.find((address) => address.isDefault) ?? addresses.state.data[0])
          ?.id ?? null)
      : null;
  const shortestDurationMinutes =
    catalogue.state.status === 'ready' && catalogue.state.data.durations.length > 0
      ? Math.min(...catalogue.state.data.durations.map((duration) => duration.durationMinutes))
      : null;
  const instantAvailability = useInstantAvailability({
    addressId: defaultAddressId,
    durationMinutes: shortestDurationMinutes,
  });

  const state = useMemo(() => {
    if (addresses.state.status !== 'ready') return addresses.state;

    // Only a SETTLED refusal suppresses the promise. While the probe is still in flight the
    // header keeps the catalogue's wording, because flickering "Spoon in 30 mins" -> "Spoon" on
    // every cold start would be worse than a promise that is briefly optimistic.
    const instantUnavailable =
      instantAvailability.state.status === 'ready' && !instantAvailability.state.data.available;

    const defaultAddress =
      addresses.state.data.find((address) => address.isDefault) ?? addresses.state.data[0] ?? null;

    /**
     * The banner, built from what the SERVER said — never from a client guess.
     *
     * Both minute figures are display arithmetic over a server INSTANT, not predictions: the ETA
     * is `eta.estimatedArrivalAt` and the time left is `timing.expectedEnd`, which moves when a
     * service starts late or is extended. `scheduledStart + duration` is deliberately not used
     * for either.
     */
    const activeBooking =
      activeSummary === null || detailData === null || serverNowMs === null
        ? undefined
        : ((() => {
            const serverNow = new Date(serverNowMs);
            return homeBannerFor({
              bookingId: activeSummary.id,
              status: detailData.status,
              cookName: detailData.cook?.name ?? null,
              // The banner draws the TRANSPARENT cut-out over its `#FFF7CC` panel (`337:4364`).
              // A hosted photo wins; otherwise the cook's stable profileCode resolves the
              // bundled cut-out, and a cook with neither renders the banner without a photo.
              cookPhotoUrl:
                detailData.cook?.photoUrl ??
                cookCardContentFor(detailData.cook?.profileCode)?.cutoutPhotoUrl ??
                null,
              dateLabel: formatDateLabel(detailData.scheduledStart, serverNow),
              timeLabel: formatTimeLabel(detailData.scheduledStart, detailData.durationMinutes),
              etaMinutes: minutesUntil(trackingData?.eta.estimatedArrivalAt, serverNow),
              minutesLeft:
                detailData.status === 'cooking'
                  ? minutesUntil(detailData.timing.expectedEnd, serverNow)
                  : null,
              arrivedAtLabel: formatClockLabel(detailData.timing.arrivedAt),
              canRate: detailData.allowedActions.canRate,
              cancelledBy: detailData.cancellation?.cancelledBy ?? null,
              reassigned: detailData.reassignment?.occurred === true,
              recoveryHandoff: detailData.recovery?.state === 'support_handoff',
              dispatchReady: detailData.dispatchReady ?? true,
            });
          })() ?? undefined);

    const base = DEMO_HOME_ACTIVE_BOOKING;
    const promiseMinutes =
      catalogue.state.status === 'ready'
        ? catalogue.state.data.instant.arrivalPromiseMinutes
        : null;

    return ready(
      homeFrom({
        /**
         * The arrival PROMISE appears TWICE on this screen and both readings are the catalogue's.
         *
         * The header headline was already patched from `instant.arrivalPromiseMinutes`; the
         * Instant tile's emphasised run was not, so it kept rendering the fixture's transcribed
         * " 18 mins" while the Instant sheet — which reads the same policy value — said 30. One
         * screen stated the promise two ways, and the tile's was simply a number from a Figma
         * frame. Both now come from the one published figure, so re-tuning the promise moves
         * every surface at once and none of them can drift again.
         *
         * The tile is matched by id rather than by position: `tiles` is ordered content, and a
         * future payload that puts Schedule first must not rewrite Schedule's subtitle.
         */
        base:
          instantUnavailable || promiseMinutes === null
            ? {
                ...base,
                // No promise can be kept, so none is made: the header is the brand alone, and
                // the Instant tile drops its emphasised " 30 mins" run rather than shrinking it
                // to a smaller lie.
                ...(instantUnavailable
                  ? {
                      header: { ...base.header, etaHeadline: 'Spoon' },
                      tiles: base.tiles.map((tile) => {
                        if (tile.id !== 'instant' || tile.subtitleEmphasis === undefined) {
                          return tile;
                        }
                        const { subtitleEmphasis: _dropped, ...withoutPromise } = tile;
                        return withoutPromise;
                      }),
                    }
                  : {}),
              }
            : {
                ...base,
                header: { ...base.header, etaHeadline: `Spoon in ${promiseMinutes} mins` },
                tiles: base.tiles.map((tile) =>
                  tile.id === 'instant' && tile.subtitleEmphasis !== undefined
                    ? { ...tile, subtitleEmphasis: ` ${promiseMinutes} mins` }
                    : tile,
                ),
              },
        addressLabel: defaultAddress?.label ?? null,
        addressLine:
          defaultAddress === undefined || defaultAddress === null
            ? null
            : addressLineOf(defaultAddress),
        activeBooking,
      }),
    );
  }, [
    addresses.state,
    activeSummary,
    detailData,
    trackingData,
    catalogue.state,
    instantAvailability.state,
    serverNowMs,
  ]);

  const refetchers = useRef({
    addresses: addresses.refetch,
    active: active.refetch,
    detail: detail.refetch,
    tracking: tracking.refetch,
  });
  useEffect(() => {
    refetchers.current = {
      addresses: addresses.refetch,
      active: active.refetch,
      detail: detail.refetch,
      tracking: tracking.refetch,
    };
  }, [addresses.refetch, active.refetch, detail.refetch, tracking.refetch]);
  const refetch = useCallback(() => {
    refetchers.current.addresses();
    refetchers.current.active();
    refetchers.current.detail();
    refetchers.current.tracking();
  }, []);

  return {
    state,
    refetch,
  };
}
