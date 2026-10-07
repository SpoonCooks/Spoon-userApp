import { bake } from '@ui/motion/keyframes';
import type { MotionPart, Track } from '@ui/motion/keyframes';

import {
  CONFETTI,
  MIC_PULSE,
  PLUS_IDLE,
  PLUS_PICKED,
  STICKER_MOTION,
  starPops,
} from './ratingMotion';

const tracksOf = (part: MotionPart): Track[] => Object.values(part) as Track[];

describe('rate card motion', () => {
  it('bakes every track into a valid interpolation', () => {
    const parts: MotionPart[] = [
      PLUS_IDLE,
      PLUS_PICKED,
      { scale: MIC_PULSE },
      ...CONFETTI.map((piece) => piece.motion),
      ...Object.values(STICKER_MOTION).flatMap((m) => [
        m.shape,
        m.numeral,
        m.headline,
        m.body,
        ...m.sparkles,
      ]),
      ...(['loved', 'magic', 'belowPar'] as const).flatMap((tier) => [...starPops(tier)]),
    ];
    for (const track of parts.flatMap(tracksOf)) {
      const { inputRange, outputRange } = bake(track);
      expect(inputRange[0]).toBe(0);
      expect(inputRange.at(-1)).toBe(1);
      expect(outputRange.every(Number.isFinite)).toBe(true);
      inputRange.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(inputRange[i]!));
    }
  });

  it('lands every confetti piece on its Figma spot', () => {
    for (const piece of CONFETTI) {
      const x = bake(piece.motion.translateX!).outputRange;
      const opacity = bake(piece.motion.opacity!).outputRange;
      expect(x.at(-1)).toBe(0);
      expect(opacity.at(-1)).toBe(1);
    }
    expect(CONFETTI).toHaveLength(12);
  });

  it('pops the five stars in turn', () => {
    const starts = starPops('loved').map((pop) => pop.scale[0]![0]);
    expect(starts).toEqual([0, 3.5, 7, 10.5, 14]);
  });
});
