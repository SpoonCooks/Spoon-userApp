import type { ImageSourcePropType } from 'react-native';

/**
 * Artwork for the Visit details sheets — Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`, frames
 * `1433:1537` (Modify booking) and `1434:1678` (Payment details). Rasterised at 4× from each
 * node's own SVG on a TRANSPARENT canvas (`svg2webp.sh`) and stored as lossless WebP — the PNG
 * node exports baked in whatever fill sat behind them.
 */

/** `1402:5643` / `1402:5649` — the 20pt `Icon/Close` in the 40pt header well. */
export const SHEET_CLOSE_GLYPH =
  require('../../../../../assets/figma/recurring/sheets/close.webp') as ImageSourcePropType;

/**
 * `1433:1658` — the yellow looped thread from "Now" to "Cancellation fee". The vector box is
 * 113 × 21 but its 2pt stroke spills 2pt on every side, so the export renders at **117 × 25**.
 */
export const SHEET_THREAD_LOOP =
  require('../../../../../assets/figma/recurring/sheets/thread-loop.webp') as ImageSourcePropType;

/** `1433:1657` — the dashed thread to "Visit". Renders at 114.67 × 2 (1pt stroke spill each end). */
export const SHEET_THREAD_DASHED =
  require('../../../../../assets/figma/recurring/sheets/thread-dashed.webp') as ImageSourcePropType;

/** `1433:1638` — the 20pt "Now" node: yellow disc, black ring and dot. */
export const SHEET_NODE_NOW =
  require('../../../../../assets/figma/recurring/sheets/node-now.webp') as ImageSourcePropType;

/** `1433:1644` — the 20pt "Cancellation fee" node: white disc, 1.5pt black ring, 12pt `Icon/Lock`. */
export const SHEET_NODE_FEE =
  require('../../../../../assets/figma/recurring/sheets/node-fee.webp') as ImageSourcePropType;

/** `1433:1653` — the 20pt hollow "Visit" node. */
export const SHEET_NODE_VISIT =
  require('../../../../../assets/figma/recurring/sheets/node-visit.webp') as ImageSourcePropType;

/** `1433:1666` — the 16pt `Icon/Recurring` beside the "other visits" note. */
export const SHEET_RECURRING_GLYPH =
  require('../../../../../assets/figma/recurring/sheets/recurring.webp') as ImageSourcePropType;

/** `1434:1803` — the 24pt `Icon/Money` in the 44pt mode-of-payment well. */
export const SHEET_MONEY_GLYPH =
  require('../../../../../assets/figma/recurring/sheets/money.webp') as ImageSourcePropType;

/** `1434:1811` — the 16pt `Icon/Chevron right` after "Manage". */
export const SHEET_CHEVRON_GLYPH =
  require('../../../../../assets/figma/recurring/sheets/chevron-right.webp') as ImageSourcePropType;

/** `1402:4985` — the 24pt `Icon/Bell` on the autopay reminder. */
export const SHEET_BELL_GLYPH =
  require('../../../../../assets/figma/recurring/sheets/bell.webp') as ImageSourcePropType;

/** `1434:1793` — the 338 × 2 dashed `Stitch` above the total. The thread's
 * round caps spill 1pt past each end (a 340pt SVG); the frame clips them, so the raster is cropped
 * to the frame's 338. */
export const SHEET_STITCH =
  require('../../../../../assets/figma/recurring/sheets/stitch.webp') as ImageSourcePropType;
