import type { ImageSourcePropType } from 'react-native';

/**
 * Artwork shared across the recurring live booking screens, exported from Figma
 * `cCQlzTeiObQkpVBzwI8mZi` page `1005:131` at 4×. Group-specific artwork lives beside its own
 * components.
 */

/** `43:63` — the 24pt bare chevron in the recurring headers' 40pt back hit area. */
export const RECURRING_BACK_GLYPH =
  require('../../../assets/figma/recurring/shared/chevron-left.webp') as ImageSourcePropType;

/** `543:2323` — the 24pt "Trash Simple" glyph on the Manage plans tab. */
export const RECURRING_DELETE_GLYPH =
  require('../../../assets/figma/recurring/shared/trash.webp') as ImageSourcePropType;
