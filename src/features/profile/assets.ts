import type { ImageSourcePropType } from 'react-native';

/**
 * Profile artwork exported from the V8 file `UO7Xs2bfR99Xc8lQEBIZhD`.
 */

/**
 * `408:1382` — the 15pt remove control on a selected `341:4655` chip.
 *
 * A FILLED `#E2FF68` disc (r 7) carrying a black-at-70 % cross, lifted by its own drop shadow.
 * Feather's `x-circle` is a stroked ring with no fill and no lift, so it is not the same mark:
 * the node is exported instead (task §6, and the same call `AUTH_EDIT_PHONE` already makes).
 * Exported at 4× — 64px for a 15pt box — matching `icons/back.png`'s 129px for 32pt.
 */
export const PROFILE_CHIP_REMOVE =
  require('../../../assets/figma/profile/chip-remove.png') as ImageSourcePropType;

/**
 * `222:1582` — the 15 × 32 exclamation mark on the INCOMPLETE completion card (`222:1570`).
 *
 * A filled two-tone glyph, not a Feather `alert-circle`: the node is a cropped raster
 * (`w 213.33% / left −56.67%`), so the NODE is exported with its crop baked in rather than the
 * source image re-cropped in code. Exported at 4× — 60 × 127 for a 15 × 32 box.
 *
 * NOTE: `assets/figma/profile/incomplete-badge.png` is a tracked 60 × 128 export of this same
 * node from the V7 pass, left unreferenced when the card was removed. It is deliberately not
 * reused: this export is taken from the V8 file, which is the source of truth, and the stale one
 * is left alone rather than deleted (task §0 — preserve existing work).
 */
export const PROFILE_INCOMPLETE_MARK =
  require('../../../assets/figma/profile/incomplete-mark.png') as ImageSourcePropType;
