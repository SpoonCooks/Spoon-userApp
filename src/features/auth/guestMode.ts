import { Platform } from 'react-native';

/**
 * Whether "Skip" on Login is offered — guest browsing of Home without an account.
 *
 * iOS ONLY, permanently, by product decision. Android always requires sign-in.
 */
export function isGuestModeAvailable(): boolean {
  return Platform.OS === 'ios';
}
