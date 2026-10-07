import type { ImageSourcePropType } from 'react-native';

/**
 * Artwork for the Live booking calendar, exported from Figma `cCQlzTeiObQkpVBzwI8mZi`
 * page `1005:131` at 4× and stored as lossless WebP. Each constant is drawn at the node's pt size.
 */

/**
 * `1461:6325` — the Up-next banner's moon glow, crescent, stars and dots as ONE transparent
 * 370 × 102 image, composited from the backdrop's own SVG parts at their frame positions. The sky
 * gradient under it is drawn in RN.
 */
export const UP_NEXT_BACKDROP =
  require('../../../../../assets/figma/recurring/calendar/up-next-backdrop.webp') as ImageSourcePropType;

/**
 * `1461:6351` — the banner's 56pt cook photo with its lime ring, at its 57pt bounds; transparent
 * outside the ring (the node render, masked by the node's own round image fill).
 */
export const UP_NEXT_COOK_PHOTO =
  require('../../../../../assets/figma/recurring/calendar/up-next-cook-photo.webp') as ImageSourcePropType;

/** `167:23` — Icon/Chevron right, drawn at 20pt in the banner's Go disc and every visit row. */
export const CALENDAR_CHEVRON_RIGHT =
  require('../../../../../assets/figma/recurring/calendar/chevron-right.webp') as ImageSourcePropType;

/** `1346:455` — Icon/Touch, the 24pt hand beside the hint. */
export const CALENDAR_TOUCH_GLYPH =
  require('../../../../../assets/figma/recurring/calendar/touch.webp') as ImageSourcePropType;

/** `1005:176` — the 12pt knot at the end of the progress thread. */
export const PROGRESS_KNOT =
  require('../../../../../assets/figma/recurring/calendar/progress-knot.webp') as ImageSourcePropType;

/**
 * `1005:311` — the pale yellow "Thread" swoosh at the foot of the screen, transparent, at its
 * full stroke-bleed box: 430 × 54.05.
 */
export const CALENDAR_THREAD =
  require('../../../../../assets/figma/recurring/calendar/thread.webp') as ImageSourcePropType;

/** `1005:182` / `1005:185` / `1005:188` — the 10pt legend dots. */
export const LEGEND_PAST =
  require('../../../../../assets/figma/recurring/calendar/legend-past.webp') as ImageSourcePropType;
export const LEGEND_TODAY =
  require('../../../../../assets/figma/recurring/calendar/legend-today.webp') as ImageSourcePropType;
export const LEGEND_UPCOMING =
  require('../../../../../assets/figma/recurring/calendar/legend-upcoming.webp') as ImageSourcePropType;

/** `543:2344` — Done_round, the 20pt tick on a completed visit's lime disc. */
export const VISIT_DONE_GLYPH =
  require('../../../../../assets/figma/recurring/calendar/done.webp') as ImageSourcePropType;

/** `43:67` — Icon/Close, the 18pt cross on a cancelled visit's disc. */
export const VISIT_CANCELLED_GLYPH =
  require('../../../../../assets/figma/recurring/calendar/close.webp') as ImageSourcePropType;

/** `558:170` — Cook/ Visit, the 20pt cook glyph inside an unassigned visit's dashed ring. */
export const VISIT_PENDING_GLYPH =
  require('../../../../../assets/figma/recurring/calendar/cook-visit.webp') as ImageSourcePropType;

/**
 * `1354:1845` / `1354:1846` / `1354:1847` — the three 24pt pool-cook photos of `1354:1844`, each
 * transparent outside its circle so they overlap cleanly on any card.
 */
export const POOL_COOK_PHOTOS: readonly ImageSourcePropType[] = [
  require('../../../../../assets/figma/recurring/calendar/pool-cook-1.webp') as ImageSourcePropType,
  require('../../../../../assets/figma/recurring/calendar/pool-cook-2.webp') as ImageSourcePropType,
  require('../../../../../assets/figma/recurring/calendar/pool-cook-3.webp') as ImageSourcePropType,
];
