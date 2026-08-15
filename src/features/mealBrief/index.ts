import { createKeyFactory } from '@core/query';

/**
 * Feature: meal brief — Figma `3:684` "Meal Brief & Recipe Link".
 *
 * Confirmed C-8: a SKIPPABLE customisation form, not a payment review. There is no Spoon payment
 * screen anywhere in the product (ruling R-1).
 *
 * Boundary: the dish catalogue, dietary options and guest bounds are server data. The client
 * captures input and performs no dietary filtering of cooks or dishes (C-7: the diet axis is at
 * least four-valued, never a boolean).
 *
 * TODO(backend-contract): no meal-brief endpoint or payload exists; the recipe URL is captured as
 * text and must be validated at the boundary once a contract exists.
 */
export const mealBriefKeys = createKeyFactory('meal-brief');

export { useMealBriefData } from './data';
export { MealBriefView } from './screens/MealBriefScreen';
export type { MealBriefActions, MealBriefViewProps } from './screens/MealBriefScreen';
export type * from './types';
