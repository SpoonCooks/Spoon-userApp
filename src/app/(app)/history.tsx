import { BookingListView, useBookingHistoryData } from '@features/history';
import { useSafeBack } from '@core/navigation';

/**
 * Past bookings - Figma `6:227`. Past only; active bookings live on Home (ruling R-5).
 *
 * Profile is the fallback: it is the only screen that links here, so it is where a pop would have
 * landed had this route been reached by anything other than a deep link.
 */
export default function HistoryRoute() {
  const { state, refetch } = useBookingHistoryData();
  /**
   * `6:227` back -> `6:663` Profile, never Home (V7 founder comment, task §14).
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
      variant="history"
      testID="history-screen"
    />
  );
}
