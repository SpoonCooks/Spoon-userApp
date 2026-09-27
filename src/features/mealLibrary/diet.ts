import type { DishDiet } from './types';

/**
 * The profile answers that open the library on Veg. The ids are the profile's own
 * (`features/profile/fields.ts`, "Dietary preference*"), read off `GET /v1/me`.
 */
const VEG_PREFERENCES: ReadonlySet<string> = new Set(['vegan', 'vegetarian']);

/**
 * Which Veg / Non-Veg option the Meal Library opens on, from the customer's profile
 * `dietaryPreference`.
 *
 * Vegan and vegetarian customers open on Veg. Everyone else opens on Non-Veg: that covers
 * eggetarian and non-vegetarian, and an unanswered (`null` / absent) preference as well.
 */
export function defaultDietFor(dietaryPreference: string | null | undefined): DishDiet {
  return dietaryPreference != null && VEG_PREFERENCES.has(dietaryPreference) ? 'veg' : 'nonVeg';
}
