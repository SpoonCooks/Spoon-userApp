import { useState } from 'react';

import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import {
  DEMO_BOOKING_ARRIVED,
  DEMO_BOOKING_AUTO_CANCELLED,
  DEMO_BOOKING_COMPLETION,
  DEMO_BOOKING_CONFIRMATION,
  DEMO_BOOKING_EN_ROUTE,
  DEMO_BOOKING_EN_ROUTE_LATE,
  DEMO_BOOKING_REASSIGNED,
  DEMO_BOOKING_REASSIGNED_LATE,
  DEMO_EXTENSION,
  DEMO_INSTANT_AVAILABLE,
  demoInServiceBooking,
} from '@/demo/fixtures/booking';
import type { BookingDetailViewModel, ExtensionViewModel, InstantViewModel } from './types';

/**
 * TODO(backend-contract): each hook becomes a React Query `useQuery`. Until then they return a
 * development sample so the screens can be built against real shapes.
 *
 * The lifecycle `view` in the payload stands in for what will be resolved from the server's
 * status through `state/bookingStatusView.ts` — whose registry is deliberately empty until the
 * status enum exists. The client never derives the view itself.
 */

export function useInstantData(): ScreenQuery<InstantViewModel> {
  return useDevFixture(DEMO_INSTANT_AVAILABLE);
}

export function useExtensionData(): ScreenQuery<ExtensionViewModel> {
  return useDevFixture(DEMO_EXTENSION);
}

/** Development-only variants, so every lifecycle surface is reachable while there is no backend. */
const DEMO_VIEWS: Readonly<Record<string, BookingDetailViewModel>> = {
  confirmation: DEMO_BOOKING_CONFIRMATION,
  enRoute: DEMO_BOOKING_EN_ROUTE,
  enRouteLate: DEMO_BOOKING_EN_ROUTE_LATE,
  arrived: DEMO_BOOKING_ARRIVED,
  completion: DEMO_BOOKING_COMPLETION,
  // Server-reported states. Nothing in this app can navigate INTO them on its own.
  reassigned: DEMO_BOOKING_REASSIGNED,
  reassignedLate: DEMO_BOOKING_REASSIGNED_LATE,
  autoCancelled: DEMO_BOOKING_AUTO_CANCELLED,
};

export function useBookingDetailData(bookingId: string): ScreenQuery<BookingDetailViewModel> {
  // Captured once so the countdown target does not move on every render.
  const [startedAtMs] = useState(() => Date.now());

  const sample =
    DEMO_VIEWS[bookingId] ??
    (bookingId === 'inService' ? demoInServiceBooking(startedAtMs) : DEMO_BOOKING_EN_ROUTE);

  return useDevFixture(sample);
}
