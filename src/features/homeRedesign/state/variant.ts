import type { HomeModel, HomeVariant } from '../types';

/**
 * Which Home to draw. Re-resolved on every Home focus, so an address change to a live pincode
 * (or a first completed booking) swaps the variant without any other trigger.
 *
 *   pincode not live      → inactive
 *   has a past booking    → returning
 *   otherwise             → default
 */
export function resolveHomeVariant(model: Pick<HomeModel, 'serviceability' | 'user'>): HomeVariant {
  if (model.serviceability !== 'live') return 'inactive';
  if (model.user.hasCompletedBooking) return 'returning';
  return 'default';
}
