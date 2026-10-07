import type { ImageSourcePropType } from 'react-native';

import type { SummaryTileKey } from '../../data/summary';

/**
 * Summary ("Manage plans") artwork from Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`, as
 * lossless 4× WebP.
 *
 * Every glyph is rasterized from the design's own SVG on a TRANSPARENT ground (Figma's PNG exports
 * come back flattened onto whatever sits behind the node). Where an instance is drawn smaller than
 * its 24pt component, Figma scales the path but keeps the 2pt stroke, so those SVGs are rendered
 * at the instance size with the stroke held at 2pt — checked against the instance renders.
 */

/** `352:141` / `754:3564` — the 16pt plus in the plan / visit add buttons. */
export const SUMMARY_PLUS_GLYPH =
  require('../../../../../assets/figma/recurring/summary/plus.webp') as ImageSourcePropType;

/**
 * `357:329` / `357:330` — the active plan tab's 10pt concave feet: the design's own `#FFD600`
 * foot paths, transparent outside the curve.
 */
export const SUMMARY_TAB_FOOT_LEFT =
  require('../../../../../assets/figma/recurring/summary/tab-foot-left.webp') as ImageSourcePropType;
export const SUMMARY_TAB_FOOT_RIGHT =
  require('../../../../../assets/figma/recurring/summary/tab-foot-right.webp') as ImageSourcePropType;

/**
 * `497:2045` — "Edit_light", 24pt. `1067:2178` draws it 1pt high inside a 24pt clip; its 8 %
 * drop shadow measures as nothing on white and isn't reproduced.
 */
export const SUMMARY_EDIT_GLYPH =
  require('../../../../../assets/figma/recurring/summary/edit.webp') as ImageSourcePropType;

/** `543:2344` as placed at `1017:564` — "Done_round" at 20pt. */
export const SUMMARY_DONE_GLYPH =
  require('../../../../../assets/figma/recurring/summary/done.webp') as ImageSourcePropType;

/** `43:67` as placed at `1017:6225` — "Icon/Close" at 18pt. */
export const SUMMARY_CANCELLED_GLYPH =
  require('../../../../../assets/figma/recurring/summary/close.webp') as ImageSourcePropType;

/** `167:23` as placed at `1017:569` — "Icon/Chevron right" at 20pt. */
export const SUMMARY_CHEVRON_GLYPH =
  require('../../../../../assets/figma/recurring/summary/chevron-right.webp') as ImageSourcePropType;

/**
 * The "Booking details" photos (`1017:441`–`443`, `1017:6026`): each tile's top image fill (it
 * fully covers the lower one), resampled to 740px tall (4× the 185pt tile). The tile clips it to
 * its 8pt radius in RN; nothing is drawn over it.
 */
export const SUMMARY_TILE_ART: Readonly<Record<SummaryTileKey, ImageSourcePropType>> = {
  morning:
    require('../../../../../assets/figma/recurring/summary/tile-morning.webp') as ImageSourcePropType,
  evening:
    require('../../../../../assets/figma/recurring/summary/tile-evening.webp') as ImageSourcePropType,
  duration:
    require('../../../../../assets/figma/recurring/summary/tile-60-minutes.webp') as ImageSourcePropType,
  startTime:
    require('../../../../../assets/figma/recurring/summary/tile-start-time.webp') as ImageSourcePropType,
};
