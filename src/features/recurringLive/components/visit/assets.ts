import type { ImageSourcePropType } from 'react-native';

/**
 * Visit details artwork from Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`, stored as lossless 4×
 * WebP. Vector art is rasterised from each node's own SVG export (the box the design draws, padding
 * included) on a TRANSPARENT ground — Figma's PNG export bakes in whatever sits behind a node. Photos
 * are the raw image fills, clipped by the views that draw them.
 */

// --- Status banner ------------------------------------------------------------------------------
/** `1461:6150` — the morning sky (halo 3, halo 2, sun, two clouds) composed from its parts' SVGs at their frame positions into one transparent 370×104 plate; RN draws the gradient behind it. */
export const VISIT_SKY_MORNING =
  require('../../../../../assets/figma/recurring/visit/sky-morning.webp') as ImageSourcePropType;
/** `1444:464` — the afternoon sky (glow, rays, sun, sun rim), composed the same way, 370×104. */
export const VISIT_SKY_AFTERNOON =
  require('../../../../../assets/figma/recurring/visit/sky-afternoon.webp') as ImageSourcePropType;
/** `1461:6168` — the 36pt white "confirmed" tick disc. */
export const VISIT_BADGE_CONFIRMED =
  require('../../../../../assets/figma/recurring/visit/badge-confirmed.webp') as ImageSourcePropType;
/** `1461:6237` — the 36pt dashed "cancelled" cross. */
export const VISIT_BADGE_CANCELLED =
  require('../../../../../assets/figma/recurring/visit/badge-cancelled.webp') as ImageSourcePropType;

// --- Cook details · assigned --------------------------------------------------------------------
/** `1463:7961` — the 20pt bell (2pt stroke). */
export const VISIT_BELL_ASSIGNED =
  require('../../../../../assets/figma/recurring/visit/bell-assigned.webp') as ImageSourcePropType;
/** `1463:7964` — the 20pt phone on the Call button. */
export const VISIT_CALL_GLYPH =
  require('../../../../../assets/figma/recurring/visit/call.webp') as ImageSourcePropType;
/** `1380:3206` — the cook photo, the RAW image fill; drawn `contain` on a `#FFF7CC` 120pt tile clipped to 16pt corners in RN. */
export const VISIT_COOK_PHOTO =
  require('../../../../../assets/figma/recurring/visit/cook-photo.webp') as ImageSourcePropType;
/** `1380:3071` — the yellow band's fixed curve, 370×35 (stretches with the card). */
export const VISIT_BAND_CURVE =
  require('../../../../../assets/figma/recurring/visit/band-curve.webp') as ImageSourcePropType;
/** `848:7801` — the dish photo, the RAW image fill (drawn `contain` in a 120pt box). */
export const VISIT_DISH_PHOTO =
  require('../../../../../assets/figma/recurring/visit/dish-thali.webp') as ImageSourcePropType;
/** `848:7803` — the 13×12 favourite heart over the dish photo. */
export const VISIT_DISH_FAVORITE =
  require('../../../../../assets/figma/recurring/visit/favorite.webp') as ImageSourcePropType;
/** `855:129` — the yellow star, rasterised at the 12pt it's drawn. */
export const VISIT_STAR =
  require('../../../../../assets/figma/recurring/visit/star.webp') as ImageSourcePropType;
/** `1463:7971` — the 16pt chevron on the "Scroll for full menu" pill; drawn rotated 90° as in the frame. */
export const VISIT_CHEVRON_16 =
  require('../../../../../assets/figma/recurring/visit/chevron-right-16.webp') as ImageSourcePropType;

// --- Cook details · pending ---------------------------------------------------------------------
/** `1466:700` — the 20pt bell. */
export const VISIT_BELL_PENDING =
  require('../../../../../assets/figma/recurring/visit/bell-pending.webp') as ImageSourcePropType;
/** `1466:721` — the yellow thread the pool hangs on, 344×16.04 (its stroke-inclusive box). */
export const VISIT_POOL_THREAD =
  require('../../../../../assets/figma/recurring/visit/pool-thread.webp') as ImageSourcePropType;
/** `1466:710` / `1466:714` / `1466:718` — the 64pt pool photos with their inside 3pt yellow ring; the square render is clipped to a circle in RN. */
export const VISIT_POOL_SANCHITA =
  require('../../../../../assets/figma/recurring/visit/pool-sanchita.webp') as ImageSourcePropType;
export const VISIT_POOL_JYOTI =
  require('../../../../../assets/figma/recurring/visit/pool-jyoti.webp') as ImageSourcePropType;
export const VISIT_POOL_REKHA =
  require('../../../../../assets/figma/recurring/visit/pool-rekha.webp') as ImageSourcePropType;
/** `1466:724` — the 18pt chevron on "View Cook Pool". */
export const VISIT_CHEVRON_18 =
  require('../../../../../assets/figma/recurring/visit/chevron-right-18.webp') as ImageSourcePropType;

// --- Cook details · cancelled -------------------------------------------------------------------
/** `547:2537` — the 24pt calendar-with-cross. */
export const VISIT_CALENDAR_CLOSE =
  require('../../../../../assets/figma/recurring/visit/calendar-close.webp') as ImageSourcePropType;
/** `1466:735` — the solid yellow half of the snipped thread, 156×10.93. */
export const VISIT_THREAD_SNIPPED_LEFT =
  require('../../../../../assets/figma/recurring/visit/thread-snipped-left.webp') as ImageSourcePropType;
/** `1466:736` — the dotted grey half, 154×8.92. */
export const VISIT_THREAD_SNIPPED_RIGHT =
  require('../../../../../assets/figma/recurring/visit/thread-snipped-right.webp') as ImageSourcePropType;
/** `1466:738` — the 14pt cross in the snip's well. */
export const VISIT_CLOSE_14 =
  require('../../../../../assets/figma/recurring/visit/close-14.webp') as ImageSourcePropType;
/** `1466:750` — the 20pt chevron on "Your plan continues". */
export const VISIT_CHEVRON_20 =
  require('../../../../../assets/figma/recurring/visit/chevron-right-20.webp') as ImageSourcePropType;

// --- Payment ------------------------------------------------------------------------------------
/** `819:115` (as instanced in `1468:809`) — the 24pt money glyph in the refund header. */
export const VISIT_MONEY_24 =
  require('../../../../../assets/figma/recurring/visit/money-24.webp') as ImageSourcePropType;
/** `I1444:738;1444:725` — the 24pt money glyph on "Payment details". */
export const VISIT_MONEY_DOCK =
  require('../../../../../assets/figma/recurring/visit/money-dock.webp') as ImageSourcePropType;
/** `1374:1418` — the 20pt money glyph on "Pay per visit". */
export const VISIT_MONEY_20 =
  require('../../../../../assets/figma/recurring/visit/money-20.webp') as ImageSourcePropType;
/** `1374:1414` — the visit charge's vertical stitch, 2×56. */
export const VISIT_STITCH_VERTICAL =
  require('../../../../../assets/figma/recurring/visit/stitch-vertical.webp') as ImageSourcePropType;
/** `1468:828` — the refund breakdown's horizontal stitch, 306×2. */
export const VISIT_STITCH_HORIZONTAL =
  require('../../../../../assets/figma/recurring/visit/stitch-horizontal.webp') as ImageSourcePropType;
/** `1468:845` — the 20pt lime timeline node. */
export const VISIT_REFUND_NODE =
  require('../../../../../assets/figma/recurring/visit/refund-node.webp') as ImageSourcePropType;

// --- Recipe share, prep checklist, dock ---------------------------------------------------------
/** `1390:448` — the 24pt dish bowl (recipe share and the all-set banner). */
export const VISIT_DISH_GLYPH =
  require('../../../../../assets/figma/recurring/visit/dish-icon.webp') as ImageSourcePropType;
/** `1454:7950` — the 20pt WhatsApp glyph on the Share pill. */
export const VISIT_WHATSAPP_20 =
  require('../../../../../assets/figma/recurring/visit/whatsapp-share.webp') as ImageSourcePropType;
/** `I1444:744;1444:725` (`Icon/WhatsApp`) — the dock's 24pt Help glyph. */
export const VISIT_WHATSAPP =
  require('../../../../../assets/figma/recurring/visit/whatsapp.webp') as ImageSourcePropType;
/** `497:2045` — the 24pt pencil on "Modify booking". */
export const VISIT_EDIT =
  require('../../../../../assets/figma/recurring/visit/edit.webp') as ImageSourcePropType;
/** `1421:444` / `1422:444` / `1429:444` — the three 24pt prep glyphs. */
export const VISIT_PREP_LOCK =
  require('../../../../../assets/figma/recurring/visit/prep-lock.webp') as ImageSourcePropType;
export const VISIT_PREP_TOMATO =
  require('../../../../../assets/figma/recurring/visit/prep-tomato.webp') as ImageSourcePropType;
export const VISIT_PREP_POT =
  require('../../../../../assets/figma/recurring/visit/prep-pot.webp') as ImageSourcePropType;
/** `1441:452` — the 24pt empty tick circle (Prep check · Unchecked). */
export const VISIT_PREP_CHECK_OFF =
  require('../../../../../assets/figma/recurring/visit/prep-check-off.webp') as ImageSourcePropType;
/** `1441:464` — the 24pt lime tick (Prep check · Checked). */
export const VISIT_PREP_CHECK_ON =
  require('../../../../../assets/figma/recurring/visit/prep-check-on.webp') as ImageSourcePropType;
