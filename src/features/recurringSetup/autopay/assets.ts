import type { ImageSourcePropType } from 'react-native';

/**
 * Glyphs for the UPI Autopay sheets — Figma `cCQlzTeiObQkpVBzwI8mZi`, page "Recurring: booking
 * creation", frames `2316:3558` … `2317:4009`. Exported from each icon instance at 4× on a
 * transparent canvas and stored as lossless WebP, like the Visit details sheets' art.
 */

/** `2316:3583` — the 22pt `Icon/Recurring` in the plan summary's yellow well. */
export const AUTOPAY_RECURRING_GLYPH =
  require('../../../../assets/figma/recurring/autopay/recurring.webp') as ImageSourcePropType;

/** `2316:3599` — the 20pt `Icon/Chevron right` at 60 % black, on every app row. */
export const AUTOPAY_CHEVRON_GLYPH =
  require('../../../../assets/figma/recurring/autopay/chevron-right.webp') as ImageSourcePropType;

/** `2316:3623` — the 14pt `Icon/Lock` at 60 % black, before "Secured by UPI Autopay". */
export const AUTOPAY_LOCK_GLYPH =
  require('../../../../assets/figma/recurring/autopay/lock.webp') as ImageSourcePropType;

/** `2317:3652` — `Icon/Time`, 32pt in the status well and 14pt in the expiry chip (`2317:3658`). */
export const AUTOPAY_TIME_GLYPH =
  require('../../../../assets/figma/recurring/autopay/time.webp') as ImageSourcePropType;

/** `2317:3742` — the 32pt `Icon/Exclamation` (Left without approving; No UPI app found). */
export const AUTOPAY_EXCLAMATION_GLYPH =
  require('../../../../assets/figma/recurring/autopay/exclamation.webp') as ImageSourcePropType;

/** `2317:3828` — the 32pt `Icon/Close` in `color/status/negative` (Didn't go through). */
export const AUTOPAY_CLOSE_GLYPH =
  require('../../../../assets/figma/recurring/autopay/close-negative.webp') as ImageSourcePropType;

/** `2317:4084` — the 32pt `Icon/Check` (Autopay is on). */
export const AUTOPAY_CHECK_GLYPH =
  require('../../../../assets/figma/recurring/autopay/check.webp') as ImageSourcePropType;
