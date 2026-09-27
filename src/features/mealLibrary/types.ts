/**
 * Feature: meal library — browse dishes by meal (Breakfast, Lunch, …) and by the ingredient in
 * the fridge (Bhindi, Paneer, …), the way quick-commerce apps browse a category.
 *
 * Design source: Figma `cCQlzTeiObQkpVBzwI8mZi` ("Spoon- V0"), frame `1:519`.
 *
 * No backend contract exists yet, so the screen renders from local fixture data (`data.ts`).
 * Every image is a URL the backend will supply — nothing here is a bundled asset.
 */

/** A meal tab in the horizontal strip under the header (`1:540`). */
export interface MealSlot {
  readonly id: string;
  readonly label: string;
}

/** An ingredient in the vertical rail (`1:557`). */
export interface LibraryIngredient {
  readonly id: string;
  /** The rail label, e.g. "Bhindi". Truncates to one line, as `1:600` "Tomato &…" does. */
  readonly label: string;
  /** The section title above the grid, e.g. "Bhindi (Okra)" (`1:648`). */
  readonly title: string;
  /** Backend-supplied artwork, drawn at 28pt (`1:562`). Wins over `emoji`. */
  readonly imageUrl?: string;
  /** The frame draws most ingredients as an emoji (`1:569`); used until an image arrives. */
  readonly emoji?: string;
}

export type DishDiet = 'veg' | 'nonVeg';

/** A dish card in the grid (`1:655`). */
export interface LibraryDish {
  readonly id: string;
  readonly name: string;
  /** Minutes to cook, shown in the badge on the photo — "20m" (`1:664`). */
  readonly cookMinutes: number;
  readonly diet: DishDiet;
  /** Backend-supplied photo. Absent, the tile keeps the frame's plain `#FFF7CC` fill. */
  readonly imageUrl?: string;
}
