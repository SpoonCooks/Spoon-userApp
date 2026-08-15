import { Image } from 'react-native';

import type { DishGlyphKey } from '@ui/components/dishGlyphs';
import type { CookViewModel, DishViewModel } from '@ui/types/viewModels';

/**
 * DEMO / TEST FIXTURES — NOT PRODUCTION DATA.
 *
 * Everything in `src/demo/` exists to exercise components before a backend contract exists. It is
 * never imported by a feature module or a production screen; the only consumers are the component
 * showcase (`src/app/(dev)/showcase.tsx`, dev-only) and tests.
 *
 * Values are transcribed from the audited Figma frames so the showcase looks like the design.
 */

/**
 * A dish and the mark the DESIGN pairs it with. `94:947` names the glyph on every one of Rekha's
 * nine chips, so these pairings are transcribed from the frame rather than guessed:
 * Chicken biryani → Poultry Leg (`94:954`), Fish curries → Fish Food (`94:961`), Mutton curries →
 * Meat (`94:968`), Lauki variants → Cucumber (`94:975`), Chola bhatura → Naan (`94:982`), Chutney
 * variants → Tomato (`94:989`), Pyaaz/gobi pakode → Onion (`94:996`), Pav bhaji → Beef Burger
 * (`94:1003`), Momo variants → Dim Sum (`94:1010`).
 *
 * The pure-veg list is the same cook filtered (confirmed C-6); the frame does not draw it, so the
 * four dishes unique to it reuse marks from the same set. Flagged as fixture presentation, not
 * design truth.
 */
function dishes(
  ...entries: readonly (readonly [string, DishGlyphKey])[]
): readonly DishViewModel[] {
  return entries.map(([label, glyph]) => ({
    id: label.toLowerCase().replace(/[^a-z]+/g, '-'),
    label,
    glyph,
  }));
}

/**
 * `94:910` — the cook photograph the frame ships, exported at 4× and bundled for DEVELOPMENT ONLY.
 *
 * The card's contract is unchanged: `photoUrl` is still a URI and the real photo still arrives from
 * the server per cook (task §11). Resolving a bundled asset to its URI lets the fixture stand in
 * for that without teaching `CookCard` about local assets — previously every booking screen fell
 * back to the "CR" initials panel, which is not what any frame draws.
 */
export const REKHA_SAMPLE_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/rekha-sample.jpg') as number,
).uri;

export const DEMO_COOK_REKHA: CookViewModel = {
  id: 'demo-cook-rekha',
  displayName: 'Cook Rekha',
  firstName: 'Rekha',
  photoUrl: REKHA_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'West Bengal',
  languages: ['Hindi', 'Bengali'],
  specialties: dishes(
    ['Chicken biryani', 'poultryLeg'],
    ['Fish curries', 'fish'],
    ['Mutton curries', 'meat'],
    ['Lauki variants', 'cucumber'],
    ['Chola bhatura', 'naan'],
    ['Chutney variants', 'tomato'],
    ['Pyaaz/ gobi pakode', 'onion'],
    ['Pav bhaji', 'beefBurger'],
    ['Momo variants', 'dimSum'],
  ),
  pureVegSpecialties: dishes(
    ['Chola bhatura', 'naan'],
    ['Pav bhaji', 'beefBurger'],
    ['Baigan palak aloo', 'zucchini'],
    ['Lauki variants', 'cucumber'],
    ['Aloo beans', 'potato'],
    ['Chutney variants', 'tomato'],
    ['Pyaaz/ gobi pakode', 'onion'],
    ['Raita variants', 'soupPlate'],
    ['Momo variants', 'dimSum'],
  ),
  badges: { spoonTrained: true, backgroundVerified: true, onTime: true },
};

/** A cook with only some badges earned — the case the sample cards never show. */
export const DEMO_COOK_PARTIAL_BADGES: CookViewModel = {
  id: 'demo-cook-sanchita',
  displayName: 'Cook Sanchita',
  firstName: 'Sanchita',
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'Assam',
  languages: ['Hindi', 'Assamese'],
  specialties: dishes(
    ['Chicken curries', 'poultryLeg'],
    ['Mutton masala', 'meat'],
    ['Mustard fish', 'fish'],
  ),
  badges: { spoonTrained: true },
};

/** Nothing optional supplied — proves the card degrades instead of breaking. */
export const DEMO_COOK_MINIMAL: CookViewModel = {
  id: 'demo-cook-minimal',
  displayName: 'Cook Jyoti',
  firstName: 'Jyoti',
};
