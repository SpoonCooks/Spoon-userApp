import type { Keyframe, MotionPart, Track } from '@ui/motion/keyframes';

import type { RatingTier } from '../../data/rating';

/**
 * The rate card's motion, from Figma's timelines on page `1005:131` — each frame is a 2 s cohort:
 *
 *   first look  `1501:6628`  loops: the "?" bobs, the dashed ring turns, the nudge sparkle spins
 *                            and the 5+ button wiggles at 40–65 %
 *   4 – 5       `1501:6696`  stars pop in turn, the scallop spins up, "4.5" springs in, its
 *                            sparkle twirls, the mood slides in from the right
 *   5+          `1501:6846`  the 5+ button jolts, the burst spins up, "5+" bounces in, two
 *                            sparkles twirl, 12 confetti pieces fly out from the sticker
 *   1 – 3.5     `1501:7335` / `7481` / `7630`  the blob drops in and squashes, the score and mood
 *                            rise, the mic pulses at the end
 *
 * Figma plays every frame on a loop, but only the first look is idle motion: the rated frames are
 * an entrance, so the card plays them once each time a score is picked (`RateVisitCard`).
 */
export const RATING_TIMELINE_MS = 2000;

const LOW: readonly RatingTier[] = ['belowPar', 'disappointing', 'veryPoor'];
type RatedTier = Exclude<RatingTier, 'idle'>;

// ─── Stars (`1501:6767` …): each pops in turn ──────────────────────────────────────────────────

export interface Pop {
  readonly opacity: Track;
  readonly scale: Track;
}

function pop(start: number, high: 'loved' | 'magic' | 'low'): Pop {
  if (high === 'low') {
    // `1501:7393` … — 20 % → full, 0.8 springing to 1, 4 % apart.
    return {
      opacity: [
        [start, 0.2, 'out'],
        [start + 10, 1],
      ],
      scale: [
        [start, 0.8, 'spring'],
        [start + 12.5, 1],
      ],
    };
  }
  // `1501:6767` (4–5, 3.5 % apart, to 1.18) and `1501:7117` (5+, 3 % apart, to 1.2).
  const [peak, up, settle] = high === 'loved' ? [1.18, 9, 16] : [1.2, 8, 15];
  return {
    opacity: [
      [start, 0.3, 'out'],
      [start + 6, 1],
    ],
    scale: [
      [start, 0.6, 'out'],
      [start + up, peak, 'spring'],
      [start + settle, 1],
    ],
  };
}

const STAR_POPS: Record<'loved' | 'magic' | 'low', readonly Pop[]> = {
  loved: [0, 1, 2, 3, 4].map((i) => pop(i * 3.5, 'loved')),
  magic: [0, 1, 2, 3, 4].map((i) => pop(i * 3, 'magic')),
  low: [0, 1, 2, 3, 4].map((i) => pop(i * 4, 'low')),
};

export function starPops(tier: RatedTier): readonly Pop[] {
  return STAR_POPS[LOW.includes(tier) ? 'low' : tier === 'magic' ? 'magic' : 'loved'];
}

// ─── The 5+ button ─────────────────────────────────────────────────────────────────────────────

/** `1501:6682` — the first look's wiggle at 40–65 %, every loop. */
export const PLUS_IDLE = {
  rotate: [
    [40, 0, 'out'],
    [50, 0.262, 'spring'],
    [65, 0],
  ] as Track,
  scale: [
    [40, 1, 'out'],
    [50, 1.15, 'bouncy'],
    [65, 1],
  ] as Track,
};

/** `1501:7159` — the jolt when 5+ is picked. */
export const PLUS_PICKED = {
  rotate: [
    [17.5, 0, 'out'],
    [25, 0.436, 'spring'],
    [40, 0],
  ] as Track,
  scale: [
    [17.5, 1, 'out'],
    [25, 1.35, 'bouncy'],
    [37.5, 1],
  ] as Track,
};

// ─── First look (`1501:6628`) ──────────────────────────────────────────────────────────────────

/** `1501:6655` — the "?" bobs up 5 and tilts 8° at 40 %, settles at 80 %. */
export const IDLE_MARK = {
  translateY: [
    [0, 0, 'inOut'],
    [40, -5, 'inOut'],
    [80, 0, 'inOut'],
    [100, -2.5],
  ] as Track,
  rotate: [
    [0, 0, 'inOut'],
    [40, 0.14, 'inOut'],
    [80, 0, 'inOut'],
    [100, -0.07],
  ] as Track,
};

/**
 * `1501:6642` — the ring turns 0.982 rad every 2 s. Played as one endless turn at that speed
 * rather than snapping back each loop: a full turn takes 2π / 0.982 × 2 s.
 */
export const IDLE_RING_TURN_MS = Math.round(((2 * Math.PI) / 0.982) * RATING_TIMELINE_MS);
export const FULL_TURN: Track = [
  [0, 0],
  [100, 2 * Math.PI],
];

/**
 * `1501:6694` — the nudge's sparkle spins eased each loop. Figma turns it 2.222 rad and snaps
 * back; a quarter turn keeps the same eased spin on its four-point symmetry with no snap.
 */
export const NUDGE_SPARKLE: Track = [
  [0, 0, 'inOut'],
  [100, Math.PI / 2],
];

// ─── Stickers and mood ─────────────────────────────────────────────────────────────────────────

export type Part = MotionPart;

const fadeIn = (from: number, to: number): Track => [
  [from, 0, 'out'],
  [to, 1],
];
const slide = (from: number, to: number, offset: number): Track => [
  [from, offset, 'out'],
  [to, 0],
];

/** `1501:6719` scallop, `1501:6730` "4.5", `1501:6742` sparkle, `1501:6750` / `6757` mood. */
const LOVED = {
  shape: {
    opacity: [
      [17.5, 0, 'out'],
      [25, 1],
    ],
    rotate: [
      [17.5, -2.094, 'out'],
      [47.5, 0],
      [100, 0.326],
    ],
    scale: [
      [17.5, 0.15, 'overshoot'],
      [37.5, 1.12, 'spring'],
      [47.5, 1, 'inOut'],
      [90, 1.05, 'inOut'],
      [100, 1.038],
    ],
  },
  numeral: {
    opacity: [
      [30, 0, 'out'],
      [37.5, 1],
    ],
    translateY: slide(30, 45, 10),
    scale: [
      [30, 0.5, 'overshoot'],
      [45, 1.15, 'spring'],
      [52.5, 1],
    ],
  },
  sparkles: [
    {
      rotate: [
        [42.5, 1.571, 'out'],
        [62.5, 0, 'inOut'],
        [100, -0.935],
      ],
      scale: [
        [42.5, 0.01, 'out'],
        [52.5, 1.4, 'spring'],
        [62.5, 1, 'inOut'],
        [100, 0.636],
      ],
    },
  ],
  headline: { opacity: fadeIn(35, 47.5), translateX: slide(35, 52.5, 18) },
  body: { opacity: fadeIn(40, 52.5), translateX: slide(40, 57.5, 18) },
} satisfies StickerMotion;

/** `1501:7062` burst, `1501:7070` "5+", `1501:7081` / `7092` sparkles, `1501:7100` / `7107` mood. */
const MAGIC = {
  shape: {
    opacity: [
      [25, 0, 'snap'],
      [32.5, 1],
    ],
    rotate: [
      [25, -3.491, 'out'],
      [55, 0],
      [100, 0.449],
    ],
    scale: [
      [25, 0.1, 'overshoot'],
      [47.5, 1.18, 'spring'],
      [57.5, 1, 'inOut'],
      [100, 1.06],
    ],
  },
  numeral: {
    opacity: [
      [40, 0, 'out'],
      [47.5, 1],
    ],
    scale: [
      [40, 0.4, 'overshoot'],
      [55, 1.25, 'bouncy'],
      [65, 1],
    ],
  },
  sparkles: [
    {
      rotate: [
        [50, 1.571, 'out'],
        [70, 0],
        [100, -0.524],
      ],
      scale: [
        [50, 0.01, 'out'],
        [60, 1.5, 'spring'],
        [70, 1, 'inOut'],
        [100, 0.75],
      ],
    },
    {
      rotate: [
        [57.5, 1.571, 'out'],
        [77.5, 0],
        [100, -0.428],
      ],
      scale: [
        [57.5, 0.01, 'out'],
        [67.5, 1.5, 'spring'],
        [77.5, 1, 'inOut'],
        [100, 0.811],
      ],
    },
  ],
  headline: { opacity: fadeIn(45, 57.5), translateX: slide(45, 62.5, 18) },
  body: { opacity: fadeIn(50, 62.5), translateX: slide(50, 67.5, 18) },
} satisfies StickerMotion;

/**
 * `1501:7362` / `7508` / `7657` — the blob drops 18 and springs from 70 %, squashes at 65 % and
 * leans; the three differ only in squash and lean.
 */
function blob(squash: number, lean: number): StickerMotion {
  const end = squash / 15;
  return {
    shape: {
      opacity: fadeIn(20, 30),
      translateY: slide(20, 45, -18),
      rotate: [
        [45, 0, 'inOut'],
        [100, lean],
      ],
      scaleX: [
        [20, 0.7, 'spring'],
        [45, 1, 'inOut'],
        [65, 1 + squash, 'soft'],
        [90, 1, 'inOut'],
        [100, 1 + end],
      ],
      scaleY: [
        [20, 0.7, 'spring'],
        [45, 1, 'inOut'],
        [65, 1 - squash, 'soft'],
        [90, 1, 'inOut'],
        [100, 1 - end],
      ],
    },
    numeral: { opacity: fadeIn(35, 50), translateY: slide(35, 55, -6) },
    sparkles: [],
    headline: { opacity: fadeIn(45, 62.5), translateY: slide(45, 65, 6) },
    body: { opacity: fadeIn(51, 68.5), translateY: slide(51, 71, 6) },
  };
}

export interface StickerMotion {
  readonly shape: Part;
  readonly numeral: Part;
  readonly sparkles: readonly Part[];
  readonly headline: Part;
  readonly body: Part;
}

export const STICKER_MOTION: Record<RatedTier, StickerMotion> = {
  loved: LOVED,
  magic: MAGIC,
  belowPar: blob(0.06, -0.052),
  disappointing: blob(0.09, 0.07),
  veryPoor: blob(0.12, 0.07),
};

/** `1501:7456` … — on a low score the mic pulses as the card settles. */
export const MIC_PULSE: Track = [
  [80, 1, 'out'],
  [90, 1.12, 'spring'],
  [100, 0.999],
];

// ─── 5+ confetti (`1501:6849`) ─────────────────────────────────────────────────────────────────

export interface ConfettiPiece {
  readonly key: string;
  /** Its box in the card, from the card's corner. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** A sparkle or dot drawn from art, or a 10 × 4 streamer in this colour. */
  readonly art: 'image' | string;
  readonly motion: Part;
}

/**
 * Each piece flies out from round the sticker (its `from` offset) to its spot over 27.5 % with an
 * ease-out, fades in over 5 %, spins, and drifts down about a point to the end.
 */
function flight(
  start: number,
  from: readonly [number, number],
  turn: readonly [number, number],
  drift: number,
): Part {
  const land = start + 27.5;
  return {
    opacity: [
      [start, 0, 'snap'],
      [start + 5, 1],
    ],
    rotate: [
      [start, turn[0], 'out'],
      [100, turn[1]],
    ],
    translateX: [
      [start, from[0], 'out'],
      [land, 0],
    ],
    translateY: [
      [start, from[1], 'out'],
      [land, 0, 'in'],
      [100, drift],
    ] as Keyframe[],
  };
}

export const CONFETTI: readonly ConfettiPiece[] = [
  {
    key: '6865',
    x: 300,
    y: 20,
    width: 12,
    height: 12,
    art: 'image',
    motion: flight(47.5, [-214.2, 95.4], [0, 1.357], 1.251),
  },
  {
    key: '6881',
    x: 338,
    y: 50,
    width: 8,
    height: 8,
    art: 'image',
    motion: flight(49.5, [-246.6, 70.2], [0, -1.335], 1.125),
  },
  {
    key: '6897',
    x: 262,
    y: 48,
    width: 6,
    height: 6,
    art: 'image',
    motion: flight(51.5, [-177.3, 72.9], [0, 1.311], 0.998),
  },
  {
    key: '6913',
    x: 350,
    y: 12,
    width: 6,
    height: 6,
    art: 'image',
    motion: flight(53.5, [-256.5, 105.3], [0, -1.286], 0.871),
  },
  {
    key: '6929',
    x: 322,
    y: 66,
    width: 5,
    height: 5,
    art: 'image',
    motion: flight(55.5, [-230.85, 57.15], [0, 1.26], 0.746),
  },
  {
    key: '6945',
    x: 278,
    y: 18,
    width: 4,
    height: 4,
    art: 'image',
    motion: flight(47.5, [-190.8, 100.8], [0, -1.357], 1.251),
  },
  {
    key: '6961',
    x: 244,
    y: 21,
    width: 10.66,
    height: 8.464,
    art: '#FFD600',
    motion: flight(49.5, [-162.9, 93.6], [-0.524, -3.415], 1.125),
  },
  {
    key: '6977',
    x: 343.31,
    y: 84,
    width: 10.754,
    height: 7.851,
    art: '#000000',
    motion: flight(51.5, [-253.8, 41.4], [0.436, -2.404], 0.998),
  },
  {
    key: '6993',
    x: 150,
    y: 200,
    width: 8,
    height: 8,
    art: 'image',
    motion: flight(53.5, [-77.4, -64.8], [0, 1.286], 0.871),
  },
  {
    key: '7009',
    x: 348,
    y: 198,
    width: 8,
    height: 8,
    art: 'image',
    motion: flight(55.5, [-255.6, -63], [0, -1.26], 0.746),
  },
  {
    key: '7025',
    x: 232,
    y: 206,
    width: 4,
    height: 4,
    art: 'image',
    motion: flight(47.5, [-149.4, -68.4], [0, 1.357], 1.251),
  },
  {
    key: '7041',
    x: 24,
    y: 206,
    width: 6,
    height: 6,
    art: 'image',
    motion: flight(49.5, [36.9, -69.3], [0, -1.335], 1.125),
  },
];
