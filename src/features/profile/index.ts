import { createKeyFactory } from '@core/query';

/**
 * Feature: profile.
 *
 * Screen: `6:663` — identity card plus a 2×2 tile grid (My bookings · Addresses · My refunds ·
 * Help), and a footer carrying the live-site link, **Terms of Service & Privacy Policy**, and
 * Log Out (the app's one confirmed destructive treatment: red on pink).
 *
 * Ruling R-1 — there is deliberately NO payment-methods entry: payment opens Razorpay directly.
 * Ruling R-6 — T&C / Privacy live here and nowhere else.
 *
 * Logout must clear all three: SecureStore, the query cache and session status. That is wired in
 * `@core/auth` + `@core/runtime`, not here.
 *
 * V8 adds a SECOND screen to this feature: `338:4508` "Page 17- profile", the profile-details
 * form. It is reached from `6:663`'s completion card (`222:1570` / `456:3467`) in both of that
 * card's states, and from the boot gate on a first run — see `screens/ProfileDetailsScreen.tsx`
 * for the frame and `detailsData.ts` for what of it the backend can actually store.
 *
 * TODO(product B-10): the Help tile has no destination anywhere in the file.
 * BACKEND GAP: `PUT /v1/me/profile` accepts `name` and nothing else, so seven of the eight V8
 * answers cannot be persisted. Documented in `docs/FRONTEND_BACKEND_PENDING.md`.
 */
export const profileKeys = createKeyFactory('profile');

export { useProfileData } from './data';
export { ProfileView } from './screens/ProfileScreen';
export type { ProfileActions, ProfileViewProps } from './screens/ProfileScreen';

export { ProfileDetailsView } from './screens/ProfileDetailsScreen';
export type { ProfileDetailsViewProps } from './screens/ProfileDetailsScreen';
export { ProfileCompletionCard } from './components/ProfileCompletionCard';
export type { ProfileCompletionCardProps } from './components/ProfileCompletionCard';
export {
  profileDetailsFromMe,
  useProfileDetailsData,
  useProfileGate,
  useSaveProfileDetails,
} from './detailsData';
export type { ProfileDetailsData, ProfileGate } from './detailsData';
export {
  PROFILE_COOK_PREFERENCE_LABEL,
  PROFILE_DETAILS_CTA,
  PROFILE_DETAILS_INTRO,
  PROFILE_DETAILS_TITLE,
  PROFILE_FIELDS,
  PROFILE_REQUIRED_FIELDS,
  profileChoiceField,
  profileField,
  profilePromptField,
} from './fields';
export type {
  ProfileChipTone,
  ProfileChoiceField,
  ProfileChoiceFieldId,
  ProfileEntryField,
  ProfileField,
  ProfileFieldId,
  ProfileOption,
  ProfileTextField,
} from './fields';
export {
  EMPTY_PROFILE_DETAILS,
  addGrownUpEating,
  canSubmitProfileDetails,
  isProfileDetailsComplete,
  missingProfileFields,
  removeGrownUpEating,
  toggleSingle,
} from './validation';
export type { ProfileDetailsValues, ProfileSubmitGate } from './validation';

export type * from './types';
