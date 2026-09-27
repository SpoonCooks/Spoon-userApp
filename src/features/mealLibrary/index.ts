/**
 * Feature: meal library — browse dishes by meal and by ingredient. See `types.ts` for the design
 * source and status. Static UI only; not linked from anywhere in the app yet.
 */
export { MealLibraryScreen } from './screens/MealLibraryScreen';
export type { MealLibraryScreenProps } from './screens/MealLibraryScreen';
export { defaultDietFor } from './diet';
export type { DishDiet, LibraryDish, LibraryIngredient, MealSlot } from './types';
