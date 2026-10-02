/**
 * Feature: meal library — browse dishes by meal and by ingredient. See `types.ts` for the design
 * source and status. Static UI only; not linked from anywhere in the app yet.
 *
 * The screen is data-driven and its building blocks live in `@ui` (`PillTabs`, `CategoryRail`,
 * `SegmentedToggle`, `DishTile`, `DishTileGrid`) so other screens can reuse them.
 */
export { MealLibraryScreen } from './screens/MealLibraryScreen';
export type { MealLibraryScreenProps } from './screens/MealLibraryScreen';
export { defaultDietFor } from './diet';
export { useMealLibraryDemo } from './demo';
export type { DishDiet, LibraryDish, LibraryIngredient, MealSlot } from './types';
