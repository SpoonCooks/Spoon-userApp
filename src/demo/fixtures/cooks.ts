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
 * A dish and the mark the DESIGN pairs it with.
 *
 * The "Cook profiles" section (`289:8515`) names the glyph on every chip of all EIGHT cards, so
 * every pairing below is transcribed from its node rather than guessed — including the pure-veg
 * lists, which the current file draws in full (`289:7642`, `289:7767`, `289:7891`, `289:8263`)
 * where the superseded revision did not.
 *
 * Two corrections fell out of that read on Rekha's pure-veg list alone: "Aloo beans" is Peas
 * (`87:571`), not Potato, and "Raita variants" is Onion, not Soup Plate.
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
 *
 * It is named for the CARD, not for Rekha: all eight frames in `289:8515`, and the in-flow cards
 * such as `300:2632`, place the SAME image fill at the same 89 × 133.5 crop. So every sample cook
 * carries it, and the initials panel stays reachable only through `DEMO_COOK_MINIMAL` — the
 * degraded payload it actually exists for.
 */
export const COOK_SAMPLE_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/rekha-sample.jpg') as number,
).uri;

/**
 * `337:4364` — the same cook as a TRANSPARENT cut-out, which is what the current file places on
 * the Home active-booking card and the Service-flow rating card. Those frames draw the portrait
 * over a `#FFF7CC` panel, so a photo with a baked-in background (`rekha-sample.jpg`, which the
 * cook cards still use) would paint a second, wrong ground inside the box.
 *
 * DEVELOPMENT ONLY, exactly like `COOK_SAMPLE_PHOTO`: `cookPhotoUrl` is still a URI and the real
 * photo still arrives from the server per cook.
 */
export const COOK_CUTOUT_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/rekha-cutout.png') as number,
).uri;

/**
 * Every card in `289:8515` earns all three badges. That is a property of the SAMPLE, not of cooks
 * — see `CookBadgesViewModel` — so `DEMO_COOK_PARTIAL_BADGES` still exercises the other case.
 */
const ALL_BADGES = { spoonTrained: true, backgroundVerified: true, hygienic: true } as const;

/** `289:8388` / `289:8263` — Cook Rekha, standard and pure veg. */
export const DEMO_COOK_REKHA: CookViewModel = {
  id: 'demo-cook-rekha',
  displayName: 'Cook Rekha',
  firstName: 'Rekha',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'West Bengal',
  // `299:1811` draws the language glyph with no label on this card — no language data.
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
    ['Aloo beans', 'peas'],
    ['Chutney variants', 'tomato'],
    ['Pyaaz/ gobi pakode', 'onion'],
    ['Raita variants', 'onion'],
    ['Momo variants', 'dimSum'],
  ),
  badges: ALL_BADGES,
};

/** `289:7392` / `289:7891` — Cook Jyoti, standard and pure veg. */
export const DEMO_COOK_JYOTI: CookViewModel = {
  id: 'demo-cook-jyoti',
  displayName: 'Cook Jyoti',
  firstName: 'Jyoti',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'Odisha',
  languages: ['Hindi', 'Odiya'],
  specialties: dishes(
    ['Chicken curry', 'poultryLeg'],
    ['Mutton masala', 'meat'],
    ['Keema variants', 'meat'],
    ['Chicken biryani', 'poultryLeg'],
    ['Egg masala curry', 'eggs'],
    ['Litti chokha', 'zucchini'],
    ['Samosa', 'samosa'],
    ['Aloo tikki chaat', 'potato'],
    ['Namakpara/nimki', 'nachos'],
  ),
  pureVegSpecialties: dishes(
    ['Matar paneer', 'sugarCubes'],
    ['Shahi paneer', 'sugarCubes'],
    ['Dry fry/ tadka', 'soupPlate'],
    ['Kheer/ sewai', 'riceBowl'],
    ['Paratha variants', 'naan'],
    ['Litti chokha', 'zucchini'],
    ['Samosa', 'samosa'],
    ['Aloo tikki chaat', 'potato'],
    ['Namakpara/ nimki', 'nachos'],
  ),
  badges: ALL_BADGES,
};

/** `299:2255` / `289:7642` — Cook Sanchita, standard and pure veg. */
export const DEMO_COOK_SANCHITA: CookViewModel = {
  id: 'demo-cook-sanchita-full',
  displayName: 'Cook Sanchita',
  firstName: 'Sanchita',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'West Bengal',
  specialties: dishes(
    ['Chicken curries', 'poultryLeg'],
    ['Mutton masala', 'meat'],
    ['Mustard fish', 'fish'],
    ['Egg/ paneer bhurji', 'sugarCubes'],
    ['Egg masala curry', 'eggs'],
    ['Palak paneer', 'sugarCubes'],
    ['Chicken tandoori', 'poultryLeg'],
    ['Chola bhatura', 'naan'],
    ['Momo variants', 'dimSum'],
  ),
  pureVegSpecialties: dishes(
    ['Veg biryani', 'carrot'],
    ['Parathe', 'potato'],
    ['Chola bhatura', 'naan'],
    ['Mixed veg', 'broccoli'],
    ['Palak paneer', 'sugarCubes'],
    ['Litti chokha', 'zucchini'],
    ['Gobi manchurian', 'broccoli'],
    ['Arbi tuk', 'potato'],
    ['Momo variants', 'dimSum'],
  ),
  badges: ALL_BADGES,
};

/** `289:7266` / `289:7767` — Cook Barsha, standard and pure veg. */
export const DEMO_COOK_BARSHA: CookViewModel = {
  id: 'demo-cook-barsha',
  displayName: 'Cook Barsha',
  firstName: 'Barsha',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'West Bengal',
  // `299:1811` draws the language glyph with no label on this card too.
  specialties: dishes(
    ['Butter Chicken', 'poultryLeg'],
    ['Fish fry', 'fish'],
    ['Mustard fish', 'fish'],
    ['Mutton curry', 'meat'],
    ['Baigan bharta', 'zucchini'],
    ['Pav bhaji', 'beefBurger'],
    ['Paneer tikka', 'sugarCubes'],
    ['Noodles', 'noodles'],
    ['Chilli paneer', 'sugarCubes'],
  ),
  pureVegSpecialties: dishes(
    ['Baigan bharta', 'zucchini'],
    ['Palak paneer', 'sugarCubes'],
    ['Dal tadka', 'soupPlate'],
    ['Gobhi capsicum', 'broccoli'],
    ['Butter Paneer', 'sugarCubes'],
    ['Bhindi masala', 'okra'],
    ['Paneer tikka', 'sugarCubes'],
    ['Pav bhaji', 'beefBurger'],
    ['Puri aloo sabzi', 'potato'],
  ),
  badges: ALL_BADGES,
};

/** All eight finalized Cook-profile frames, in section order. */
export const DEMO_COOK_PROFILES = [
  { cook: DEMO_COOK_JYOTI, variant: 'standard', node: '289:7392' },
  { cook: DEMO_COOK_REKHA, variant: 'standard', node: '289:8388' },
  { cook: DEMO_COOK_SANCHITA, variant: 'standard', node: '299:2255' },
  { cook: DEMO_COOK_BARSHA, variant: 'standard', node: '289:7266' },
  { cook: DEMO_COOK_JYOTI, variant: 'pureVeg', node: '289:7891' },
  { cook: DEMO_COOK_REKHA, variant: 'pureVeg', node: '289:8263' },
  { cook: DEMO_COOK_SANCHITA, variant: 'pureVeg', node: '289:7642' },
  { cook: DEMO_COOK_BARSHA, variant: 'pureVeg', node: '289:7767' },
] as const;

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
