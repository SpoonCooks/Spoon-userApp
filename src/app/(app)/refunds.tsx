import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { BookingListView, useRefundHistoryData } from '@features/history';
import { useNavigationGuard, useSafeBack } from '@core/navigation';

/** Refunds - Figma `71:615`. A top-level destination from Profile, not a filter of history. */
export default function RefundsRoute() {
  const router = useRouter();
  const refunds = useRefundHistoryData();
  const { state, refetch } = refunds;
  /**
   * `71:615` back -> `6:663` Profile, never Home (V7 founder comment, task §14).
   *
   * `useSafeBack`, not `useDeterministicBack`: Profile's tile grid is this route's only push
   * site, so a pop always lands correctly — and gets the platform's reverse-of-push closing
   * animation, where `dismissAll` + `replace` played none.
   */
  // One screen per tap: a quick double tap must not open (or pop) a screen twice.
  const guard = useNavigationGuard();
  const goBack = useSafeBack('/profile');

  return (
    <BookingListView
      state={state}
      onRetry={refetch}
      onBack={guard(goBack)}
      // A row opens that refund's tracker (DEC-090).
      onSelect={guard((refundId) => router.push(`/refund/${refundId}` as Href))}
      variant="refund"
      paging={{
        hasMore: refunds.hasMore,
        loadingMore: refunds.loadingMore,
        error: refunds.loadMoreError !== null,
        onLoadMore: refunds.loadMore,
        onRetry: refunds.retryLoadMore,
      }}
      testID="refunds-screen"
    />
  );
}
