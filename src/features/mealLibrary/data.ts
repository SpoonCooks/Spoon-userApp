import type { LibraryDish, LibraryIngredient, MealSlot } from './types';

/**
 * Fixture data for the Meal Library, copied from Figma `1:519`. Stands in for the backend until
 * a catalogue endpoint exists; no image URLs are set, so every tile shows its drawn placeholder.
 */

export const DEMO_MEAL_SLOTS: readonly MealSlot[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'drinks', label: 'Drinks' },
];

/** `1:541`–`1:553` — the frame opens on Lunch. */
export const DEMO_DEFAULT_MEAL_ID = 'lunch';

/** `1:559`–`1:636`. Bhindi's `1:562` artwork is an empty slot in the file, so it has no emoji. */
export const DEMO_INGREDIENTS: readonly LibraryIngredient[] = [
  { id: 'bhindi', label: 'Bhindi', title: 'Bhindi (Okra)' },
  { id: 'paneer', label: 'Paneer', title: 'Paneer', emoji: '🧀' },
  { id: 'aloo', label: 'Aloo', title: 'Aloo (Potato)', emoji: '🥔' },
  { id: 'curd', label: 'Curd', title: 'Curd', emoji: '🥛' },
  { id: 'palak', label: 'Palak', title: 'Palak (Spinach)', emoji: '🥬' },
  { id: 'tomato-onion', label: 'Tomato & Onion', title: 'Tomato & Onion', emoji: '🍅' },
  { id: 'gobi', label: 'Gobi', title: 'Gobi (Cauliflower)', emoji: '🥦' },
  { id: 'capsicum', label: 'Capsicum', title: 'Capsicum', emoji: '🫑' },
  { id: 'chicken', label: 'Chicken', title: 'Chicken', emoji: '🍗' },
  { id: 'besan', label: 'Besan', title: 'Besan (Gram flour)', emoji: '🌾' },
  { id: 'rice-poha', label: 'Rice & Poha', title: 'Rice & Poha', emoji: '🍚' },
  { id: 'mint-lemon', label: 'Mint & Lemon', title: 'Mint & Lemon', emoji: '🍋' },
];

export const DEMO_DEFAULT_INGREDIENT_ID = 'bhindi';

function dish(
  id: string,
  name: string,
  cookMinutes: number,
  diet: LibraryDish['diet'] = 'veg',
): LibraryDish {
  return { id, name, cookMinutes, diet };
}

/** `1:655`–`1:740` for Bhindi; the other ingredients are filled out so the rail can be browsed. */
export const DEMO_DISHES_BY_INGREDIENT: Readonly<Record<string, readonly LibraryDish[]>> = {
  bhindi: [
    dish('dry-bhindi', 'Dry Bhindi', 20),
    dish('masala-bhindi', 'Masala Bhindi', 25),
    dish('dahi-bhindi', 'Dahi Bhindi', 25),
    dish('bhindi-do-pyaza', 'Bhindi Do Pyaza', 30),
    dish('kurkuri-bhindi', 'Kurkuri Bhindi', 20),
    dish('bhareli-bhindi', 'Bhareli Bhindi', 30),
  ],
  paneer: [
    dish('paneer-bhurji', 'Paneer Bhurji', 20),
    dish('palak-paneer', 'Palak Paneer', 30),
    dish('kadai-paneer', 'Kadai Paneer', 30),
    dish('matar-paneer', 'Matar Paneer', 25),
  ],
  aloo: [
    dish('jeera-aloo', 'Jeera Aloo', 20),
    dish('aloo-gobi', 'Aloo Gobi', 25),
    dish('dum-aloo', 'Dum Aloo', 35),
  ],
  chicken: [
    dish('butter-chicken', 'Butter Chicken', 40, 'nonVeg'),
    dish('chicken-curry', 'Chicken Curry', 35, 'nonVeg'),
    dish('chicken-tikka', 'Chicken Tikka', 30, 'nonVeg'),
  ],
};
