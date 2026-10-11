import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { MyBookingsScreen, useMyBookingsV2 } from '@features/history';
import type { MyBookingsTab } from '@features/history';
import { useNavigationGuard, useSafeBack } from '@core/navigation';

/**
 * My bookings — Figma `2192:4371` (Upcoming), `2192:4430` (Past), `2192:4504` / `2192:4534`
 * (Empty). `?tab=past` opens on Past — Account & data's "Booking history" row (dev note
 * `2084:2781`).
 *
 * Both tabs are fetched up front so switching is instant, and both stay mounted so each keeps its
 * own scroll position (dev note `2192:4489`).
 */
export default function HistoryRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { upcoming, past } = useMyBookingsV2();
  const [tab, setTab] = useState<MyBookingsTab>(params.tab === 'past' ? 'past' : 'upcoming');

  /**
   * Back -> the Account hub, never Home (V7 founder comment, task §14). `useSafeBack`: the hub and
   * Account & data are this route's only push sites, so a pop always lands correctly.
   */
  const goBack = useSafeBack('/profile');
  // One screen per tap: a quick double tap must not open the same booking twice.
  const guard = useNavigationGuard();

  return (
    <MyBookingsScreen
      tab={tab}
      onTab={setTab}
      upcoming={upcoming}
      past={past}
      onBack={guard(goBack)}
      /*
       * A card opens Visit details. Tagged `?from=history` so the booking host's back control pops
       * here instead of replacing to Home — see `goBack` in `booking/[id].tsx`.
       */
      onOpen={guard((bookingId: string) =>
        router.push(`/booking/${bookingId}?from=history` as Href),
      )}
      onBook={guard(() => router.push('/scheduled'))}
    />
  );
}
