import type { ImageSourcePropType } from 'react-native';

/**
 * Artwork for the taste-profile wizard (Figma `cCQlzTeiObQkpVBzwI8mZi` page `1405:448`),
 * rasterised at 3× from each layer's own SVG into `assets/figma/food-profile/`. The back chevron is
 * the address flow's, the same `43:63` glyph.
 */
const img = (source: unknown) => source as ImageSourcePropType;

export const FOOD_PROFILE_ART = {
  chevronLeft: img(require('../../../assets/figma/address-v2/icon-chevron-left.png')),
  bowlDone: img(require('../../../assets/figma/food-profile/bowl-done.png')),
  bowlCurrent: img(require('../../../assets/figma/food-profile/bowl-current.png')),
  bowlPending: img(require('../../../assets/figma/food-profile/bowl-pending.png')),
  dish: img(require('../../../assets/figma/food-profile/icon-dish.png')),
  profile: img(require('../../../assets/figma/food-profile/icon-profile.png')),
  time: img(require('../../../assets/figma/food-profile/icon-time.png')),
  taste: img(require('../../../assets/figma/food-profile/icon-taste.png')),
  vegetable: img(require('../../../assets/figma/food-profile/icon-vegetable.png')),
  cookingPot: img(require('../../../assets/figma/food-profile/icon-cooking-pot.png')),
  cookAssigned: img(require('../../../assets/figma/food-profile/icon-cook-assigned.png')),
  onTheWay: img(require('../../../assets/figma/food-profile/icon-on-the-way.png')),
  apartment: img(require('../../../assets/figma/food-profile/icon-apartment.png')),
  friends: img(require('../../../assets/figma/food-profile/icon-friends.png')),
  search: img(require('../../../assets/figma/food-profile/icon-search.png')),
  stepperMinus: img(require('../../../assets/figma/food-profile/stepper-minus.png')),
  stepperPlus: img(require('../../../assets/figma/food-profile/stepper-plus.png')),
  markVeg: img(require('../../../assets/figma/food-profile/mark-veg.png')),
  markEgg: img(require('../../../assets/figma/food-profile/mark-egg.png')),
  markNonVeg: img(require('../../../assets/figma/food-profile/mark-nonveg.png')),
  dietJain: img(require('../../../assets/figma/food-profile/diet-jain.png')),
  dietVegan: img(require('../../../assets/figma/food-profile/diet-vegan.png')),
  genderFemale: img(require('../../../assets/figma/food-profile/gender-female.png')),
  genderMale: img(require('../../../assets/figma/food-profile/gender-male.png')),
  regionNorth: img(require('../../../assets/figma/food-profile/region-north.png')),
  regionSouth: img(require('../../../assets/figma/food-profile/region-south.png')),
  tileCheck: img(require('../../../assets/figma/food-profile/tile-check.png')),
  chipCheck: img(require('../../../assets/figma/food-profile/chip-check.png')),
  checkboxCheck: img(require('../../../assets/figma/food-profile/checkbox-check.png')),
  chipRemove: img(require('../../../assets/figma/food-profile/chip-remove.png')),
  dropNone: img(require('../../../assets/figma/food-profile/drop-none.png')),
  dropLight: img(require('../../../assets/figma/food-profile/drop-light.png')),
  dropModerate: img(require('../../../assets/figma/food-profile/drop-moderate.png')),
};

export type FoodProfileArtKey = keyof typeof FOOD_PROFILE_ART;
