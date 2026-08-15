import { createKeyFactory } from '@core/query';

/**
 * Feature: profile.
 *
 * Screen: `6:663` — identity card plus a 2×2 tile grid (My orders · Addresses · My refunds ·
 * Help), and a footer carrying the live-site link, **Terms of Service & Privacy Policy**, and
 * Log Out (the app's one confirmed destructive treatment: red on pink).
 *
 * Ruling R-1 — there is deliberately NO payment-methods entry: payment opens Razorpay directly.
 * Ruling R-6 — T&C / Privacy live here and nowhere else.
 *
 * Logout must clear all three: SecureStore, the query cache and session status. That is wired in
 * `@core/auth` + `@core/runtime`, not here.
 *
 * TODO(product B-10): the Help tile has no destination anywhere in the file.
 * TODO(backend-contract): no profile endpoint or payload exists.
 */
export const profileKeys = createKeyFactory('profile');

export { useProfileData } from './data';
export { ProfileView } from './screens/ProfileScreen';
export type { ProfileActions, ProfileViewProps } from './screens/ProfileScreen';
export type * from './types';
