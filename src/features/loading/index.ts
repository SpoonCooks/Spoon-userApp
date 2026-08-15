/**
 * Feature: loading.
 *
 * Screens: `73:1036` Page 1 loading landing (the splash) and `71:747` Page 1 loading others (the
 * full-screen interstitial). Both are DESIGNED states, so they are used in place of a generic
 * spinner wherever a whole screen is waiting (task §13).
 *
 * BOUNDARY: neither screen advances anything. The splash zoom is a visual event; app readiness is
 * decided in `src/app/_layout.tsx` by the session and the font load.
 */
export { IntroLoading, SplashLoading } from './screens/LoadingScreens';
export type { IntroLoadingProps, SplashLoadingProps } from './screens/LoadingScreens';
