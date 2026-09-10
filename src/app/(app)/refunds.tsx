import { BookingListView, useRefundHistoryData } from '@features/history';
import { useSafeBack } from '@core/navigation';

/** Refunds - Figma `71:615`. A top-level destination from Profile, not a filter of history. */
export default function RefundsRoute() {
  const { state, refetch } = useRefundHistoryData();
  /**
   * `71:615` back -> `6:663` Profile, never Home (V7 founder comment, task §14).
   *
   * `useSafeBack`, not `useDeterministicBack`: Profile's tile grid is this route's only push
   * site, so a pop always lands correctly — and gets the platform's reverse-of-push closing
   * animation, where `dismissAll` + `replace` played none.
   */
  const goBack = useSafeBack('/profile');

  return (
    <BookingListView
      state={state}
      onRetry={refetch}
      onBack={goBack}
      variant="refund"
      testID="refunds-screen"
    />
  );
}
