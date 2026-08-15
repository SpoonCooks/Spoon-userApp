import type { ImageSourcePropType } from 'react-native';

/**
 * The dish-glyph catalogue — Figma "Food icons" (`94:905`), sliced at the node coordinates the
 * frame publishes and exported at 4× into `assets/figma/dishes/`.
 *
 * WHY A CATALOGUE (task §10). The specialty circles used to render EMPTY whenever the payload
 * carried no `glyphUrl`, which is every case today, so the cook card shipped with nine blank
 * discs. The set is 25 bespoke filled marks that no icon library reproduces, and they are static
 * design assets — so they are bundled once, here, and addressed by a PRESENTATION KEY.
 *
 * WHAT THIS IS NOT. It is not a dish taxonomy and it does not decide which glyph a dish gets.
 * The key is chosen by whoever supplies the data — the fixtures today, the backend later — and
 * this module only resolves a key to an image. There is no label matching, no keyword heuristic
 * and no eligibility rule in the UI: `SpecialtyGrid` renders the specialties it is handed
 * (task §10, §17). When the server starts sending dish IDs, the mapping from an ID to one of
 * these keys belongs on the server or in the data layer, not in a component.
 *
 * The `1:729`-style precedent applies: a REMOTE `glyphUrl` still wins, so a per-cook glyph from
 * the backend overrides the bundled catalogue without a client change.
 */

export type DishGlyphKey =
  | 'bananaSplit'
  | 'beefBurger'
  | 'broccoli'
  | 'cauliflower'
  | 'coffeeBeans'
  | 'cucumber'
  | 'dimSum'
  | 'eggs'
  | 'fish'
  | 'meat'
  | 'mushroom'
  | 'naan'
  | 'nachos'
  | 'noodles'
  | 'onion'
  | 'peas'
  | 'potato'
  | 'poultryLeg'
  | 'riceBowl'
  | 'samosa'
  | 'soupPlate'
  | 'sugarCubes'
  | 'tomato'
  | 'wheat'
  | 'zucchini';

/** Every mark in `94:905`, by its Figma layer name. */
export const DISH_GLYPHS: Record<DishGlyphKey, ImageSourcePropType> = {
  bananaSplit: require('../../../assets/figma/dishes/banana-split.png') as ImageSourcePropType,
  beefBurger: require('../../../assets/figma/dishes/beef-burger.png') as ImageSourcePropType,
  broccoli: require('../../../assets/figma/dishes/broccoli.png') as ImageSourcePropType,
  cauliflower: require('../../../assets/figma/dishes/cauliflower.png') as ImageSourcePropType,
  coffeeBeans: require('../../../assets/figma/dishes/coffee-beans.png') as ImageSourcePropType,
  cucumber: require('../../../assets/figma/dishes/cucumber.png') as ImageSourcePropType,
  dimSum: require('../../../assets/figma/dishes/dim-sum.png') as ImageSourcePropType,
  eggs: require('../../../assets/figma/dishes/eggs.png') as ImageSourcePropType,
  fish: require('../../../assets/figma/dishes/fish.png') as ImageSourcePropType,
  meat: require('../../../assets/figma/dishes/meat.png') as ImageSourcePropType,
  mushroom: require('../../../assets/figma/dishes/mushroom.png') as ImageSourcePropType,
  naan: require('../../../assets/figma/dishes/naan.png') as ImageSourcePropType,
  nachos: require('../../../assets/figma/dishes/nachos.png') as ImageSourcePropType,
  noodles: require('../../../assets/figma/dishes/noodles.png') as ImageSourcePropType,
  onion: require('../../../assets/figma/dishes/onion.png') as ImageSourcePropType,
  peas: require('../../../assets/figma/dishes/peas.png') as ImageSourcePropType,
  potato: require('../../../assets/figma/dishes/potato.png') as ImageSourcePropType,
  poultryLeg: require('../../../assets/figma/dishes/poultry-leg.png') as ImageSourcePropType,
  riceBowl: require('../../../assets/figma/dishes/rice-bowl.png') as ImageSourcePropType,
  samosa: require('../../../assets/figma/dishes/samosa.png') as ImageSourcePropType,
  soupPlate: require('../../../assets/figma/dishes/soup-plate.png') as ImageSourcePropType,
  sugarCubes: require('../../../assets/figma/dishes/sugar-cubes.png') as ImageSourcePropType,
  tomato: require('../../../assets/figma/dishes/tomato.png') as ImageSourcePropType,
  wheat: require('../../../assets/figma/dishes/wheat.png') as ImageSourcePropType,
  zucchini: require('../../../assets/figma/dishes/zucchini.png') as ImageSourcePropType,
};

/**
 * `94:954` draws its mark at 26 inside the 31pt disc. `94:961` is the one exception — the Fish
 * Food mark is drawn at 28 — so the box is per glyph rather than a single constant.
 */
export const DISH_GLYPH_BOX = 26;

const OVERSIZED: Partial<Record<DishGlyphKey, number>> = { fish: 28 };

export function dishGlyphBox(key: DishGlyphKey): number {
  return OVERSIZED[key] ?? DISH_GLYPH_BOX;
}
