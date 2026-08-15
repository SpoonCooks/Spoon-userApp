import { useRouter } from 'expo-router';

import { BookingListView, useBookingHistoryData } from '@features/history';

/** Past bookings - Figma `6:227`. Past only; active bookings live on Home (ruling R-5). */
export default function HistoryRoute() {
  const router = useRouter();
  const { state, refetch } = useBookingHistoryData();

  return (
    <BookingListView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      variant="history"
      testID="history-screen"
    />
  );
}
