/**
 * Feature: loading.
 *
 * Screens: `73:1036` Page 1 loading landing (the splash), `71:747` Page 1 loading others (the
 * full-screen interstitial) and `433:2290` Page 21 confirmation loading. All three are DESIGNED
 * states, so they are used in place of a generic spinner wherever a whole screen is waiting
 * (task §13).
 *
 * BOUNDARY: none of them advances anything. The splash zoom is a visual event; app readiness is
 * decided in `src/app/_layout.tsx` by the session and the font load.
 */
export { ConfirmationLoading, IntroLoading, SplashLoading } from './screens/LoadingScreens';
export type {
  ConfirmationLoadingProps,
  IntroLoadingProps,
  SplashLoadingProps,
} from './screens/LoadingScreens';
