import type { Ease, Keyframe, Track } from '@ui/motion/keyframes';

/**
 * The hero scene's motion, transcribed from Figma `1255:2991` ("Scene", timeline root `1255:2973`):
 * one 8s loop for every animated layer. The cook walks in (0–30.6 %), lights the stove and stirs
 * while the pan tosses and steam rises (32.5–76 %), then walks off right (76–100 %).
 *
 * Each track is the frame's keyframes as `[percent, value, ease?]` (see `@ui/motion/keyframes`).
 */
export const HERO_LOOP_MS = 8000;

/** Alternating swings from `from` to `-from` and back, `period` apart, all ease-in-out. */
function swing(start: number, period: number, from: number, count: number): Keyframe[] {
  return Array.from({ length: count }, (_, i): Keyframe => [
    start + i * period,
    i % 2 === 0 ? from : -from,
    'inOut',
  ]);
}

const PCT = (list: readonly (readonly [number, number])[]) => list;

/** `1255:3117` Cook — the walk in, with its 3.5pt bob, and the walk out. */
const COOK_WALK = PCT([
  [0, -300],
  [1.25, -285.029],
  [1.625, -280.537],
  [2.5, -270.057],
  [3.25, -261.074],
  [3.75, -255.086],
  [4.875, -241.611],
  [5, -240.114],
  [6.25, -225.143],
  [6.5, -222.149],
  [7.5, -210.171],
  [8.125, -202.686],
  [8.75, -195.2],
  [9.75, -183.223],
  [10, -180.229],
  [11.25, -165.257],
  [11.375, -163.76],
  [12.5, -150.286],
  [13, -144.297],
  [13.75, -135.314],
  [14.625, -124.834],
  [15, -120.343],
  [16.25, -105.371],
  [17.5, -90.4],
  [17.875, -85.909],
  [18.75, -75.429],
  [19.5, -66.446],
  [20, -60.457],
  [21.125, -46.983],
  [21.25, -45.486],
  [21.875, -38],
  [22.5, -33.584],
  [22.75, -31.898],
  [23.75, -25.514],
  [24.375, -21.8],
  [25, -18.3],
  [26, -13.17],
  [26.25, -11.984],
  [27.5, -6.7],
  [28.75, -2.685],
  [30, -0.339],
  [30.625, 0],
  [76.25, 0],
  [77.5, 1.37],
  [78.75, 4.727],
  [79.125, 6.016],
  [80, 9.441],
  [80.75, 12.789],
  [81.25, 15.216],
  [82.375, 21.262],
  [82.5, 22],
  [83.75, 39.538],
  [84, 43.046],
  [85, 57.077],
  [85.625, 65.846],
  [86.25, 74.615],
  [87.25, 88.646],
  [87.5, 92.154],
  [88.75, 109.692],
  [88.875, 111.446],
  [90, 127.231],
  [90.5, 134.246],
  [91.25, 144.769],
  [92.125, 157.046],
  [92.5, 162.308],
  [93.75, 179.846],
  [95, 197.385],
  [95.375, 202.646],
  [96.25, 214.923],
  [97, 225.446],
  [97.5, 232.462],
  [98.625, 248.246],
  [98.75, 250],
  [100, 250],
]);
const COOK_BOB = PCT([
  [0, 0],
  [1.25, -3.116],
  [1.625, -3.5],
  [2.5, -1.519],
  [3.25, 0],
  [3.75, -0.69],
  [4.875, -3.5],
  [5, -3.46],
  [6.25, -0.167],
  [6.5, 0],
  [7.5, -2.423],
  [8.125, -3.5],
  [8.75, -2.423],
  [9.75, 0],
  [10, -0.167],
  [11.25, -3.46],
  [11.375, -3.5],
  [12.5, -0.69],
  [13, 0],
  [13.75, -1.519],
  [14.625, -3.5],
  [15, -3.116],
  [16.25, 0],
  [17.5, -3.116],
  [17.875, -3.5],
  [18.75, -1.519],
  [19.5, 0],
  [20, -0.69],
  [21.125, -3.5],
  [21.25, -3.46],
  [21.875, -1.981],
  [22.5, -0.167],
  [22.75, 0],
  [23.75, -2.423],
  [24.375, -3.5],
  [25, -2.423],
  [26, 0],
  [76.25, 0],
  [77.5, 0],
  [78.75, -3.116],
  [79.125, -3.5],
  [80, -1.519],
  [80.75, 0],
  [81.25, -0.69],
  [82.375, -3.5],
  [82.5, -3.46],
  [83.75, -0.167],
  [84, 0],
  [85, -2.423],
  [85.625, -3.5],
  [86.25, -2.423],
  [87.25, 0],
  [87.5, -0.167],
  [88.75, -3.46],
  [88.875, -3.5],
  [90, -0.69],
  [90.5, 0],
  [91.25, -1.519],
  [92.125, -3.5],
  [92.5, -3.116],
  [93.75, 0],
  [95, -3.116],
  [95.375, -3.5],
  [96.25, -1.519],
  [97, 0],
  [97.5, -0.69],
  [98.625, -3.5],
  [98.75, -3.5],
  [100, -3.5],
]);

/** Fades the flame and its glow in at 32.5–37.5 % and out at 73.75–78.75 %. */
const FIRE_OPACITY: Track = [
  [0, 0],
  [32.5, 0, 'out'],
  [37.5, 1],
  [73.75, 1, 'inOut'],
  [78.75, 0],
  [100, 0],
];

/** A toss: lift and tilt, eased up, then back down. */
function toss(
  starts: readonly number[],
  up: number,
  down: number,
  peak: number,
  upEase: Ease,
  downEase: Ease,
): Track {
  return [
    [0, 0],
    ...starts.flatMap((start): Keyframe[] => [
      [start, 0, upEase],
      [start + up, peak, downEase],
      [start + up + down, 0],
    ]),
    [100, 0],
  ];
}

/** `1255:3114`–`3116` — a wisp rises 16 as it fades in to 0.85 and out, then jumps back. */
function wisp(starts: readonly number[]): { opacity: Track; translateY: Track } {
  const opacity: Keyframe[] = [[0, 0]];
  const translateY: Keyframe[] = [[0, 0]];
  starts.forEach((start, i) => {
    const last = i === starts.length - 1;
    opacity.push([start, 0, 'out'], [start + 5.625, 0.85, 'in'], [start + 15.625, 0]);
    translateY.push(
      [start, 0, 'out'],
      last ? [start + 15.625, -16] : [start + 15.625, -16, 'step'],
    );
  });
  opacity.push([100, 0]);
  translateY.push([100, -16]);
  return { opacity, translateY };
}

export const HERO_TRACKS = {
  cook: {
    translateX: COOK_WALK.map(([p, v]): Keyframe => [p, v]),
    translateY: COOK_BOB.map(([p, v]): Keyframe => [p, v]),
    rotate: [
      [0, 0.052],
      [25, 0.052, 'out'],
      [31.25, -0.017, 'spring'],
      [35.625, 0],
      [76.25, 0, 'inOut'],
      [81.25, 0.052],
      [100, 0.052],
    ] as Track,
  },
  armBack: [
    ...swing(0, 3.25, -0.454, 7),
    [22.75, 0.454, 'out'],
    [32.5, -0.105],
    [76.25, -0.105, 'inOut'],
    ...swing(78.125, 3.25, -0.454, 6),
    [97.625, -0.454],
    [100, -0.454],
  ] as Track,
  legBack: [
    ...swing(0, 3.25, 0.349, 7),
    [22.75, -0.349, 'out'],
    [31.875, 0],
    [76.875, 0, 'inOut'],
    ...swing(77.5, 3.25, 0.349, 6),
    [97, 0.349],
    [100, 0.349],
  ] as Track,
  legFront: [
    ...swing(0, 3.25, -0.349, 7),
    [22.75, 0.349, 'out'],
    [31.875, 0],
    [76.875, 0, 'inOut'],
    ...swing(77.5, 3.25, -0.349, 6),
    [97, -0.349],
    [100, -0.349],
  ] as Track,
  /** The front arm swings in, lifts to stir (−1.71 ↔ −1.92 rad), drops and swings out. */
  armFront: [
    ...swing(0, 3.25, 0.384, 7),
    [22.75, -0.384, 'out'],
    [30.625, 0, 'inOut'],
    [36.875, -1.745, 'inOut'],
    [41.875, -1.92, 'inOut'],
    [47.125, -1.71, 'inOut'],
    [52.375, -1.92, 'inOut'],
    [57.625, -1.71, 'inOut'],
    [62.875, -1.92, 'inOut'],
    [68.125, -1.71, 'inOut'],
    [76.875, 0, 'inOut'],
    ...swing(78.75, 3.25, 0.384, 6),
    [98.25, 0.384],
    [100, 0.384],
  ] as Track,
  flameGlow: {
    opacity: FIRE_OPACITY,
    scale: [
      [0, 1, 'inOut'],
      [37.5, 0.95, 'inOut'],
      [41.875, 1.12, 'inOut'],
      [46.25, 0.95, 'inOut'],
      [50.625, 1.12, 'inOut'],
      [55, 0.95, 'inOut'],
      [59.375, 1.12, 'inOut'],
      [63.75, 0.95, 'inOut'],
      [68.125, 1.12, 'inOut'],
      [72.5, 0.95],
      [100, 0.95],
    ] as Track,
  },
  flame: {
    opacity: FIRE_OPACITY,
    scaleY: [
      [0, 0.5],
      [32.5, 0.5, 'out'],
      [37.5, 1, 'inOut'],
      ...Array.from({ length: 13 }, (_, i): Keyframe => [
        40 + i * 2.5,
        i % 2 === 0 ? 0.92 : 1.15,
        'inOut',
      ]),
      [72.5, 1.15, 'in'],
      [78.75, 0.5],
      [100, 0.5],
    ] as Track,
  },
  pan: {
    rotate: toss([45, 61.25], 2.5, 4.375, 0.105, 'out', 'inOut'),
    translateY: toss([45, 61.25], 2.5, 4.375, -4, 'out', 'inOut'),
  },
  food: {
    rotate: toss([45.625, 61.875], 3.375, 3.75, 0.105, 'out', 'in'),
    translateY: toss([45.625, 61.875], 3.375, 3.75, -12, 'out', 'in'),
  },
  wisps: [wisp([38.75, 55, 71.25]), wisp([44.375, 60.625]), wisp([50, 66.25])],
} as const;

/** The resting frame — the cook at the stove, flame lit — for Reduce Motion. */
export const HERO_REST_PROGRESS = 0.55;
