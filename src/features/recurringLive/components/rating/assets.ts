import type { ImageSourcePropType } from 'react-native';

/**
 * Rate card + Tell us more artwork, from Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`.
 *
 * Each file is the named node exported as SVG, stripped of the ancestor fills Figma bakes into a
 * node export (the page canvas, the card, the chip / disc behind an icon), and rasterised at 4×
 * on a TRANSPARENT ground to lossless WebP. Every image is therefore its node's own box — render
 * it at the pt size noted beside it and nothing behind it shows through as a square.
 */

const art = {
  // --- Card chrome ----------------------------------------------------------------------------
  /** `1501:6632` — the 44pt cook photo: white disc, portrait, 2pt `#FFD600` ring. */
  cookPhoto: require('../../../../../assets/figma/recurring/rating/cook-photo.webp'),

  // --- 1 · Idle sticker (`1501:6638`) ---------------------------------------------------------
  /** `1501:6642` — 104pt `#FFF7CC` disc with the 2pt dashed 18 % rim. */
  idleRing: require('../../../../../assets/figma/recurring/rating/idle-ring.webp'),
  /** `1501:6656` — 14pt lime sparkle, top right. */
  idleSparkleLarge: require('../../../../../assets/figma/recurring/rating/idle-sparkle-large.webp'),
  /** `1501:6657` — 8pt sparkle, bottom left. */
  idleSparkleSmall: require('../../../../../assets/figma/recurring/rating/idle-sparkle-small.webp'),
  /** `1501:6694` — the 14pt black sparkle in the nudge's lime disc. */
  nudgeSparkle: require('../../../../../assets/figma/recurring/rating/nudge-sparkle.webp'),

  // --- Score stickers -------------------------------------------------------------------------
  /** `1501:6719` — 96pt `#FFD600` scallop (4–5). */
  scallopHigh: require('../../../../../assets/figma/recurring/rating/scallop-high.webp'),
  /** `1501:6742` — 12pt sparkle on the scallop. */
  sparkleHigh: require('../../../../../assets/figma/recurring/rating/sparkle-high.webp'),
  /** `1501:7062` — 104pt lime burst (5+). */
  burstTop: require('../../../../../assets/figma/recurring/rating/burst-top.webp'),
  /** `1501:7081` — 12pt sparkle on the 5+ burst. */
  sparkleTopLarge: require('../../../../../assets/figma/recurring/rating/sparkle-top-large.webp'),
  /** `1501:7092` — 8pt sparkle on the 5+ burst. */
  sparkleTopSmall: require('../../../../../assets/figma/recurring/rating/sparkle-top-small.webp'),
  /** `1501:6849` — the 370 × 226 confetti layer over the 5+ card. */
  confetti: require('../../../../../assets/figma/recurring/rating/confetti.webp'),
  /** `1501:7362` — the 3–3.5 blob, 87 × 72 export box. */
  blobBelowPar: require('../../../../../assets/figma/recurring/rating/blob-below-par.webp'),
  /** `1501:7508` — the 2–2.5 blob, 88 × 68. */
  blobDisappointing: require('../../../../../assets/figma/recurring/rating/blob-disappointing.webp'),
  /** `1501:7657` — the 1–1.5 blob, 78 × 68. */
  blobVeryPoor: require('../../../../../assets/figma/recurring/rating/blob-very-poor.webp'),

  // --- Stars (the 31 × 30 vector box inside each 42pt star frame; halves are the full 42) -----
  /** `1501:6767` — filled `#FFD600`. Identical on every tier. */
  starFull: require('../../../../../assets/figma/recurring/rating/star-full.webp'),
  /** `1501:6662` — empty `#F1EEE3`, idle and 4–5. */
  starEmptyHigh: require('../../../../../assets/figma/recurring/rating/star-empty-high.webp'),
  /** `1501:7424` — empty `#F9F5E1`, 1–3.5. */
  starEmptyLow: require('../../../../../assets/figma/recurring/rating/star-empty-low.webp'),
  /** `1501:6799` — half, over `#F1EEE3`. */
  starHalfHigh: require('../../../../../assets/figma/recurring/rating/star-half-high.webp'),
  /** `1501:7414` — half, over `#F9F5E1`. */
  starHalfLow: require('../../../../../assets/figma/recurring/rating/star-half-low.webp'),

  // --- 5+ button bursts (55 × 56; the active one 57 × 56 for its outside stroke) ---------------
  /** `1501:6683` — idle: solid `#CFFF04`. */
  plusBurstIdle: require('../../../../../assets/figma/recurring/rating/plus-burst-idle.webp'),
  /** `1501:6805` — a numeric score is picked: `#CFFF04` at 55 %. */
  plusBurstMuted: require('../../../../../assets/figma/recurring/rating/plus-burst-muted.webp'),
  /** `1501:7160` — 5+ picked: `#CFFF04` with a 2pt black outline. */
  plusBurstActive: require('../../../../../assets/figma/recurring/rating/plus-burst-active.webp'),

  // --- Icons ----------------------------------------------------------------------------------
  /** `1501:6811` — 18pt chip check (1.65pt stroke). */
  check: require('../../../../../assets/figma/recurring/rating/check.webp'),
  /** `1501:6830` — 24pt `Icon/Mic`. */
  mic: require('../../../../../assets/figma/recurring/rating/mic.webp'),
  /** `1502:716` — 24pt `Icon/Camera`. */
  camera: require('../../../../../assets/figma/recurring/rating/camera.webp'),
  /** `1504:716` — 24pt `Icon/Video`. */
  video: require('../../../../../assets/figma/recurring/rating/video.webp'),
  /** `543:2337` — 24pt `Interface / Restart`. */
  restart: require('../../../../../assets/figma/recurring/rating/restart.webp'),
  /** `543:2363` — 24pt `Call/ phone`. */
  phone: require('../../../../../assets/figma/recurring/rating/phone.webp'),
  /** `1501:7477` — 44 × 26 `Toggle/Off`. */
  toggleOff: require('../../../../../assets/figma/recurring/rating/toggle-off.webp'),
  /** `1501:7626` — 44 × 26 `Toggle/On`. */
  toggleOn: require('../../../../../assets/figma/recurring/rating/toggle-on.webp'),

  // --- Tell us more ---------------------------------------------------------------------------
  /** `1501:7210` — 24pt `Icon/Close` (header well and Discard). */
  close: require('../../../../../assets/figma/recurring/rating/close.webp'),
  /** `1501:7214` — the 8pt red live dot. */
  liveDot: require('../../../../../assets/figma/recurring/rating/live-dot.webp'),
  /** `1501:7265` — 24pt `Icon/Check` on Save. */
  saveCheck: require('../../../../../assets/figma/recurring/rating/save-check.webp'),
  /** `1501:7273` — 24pt `Icon/Play` on the voice note. */
  voicePlay: require('../../../../../assets/figma/recurring/rating/voice-play.webp'),
  /** `1501:7309` — 24pt `Icon/Dish`, white at 50 %, on the photo thumbnails. */
  dish: require('../../../../../assets/figma/recurring/rating/dish.webp'),
  /** `1517:9308` — 20pt white `Icon/Close` on a thumbnail's remove disc. */
  removeClose: require('../../../../../assets/figma/recurring/rating/remove-close.webp'),
  /** `1501:7324` — the 21.6pt `Icon/Play` on the video thumbnail (22pt export box). */
  videoPlay: require('../../../../../assets/figma/recurring/rating/video-play.webp'),
};

export const RATING_ART = art as Record<keyof typeof art, ImageSourcePropType>;
