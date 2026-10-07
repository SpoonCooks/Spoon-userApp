import { cookCardTracks } from './cooksTimeline';

/** Figma's export for `1290:1280` (`get_motion_context`), as [percent, value, ease?]. */
const FIGMA = {
  card1: {
    opacity: [
      [0, 0],
      [3.75, 0, 'out'],
      [9.375, 1],
      [86.25, 1, 'in'],
      [93.75, 0],
      [100, 0],
    ],
    translateY: [
      [0, 70],
      [3.75, 70, 'land'],
      [12.5, 0],
      [21.25, 0, 'inOut'],
      [30, -17.625],
      [38.75, -17.625, 'inOut'],
      [47.5, -35.25],
      [56.25, -35.25, 'inOut'],
      [65, -52.875],
      [86.25, -52.875, 'in'],
      [93.75, -68.875, 'step'],
      [94.375, 70],
      [100, 70],
    ],
    scale: [
      [0, 1],
      [21.25, 1, 'inOut'],
      [30, 0.95],
      [38.75, 0.95, 'inOut'],
      [47.5, 0.9],
      [56.25, 0.9, 'inOut'],
      [65, 0.85],
      [93.75, 0.85, 'step'],
      [94.375, 1],
      [100, 1],
    ],
  },
  card3: {
    opacity: [
      [0, 0],
      [38.75, 0, 'out'],
      [44.375, 1],
      [86.25, 1, 'in'],
      [93.75, 0],
      [100, 0],
    ],
    translateY: [
      [0, 70],
      [38.75, 70, 'land'],
      [47.5, 0],
      [56.25, 0, 'inOut'],
      [65, -17.625],
      [86.25, -17.625, 'in'],
      [93.75, -33.625, 'step'],
      [94.375, 70],
      [100, 70],
    ],
    scale: [
      [0, 1],
      [56.25, 1, 'inOut'],
      [65, 0.95],
      [93.75, 0.95, 'step'],
      [94.375, 1],
      [100, 1],
    ],
  },
  card4: {
    opacity: [
      [0, 0],
      [56.25, 0, 'out'],
      [61.875, 1],
      [86.25, 1, 'in'],
      [93.75, 0],
      [100, 0],
    ],
    translateY: [
      [0, 70],
      [56.25, 70, 'land'],
      [65, 0],
      [86.25, 0, 'in'],
      [93.75, -16, 'step'],
      [94.375, 70],
      [100, 70],
    ],
    scale: [
      [0, 1],
      [100, 1],
    ],
  },
} as const;

/** Floats to 6 places, so 1 − 3 × 0.05 compares equal to Figma's 0.85. */
const rounded = (track: readonly (readonly unknown[])[]) =>
  track.map((frame) =>
    frame.map((v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v) + ''),
  );

describe('cookCardTracks', () => {
  it.each([
    ['card1', 0],
    ['card3', 2],
    ['card4', 3],
  ] as const)('matches Figma’s %s', (name, index) => {
    const tracks = cookCardTracks(index);
    const figma = FIGMA[name];
    expect(rounded(tracks.opacity)).toEqual(rounded(figma.opacity));
    expect(rounded(tracks.translateY)).toEqual(rounded(figma.translateY));
    expect(rounded(tracks.scale)).toEqual(rounded(figma.scale));
  });
});
