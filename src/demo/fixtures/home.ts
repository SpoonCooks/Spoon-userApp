import type { HomeViewModel } from '@features/home';

import { DEMO_BOOKING_ACTIVE } from './bookings';

/**
 * DEMO / TEST FIXTURES — NOT PRODUCTION DATA.
 *
 * Values are transcribed from `1:455` (pre-booking Home) and `59:520` (active-booking Home) so
 * the screens can be checked against the design. They are SAMPLE DATA, not rules: the ETA
 * headline, promo copy, tile copy and the duration guide are all server-owned content.
 */

const MARKETING: NonNullable<HomeViewModel['marketing']> = {
  cuisinesTitle: 'Cooks for every family and every need',
  cuisines: [
    { id: 'daily', label: 'Daily meals' },
    { id: 'north', label: 'North Indian dishes' },
    { id: 'south', label: 'South Indian dishes' },
    { id: 'asian', label: 'Chinese and Asian dishes' },
  ],
  reasonsTitle: 'Reasons to rely on Spoon cooks',
  reasons: [
    { id: 'trained', label: 'Trained' },
    { id: 'hygienic', label: 'Hygienic' },
    { id: 'amenable', label: 'Amenable' },
    { id: 'hours', label: '5 am to 8 pm' },
    { id: 'efficient', label: 'Efficient' },
    { id: 'punctual', label: 'Punctual' },
  ],
  durationGuideTitle: 'How to choose a duration?',
  // Uppercasing is a typography-token concern (`labelUpper`), not baked into the content.
  durationGuideColumns: ['People', 'Dish', 'time'],
  durationGuide: [
    { people: '1–4', dish: 'Snacks/ sides/ roti', time: '30 mins' },
    { people: '1–2', dish: '2-3 (simple)', time: '45 mins' },
    { people: '1–2', dish: '2-3 (complex)', time: '60 mins' },
    { people: '3–4', dish: '2-3 (simple)', time: '1 hr' },
    { people: '3–4', dish: '2-3 (complex)', time: '1.5 hrs' },
    { people: '5–6', dish: '2-3 (simple)', time: '1.5 hrs' },
    { people: '5–6', dish: '4-5 (simple)', time: '2 hrs' },
    { people: '5–6', dish: '2-3 (complex)', time: '2 hrs' },
    { people: '5–6', dish: '4-5 (complex)', time: '2.5 hrs' },
    { people: '7–8', dish: '2-3 (simple)', time: '2 hrs' },
    { people: '7–8', dish: '4-5 (simple)', time: '2.5 hrs' },
  ],
  exclusionsTitle: "What's not included?",
  exclusions: [
    { id: 'utensils', label: 'Stale utensil washing' },
    { id: 'stove', label: 'Deep stove cleaning' },
    { id: 'electronics', label: 'Using fancy electronics' },
    { id: 'kitchen', label: 'Cleaning entire kitchen' },
  ],
  promiseTitle: "Spoon's promise",
};

const HEADER = {
  etaHeadline: 'Spoon in 18 mins',
  addressLabel: 'Home',
  addressLine: 'E102, Purva Skydale, Silver Count…',
};

/**
 * Copy transcribed from `209:1242` / `209:1244` and `209:1251` / `209:1253`.
 *
 * The Instant subtitle is ONE paragraph in TWO styles — "Get a cook in" at SemiBold 12/16 and
 * " 18 mins" at Bold 14/20 — so the emphasis is carried as its own field, not inferred.
 */
const TILES: HomeViewModel['tiles'] = [
  {
    id: 'instant',
    title: 'Instant',
    subtitle: 'Get a cook in',
    subtitleEmphasis: ' 18 mins',
    tone: 'positive',
    icon: 'instant',
  },
  {
    id: 'scheduled',
    title: 'Schedule',
    subtitle: 'Plan your meal',
    tone: 'accent',
    icon: 'calendar',
  },
];

/**
 * Page 3a `1:455` — no booking in flight.
 *
 * No `promo` is supplied: the promo panels in Page 3a (`1:479`) are EMPTY colour fields. The
 * frame carries no artwork, copy or slide indicators, so supplying the previous design's
 * "Flat 50% OFF" copy here would render something the new source of truth does not contain.
 * The carousel renders its designed geometry regardless. DESIGN_PENDING.
 */
export const DEMO_HOME_PRE_BOOKING: HomeViewModel = {
  header: HEADER,
  tiles: TILES,
  marketing: MARKETING,
};

/** Page 3b `209:1207` — a booking is in flight, so the upcoming-booking card is present. */
export const DEMO_HOME_ACTIVE_BOOKING: HomeViewModel = {
  header: HEADER,
  tiles: TILES,
  activeBooking: DEMO_BOOKING_ACTIVE,
  // Page 3b (`209:1207`) is Page 3a plus the active-booking card — the marketing stack remains.
  marketing: MARKETING,
};
