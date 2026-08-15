import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { DEMO_HOME_ACTIVE_BOOKING } from '@/demo/fixtures/home';
import type { HomeViewModel } from './types';

/**
 * TODO(backend-contract): becomes a React Query hook reading the authoritative "home" payload —
 * header ETA, promo, tiles, trust row and any ACTIVE BOOKING. Whether a booking is active, and
 * everything shown about it, is a server decision (ruling R-2 / R-5).
 *
 * The development fixture defaults to the active-booking variant so the harder of the two states
 * is the one exercised by default.
 */
export function useHomeData(): ScreenQuery<HomeViewModel> {
  return useDevFixture(DEMO_HOME_ACTIVE_BOOKING);
}
