/**
 * Feature: homeRedesign — the new Home from Figma `cCQlzTeiObQkpVBzwI8mZi`.
 *
 * Frontend logic is wired from the frames' dev notes; data is a fixture until the endpoint
 * exists. The live Home (`@features/home`) is untouched.
 */
export { HomeRedesignScreen, HomeRedesignView } from './screens/HomeRedesignScreen';
export type {
  BookingRequest,
  HomeRedesignActions,
  HomeRedesignScreenProps,
  HomeRedesignViewProps,
} from './screens/HomeRedesignScreen';
export { resolveHomeVariant } from './state/variant';
export { joinWaitlist } from './state/waitlist';
export type { JoinWaitlistDeps, WaitlistChannel } from './state/waitlist';
export type { BookingMode } from './state/bookingDraft';
export type { RecurringTarget } from './state/recurring';
export type * from './types';
