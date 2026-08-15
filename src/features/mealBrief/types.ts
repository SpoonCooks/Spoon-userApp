/**
 * Meal Brief & Recipe Link — Figma `3:684`.
 *
 * MAJOR RECLASSIFICATION from the audit: despite the frame name "service brief", this is an
 * OPTIONAL meal-customisation form (note the "Skip" link), not a payment review. There is no
 * payment screen anywhere in the product — `Pay →` opens Razorpay directly (ruling R-1).
 *
 * Boundary: the dish catalogue, dietary options and guest bounds are all server data. The client
 * captures input; it does not filter cooks, validate diets or decide what a cook can make.
 * Confirmed C-7: the diet axis is at least four-valued (Veg / Non-Veg / Jain / Eggetarian), so
 * nothing here treats it as a boolean.
 */

export interface MealBriefOption {
  readonly id: string;
  readonly label: string;
}

export interface MealBriefDishOption extends MealBriefOption {
  readonly preselected?: boolean;
}

export interface MealBriefViewModel {
  readonly title: string;
  readonly skipLabel: string;
  readonly dietaryTitle: string;
  readonly dietaryOptions: readonly MealBriefOption[];
  readonly guestsTitle: string;
  readonly guestsInitial: number;
  /** Server-supplied bounds. Absent means the UI stepper applies only its own floor of 1. */
  readonly guestsMin?: number;
  readonly guestsMax?: number;
  readonly dishesTitle: string;
  readonly dishOptions: readonly MealBriefDishOption[];
  readonly customDishPlaceholder: string;
  readonly customDishAddLabel: string;
  readonly recipeTitle: string;
  readonly recipeOptionalLabel: string;
  readonly recipeDescription: string;
  readonly recipePlaceholder: string;
  readonly notesTitle: string;
  readonly notesPlaceholder: string;
  readonly ctaLabel: string;
  /**
   * `3:799` — the inset black pill on the CTA ("Razorpay"). Present only when the server says the
   * booking is paid through a gateway; the client never decides that a payment is due.
   */
  readonly ctaBadgeLabel?: string;
}

export interface MealBriefDraft {
  readonly dietaryId: string | null;
  readonly guests: number;
  readonly dishIds: readonly string[];
  readonly customDishes: readonly string[];
  readonly recipeUrl: string;
  readonly notes: string;
}
