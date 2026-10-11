import { useEffect, useMemo, useState } from 'react';

import { useActiveBookingPages, useBookingHistoryPages } from '@features/booking';
import { ready } from '@core/data';
import type { DataState } from '@core/data';
import { currentSkewMs } from '@core/time';

import { byMostRecentFirst, bySoonestFirst } from '../adapters';
import { isStillUpcoming } from '../data';
import { bookingRowFrom, upcomingFrom } from './model';
import type { BookingRow, NextVisit } from './model';

export interface BookingTabPaging {
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly loadMoreError: boolean;
  readonly loadMore: () => void;
  readonly retryLoadMore: () => void;
  readonly refetch: () => void;
}

export interface UpcomingTab extends BookingTabPaging {
  readonly state: DataState<{
    readonly next: NextVisit | null;
    readonly later: readonly BookingRow[];
  }>;
  readonly count: number;
}

export interface PastTab extends BookingTabPaging {
  readonly state: DataState<readonly BookingRow[]>;
  readonly count: number;
}

/**
 * Both tabs of the redesigned My bookings, from the same two endpoints the old list read:
 * `GET /v1/me/bookings/active` (Upcoming, soonest first — the server's order) and
 * `GET /v1/me/bookings` (Past, newest first). The Upcoming filter is the old one, unchanged
 * (`isStillUpcoming`): a finished booking whose slot has passed belongs to Past only — which is
 * also the dev note's "Cancelled stays here until its date passes, then moves to Past".
 */
export function useMyBookingsV2(): { readonly upcoming: UpcomingTab; readonly past: PastTab } {
  const active = useActiveBookingPages();
  const history = useBookingHistoryPages();
  // Read once on open, skew-corrected — see `useUpcomingBookingsData`.
  const [nowMs] = useState(() => Date.now() - currentSkewMs());

  const visible = useMemo(
    () =>
      active.state.status === 'ready'
        ? active.state.data
            .filter((booking) => isStillUpcoming(booking, new Date(nowMs)))
            .slice()
            .sort(bySoonestFirst)
        : undefined,
    [active.state, nowMs],
  );

  const upcomingState = useMemo(() => {
    if (active.state.status !== 'ready') return active.state;
    return ready(upcomingFrom(visible ?? [], new Date(nowMs)));
  }, [active.state, visible, nowMs]);

  const pastState = useMemo(() => {
    if (history.state.status !== 'ready') return history.state;
    return ready(
      history.state.data
        .slice()
        .sort(byMostRecentFirst)
        .map((dto) => bookingRowFrom(dto, new Date(nowMs))),
    );
  }, [history.state, nowMs]);

  // Every row loaded so far filtered out, with more behind them: nothing draws a scroll area to
  // ask for the next page, so ask here (as the old list did).
  const { hasMore, loadingMore, loadMore } = active;
  const nothingVisibleYet = visible !== undefined && visible.length === 0;
  useEffect(() => {
    if (nothingVisibleYet && hasMore && !loadingMore) loadMore();
  }, [nothingVisibleYet, hasMore, loadingMore, loadMore]);

  return {
    upcoming: {
      state: upcomingState,
      count: visible?.length ?? 0,
      hasMore: active.hasMore,
      loadingMore: active.loadingMore,
      loadMoreError: active.loadMoreError !== null,
      loadMore: active.loadMore,
      retryLoadMore: active.retryLoadMore,
      refetch: active.refetch,
    },
    past: {
      state: pastState,
      count: history.state.status === 'ready' ? history.state.data.length : 0,
      hasMore: history.hasMore,
      loadingMore: history.loadingMore,
      loadMoreError: history.loadMoreError !== null,
      loadMore: history.loadMore,
      retryLoadMore: history.retryLoadMore,
      refetch: history.refetch,
    },
  };
}
