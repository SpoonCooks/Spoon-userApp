import { Image } from 'react-native';

import type { DishGlyphKey } from './dishGlyphs';
import type { DishViewModel } from '../types/viewModels';

/**
 * Bundled card content for the published V0 cook profiles, keyed by the backend's stable
 * `profileCode` — NEVER by display name, phone number or array position.
 *
 * ## Why this exists
 *
 * The eight audited cook-profile frames (`289:8515`) carry three kinds of content:
 *
 * 1. **Facts the backend owns and publishes** — name, gender, region, languages, cuisine,
 *    the three attested badges, the rating. Those arrive on `booking.cook` and are rendered
 *    from the payload; nothing here restates them.
 * 2. **The photograph.** The backend publishes `profileImageUrl` when a hosted image exists;
 *    for the V0 profiles it does not, and the frames' image is a bundled export. The backend
 *    therefore publishes the stable `profileCode`, and this module maps it to the bundled
 *    asset — the same shape `dishGlyphs.ts` uses for the chip marks.
 * 3. **The two designed dish-chip lists.** Every chip is paired with a specific mark by the
 *    design (`289:8515` names the glyph on every chip of all eight cards), and the veg and
 *    mixed lists are separately curated per cook — they overlap and neither is derivable
 *    from the other. That pairing is presentation, so it lives with the presentation assets.
 *
 * Which list is SHOWN is the backend's call: `booking.cook.profileVariant` (`veg` | `mixed`)
 * is derived server-side from the customer's stored dietary preference. This module never
 * chooses a variant and never filters — it only resolves content for the variant it is asked
 * for.
 *
 * ## What happens for a cook that is not in this registry
 *
 * `cookCardContentFor` returns `undefined` and every consumer degrades exactly as the card
 * was built to: initials instead of a photograph, and no specialty grid. No entry here is
 * ever matched by name, so a real cook with a hosted photo and server-sent content is never
 * overridden by bundled sample data.
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
 * `94:910` — the cook photograph the frames ship, exported at 4×.
 *
 * It is named for the CARD, not for any one cook: all eight frames in `289:8515`, and the
 * in-flow cards such as `300:2632`, place the SAME image fill at the same 89 × 133.5 crop,
 * so every published V0 profile carries it.
 */
export const COOK_CARD_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/rekha-sample.jpg') as number,
).uri;

/**
 * `337:4364` — the same photograph as a TRANSPARENT cut-out, which is what the Home
 * active-booking banner and the rating card place over their `#FFF7CC` panel. A photo with a
 * baked-in background there would paint a second, wrong ground inside the box.
 */
export const COOK_CARD_CUTOUT_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/rekha-cutout.png') as number,
).uri;

/**
 * Per-cook photographs, bundled at 512px WITH THEIR ALPHA CHANNEL.
 *
 * The `.jpg` versions these replace are why every card had a black box where the cook should be.
 * Figma's exports are transparent PNGs — `289:7269` places one over the photo panel's own yellow
 * fill, which is what shows through — and converting them to JPEG dropped the alpha, because JPEG
 * has no such channel. Every transparent pixel flattened to black, and the panel's yellow was
 * covered by a rectangle of it.
 *
 * So the format is the requirement here, not a preference: these must stay PNG. Re-exporting or
 * re-compressing them through any format without alpha reintroduces the same black box.
 *
 * All four onboarded cooks now have their own photograph. The cut-out used by the Home banner is
 * still the shared export — a separate gap, tracked on `COOK_CARD_CUTOUT_PHOTO`.
 */
const REKHA_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/rekha-card.png') as number,
).uri;
const SANCHITA_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/sanchita-card.png') as number,
).uri;
const BARSHA_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/barsha-card.png') as number,
).uri;
const JYOTI_PHOTO = Image.resolveAssetSource(
  require('../../../assets/figma/cook/jyoti-card.png') as number,
).uri;

export interface CookCardContent {
  /** The card photograph (`CookCard`, completion). */
  readonly photoUrl: string;
  /** The transparent cut-out (Home banner, rating card). */
  readonly cutoutPhotoUrl: string;
  /** The mixed-variant 3×3 chip list, glyphs as the frame names them. */
  readonly specialties: readonly DishViewModel[];
  /** The veg-variant 3×3 chip list. Separately curated; not a filter of the mixed list. */
  readonly pureVegSpecialties: readonly DishViewModel[];
}

/** `289:7392` / `289:7891` — Cook Jyoti, mixed and veg. */
const JYOTI: CookCardContent = {
  photoUrl: JYOTI_PHOTO,
  cutoutPhotoUrl: COOK_CARD_CUTOUT_PHOTO,
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
};

/** `289:8388` / `289:8263` — Cook Rekha, mixed and veg. */
const REKHA: CookCardContent = {
  photoUrl: REKHA_PHOTO,
  cutoutPhotoUrl: COOK_CARD_CUTOUT_PHOTO,
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
};

/** `299:2255` / `289:7642` — Cook Sanchita, mixed and veg. */
const SANCHITA: CookCardContent = {
  photoUrl: SANCHITA_PHOTO,
  cutoutPhotoUrl: COOK_CARD_CUTOUT_PHOTO,
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
};

/** `289:7266` / `289:7767` — Cook Barsha, mixed and veg. */
const BARSHA: CookCardContent = {
  photoUrl: BARSHA_PHOTO,
  cutoutPhotoUrl: COOK_CARD_CUTOUT_PHOTO,
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
};

/** The published V0 profiles. Adding a cook here requires their backend `profile_code`. */
const COOK_CARD_CONTENT: Readonly<Record<string, CookCardContent>> = {
  COOK_JYOTI: JYOTI,
  COOK_REKHA: REKHA,
  COOK_SANCHITA: SANCHITA,
  COOK_BARSHA: BARSHA,
};

export function cookCardContentFor(
  profileCode: string | null | undefined,
): CookCardContent | undefined {
  if (profileCode === null || profileCode === undefined) return undefined;
  return COOK_CARD_CONTENT[profileCode];
}
