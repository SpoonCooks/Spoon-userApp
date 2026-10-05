import type { HomeModel } from '../types';

/** Recurring unlocks once the customer has at least this many cooks in their pool. */
export const RECURRING_MIN_POOL = 2;

/** Beads shown on Home. */
export const MAX_POOL_BEADS = 6;

export type RecurringTarget = 'recurringFlow' | 'planTracker' | 'explainer';

export interface RecurringChip {
  readonly label: string;
  readonly target: RecurringTarget;
}

type RecurringInput = Pick<HomeModel, 'cookPool' | 'activeRecurringPlan'>;

/**
 * The lime chip on the pool block:
 *   plan active            → "Recurring · Live" → plan tracker
 *   pool qualifies (≥ 2)   → "Book Recurring"   → recurring flow
 *   pool under 2           → "Check Recurring"  → explainer  (proposed in the dev note)
 */
export function recurringChipFor(model: RecurringInput): RecurringChip {
  if (model.activeRecurringPlan !== null) {
    return { label: 'Recurring · Live', target: 'planTracker' };
  }
  if (model.cookPool.length >= RECURRING_MIN_POOL) {
    return { label: 'Book Recurring', target: 'recurringFlow' };
  }
  return { label: 'Check Recurring', target: 'explainer' };
}

/** Whether the Recurring tab of the booking toggle can be chosen. */
export function isRecurringUnlocked(model: RecurringInput): boolean {
  return model.activeRecurringPlan !== null || model.cookPool.length >= RECURRING_MIN_POOL;
}

/** Real cooks only, capped at six. A cook without a photo is never drawn as a placeholder face. */
export function poolBeads(model: Pick<HomeModel, 'cookPool'>): HomeModel['cookPool'] {
  return model.cookPool.filter((cook) => cook.photo !== null).slice(0, MAX_POOL_BEADS);
}
