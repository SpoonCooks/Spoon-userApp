import { useState } from 'react';

import { BookingListView, useMyBookingsData } from '@features/history';
import { useSafeBack } from '@core/navigation';

/**
 * My bookings - Figma `6:227`, redesigned with an Upcoming/Past switcher.
 *
 * Both tabs are fetched unconditionally via `useMyBookingsData` (cheap — TanStack Query dedupes
 * by key regardless), so switching tabs is instant once both have loaded rather than re-fetching
 * per switch. Only the ACTIVE tab's `ScreenQuery` is handed to `BookingListView`.
 *
 * Profile is the fallback: it is the only screen that links here, so it is where a pop would have
 * landed had this route been reached by anything other than a deep link.
 */
export default function HistoryRoute() {
  const { upcoming, past } = useMyBookingsData();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const active = activeTab === 'upcoming' ? upcoming : past;

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
      state={active.state}
      onRetry={active.refetch}
      onBack={goBack}
      variant="history"
      tabs={{
        active: activeTab,
        onChange: (id) => setActiveTab(id === 'past' ? 'past' : 'upcoming'),
      }}
      testID="history-screen"
    />
  );
}
