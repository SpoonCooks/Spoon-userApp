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
  | 'carrot'
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
  | 'okra'
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
  bananaSplit: require('../../../assets/figma/dishes/banana-split.webp') as ImageSourcePropType,
  beefBurger: require('../../../assets/figma/dishes/beef-burger.webp') as ImageSourcePropType,
  broccoli: require('../../../assets/figma/dishes/broccoli.webp') as ImageSourcePropType,
  carrot: require('../../../assets/figma/dishes/carrot.webp') as ImageSourcePropType,
  cauliflower: require('../../../assets/figma/dishes/cauliflower.webp') as ImageSourcePropType,
  coffeeBeans: require('../../../assets/figma/dishes/coffee-beans.webp') as ImageSourcePropType,
  cucumber: require('../../../assets/figma/dishes/cucumber.webp') as ImageSourcePropType,
  dimSum: require('../../../assets/figma/dishes/dim-sum.webp') as ImageSourcePropType,
  eggs: require('../../../assets/figma/dishes/eggs.webp') as ImageSourcePropType,
  fish: require('../../../assets/figma/dishes/fish.webp') as ImageSourcePropType,
  meat: require('../../../assets/figma/dishes/meat.webp') as ImageSourcePropType,
  mushroom: require('../../../assets/figma/dishes/mushroom.webp') as ImageSourcePropType,
  naan: require('../../../assets/figma/dishes/naan.webp') as ImageSourcePropType,
  nachos: require('../../../assets/figma/dishes/nachos.webp') as ImageSourcePropType,
  noodles: require('../../../assets/figma/dishes/noodles.webp') as ImageSourcePropType,
  /**
   * `87:324` "Bhindi masala" — the ONE dish mark the file draws as inline vector paths inside its
   * disc rather than as an image fill, so it is extracted from that group and bundled like the
   * rest. Without it the cell renders an empty circle.
   */
  okra: require('../../../assets/figma/dishes/okra.webp') as ImageSourcePropType,
  onion: require('../../../assets/figma/dishes/onion.webp') as ImageSourcePropType,
  peas: require('../../../assets/figma/dishes/peas.webp') as ImageSourcePropType,
  potato: require('../../../assets/figma/dishes/potato.webp') as ImageSourcePropType,
  poultryLeg: require('../../../assets/figma/dishes/poultry-leg.webp') as ImageSourcePropType,
  riceBowl: require('../../../assets/figma/dishes/rice-bowl.webp') as ImageSourcePropType,
  samosa: require('../../../assets/figma/dishes/samosa.webp') as ImageSourcePropType,
  soupPlate: require('../../../assets/figma/dishes/soup-plate.webp') as ImageSourcePropType,
  sugarCubes: require('../../../assets/figma/dishes/sugar-cubes.webp') as ImageSourcePropType,
  tomato: require('../../../assets/figma/dishes/tomato.webp') as ImageSourcePropType,
  wheat: require('../../../assets/figma/dishes/wheat.webp') as ImageSourcePropType,
  zucchini: require('../../../assets/figma/dishes/zucchini.webp') as ImageSourcePropType,
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
