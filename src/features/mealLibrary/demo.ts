import { useMemo, useState } from 'react';

import {
  DEMO_DEFAULT_INGREDIENT_ID,
  DEMO_DEFAULT_MEAL_ID,
  DEMO_DISHES_BY_INGREDIENT,
  DEMO_INGREDIENTS,
  DEMO_MEAL_SLOTS,
} from './data';
import type { MealLibraryScreenProps } from './screens/MealLibraryScreen';
import type { LibraryDish } from './types';

const ALL_DISHES: readonly LibraryDish[] = Object.values(DEMO_DISHES_BY_INGREDIENT).flat();

/**
 * Plays the part of the backend for the dev preview: holds the selection, answers it from the
 * fixtures, and searches them by name. A real container swaps this for catalogue queries and
 * keeps the same props, since the screen neither knows nor cares where the lists come from.
 *
 * The fixtures do not vary by meal, so switching meals only moves the selection.
 */
export function useMealLibraryDemo(): Pick<
  MealLibraryScreenProps,
  | 'meals'
  | 'selectedMealId'
  | 'onSelectMeal'
  | 'ingredients'
  | 'selectedIngredientId'
  | 'onSelectIngredient'
  | 'dishes'
  | 'onSearchChange'
  | 'searchResults'
> {
  const [selectedMealId, setMealId] = useState<string | null>(DEMO_DEFAULT_MEAL_ID);
  const [selectedIngredientId, setIngredientId] = useState<string | null>(
    DEMO_DEFAULT_INGREDIENT_ID,
  );
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const needle = query.toLowerCase();
    return needle === '' ? [] : ALL_DISHES.filter((d) => d.name.toLowerCase().includes(needle));
  }, [query]);

  return {
    meals: DEMO_MEAL_SLOTS,
    selectedMealId,
    onSelectMeal: setMealId,
    ingredients: DEMO_INGREDIENTS,
    selectedIngredientId,
    onSelectIngredient: setIngredientId,
    dishes:
      selectedIngredientId === null ? [] : (DEMO_DISHES_BY_INGREDIENT[selectedIngredientId] ?? []),
    onSearchChange: setQuery,
    searchResults,
  };
}
