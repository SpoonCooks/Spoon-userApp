import { BookingListView, useBookingHistoryData } from '@features/history';
import { useDeterministicBack } from '@core/navigation';

/**
 * Past bookings - Figma `6:227`. Past only; active bookings live on Home (ruling R-5).
 *
 * Profile is the fallback: it is the only screen that links here, so it is where a pop would have
 * landed had this route been reached by anything other than a deep link.
 */
export default function HistoryRoute() {
  const { state, refetch } = useBookingHistoryData();
  // `6:227` back -> `6:663` Profile, never Home (V7 founder comment, task §14).
  const goBack = useDeterministicBack('/profile');

  return (
    <BookingListView
      state={state}
      onRetry={refetch}
      onBack={goBack}
      variant="history"
      testID="history-screen"
    />
  );
}
