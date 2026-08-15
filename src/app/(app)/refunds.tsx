import { useRouter } from 'expo-router';

import { BookingListView, useRefundHistoryData } from '@features/history';

/** Refunds - Figma `71:615`. A top-level destination from Profile, not a filter of history. */
export default function RefundsRoute() {
  const router = useRouter();
  const { state, refetch } = useRefundHistoryData();

  return (
    <BookingListView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      variant="refund"
      testID="refunds-screen"
    />
  );
}
