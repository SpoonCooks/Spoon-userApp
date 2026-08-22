import { BookingListView, useRefundHistoryData } from '@features/history';
import { useDeterministicBack } from '@core/navigation';

/** Refunds - Figma `71:615`. A top-level destination from Profile, not a filter of history. */
export default function RefundsRoute() {
  const { state, refetch } = useRefundHistoryData();
  // `71:615` back -> `6:663` Profile, never Home (V7 founder comment, task §14).
  const goBack = useDeterministicBack('/profile');

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
