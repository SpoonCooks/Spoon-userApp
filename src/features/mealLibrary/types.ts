/**
 * Feature: meal library — browse dishes by meal (Breakfast, Lunch, …) and by the ingredient in
 * the fridge (Bhindi, Paneer, …), the way quick-commerce apps browse a category.
 *
 * Design source: Figma `cCQlzTeiObQkpVBzwI8mZi` ("Spoon- V0"), frame `1:519`.
 *
 * The screen draws whatever these lists hold — how many meals, ingredients and dishes is the
 * backend's answer, not the design's. No catalogue endpoint exists yet, so the dev preview feeds
 * it fixtures (`data.ts`, `demo.ts`). Every image is a URL the backend supplies; nothing here is
 * a bundled asset.
 *
 * Each shape is a superset of the `@ui` item it is drawn by (`PillTabItem`, `CategoryRailItem`,
 * `DishTileItem`), so it can be handed to those components as it is.
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
  /** The section title above the grid, e.g. "Bhindi (Okra)" (`1:648`). Falls back to `label`. */
  readonly title?: string | undefined;
  /** Backend-supplied artwork, drawn at 28pt (`1:562`). Wins over `emoji`. */
  readonly imageUrl?: string | undefined;
  /** The frame draws most ingredients as an emoji (`1:569`); used when there is no image. */
  readonly emoji?: string | undefined;
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
  readonly imageUrl?: string | undefined;
}
