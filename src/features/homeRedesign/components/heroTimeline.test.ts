import { bake } from '@ui/motion/keyframes';

import { HERO_TRACKS } from './heroTimeline';

/** Reads a baked track at `percent`, linearly between its points, as `interpolate` does. */
function valueAt(track: Parameters<typeof bake>[0], percent: number): number {
  const { inputRange, outputRange } = bake(track);
  const t = percent / 100;
  const i = inputRange.findIndex((x) => x >= t);
  if (i <= 0) return outputRange[0]!;
  const [x0, x1, y0, y1] = [
    inputRange[i - 1]!,
    inputRange[i]!,
    outputRange[i - 1]!,
    outputRange[i]!,
  ];
  return y0 + ((y1 - y0) * (t - x0)) / (x1 - x0);
}

describe('hero timeline', () => {
  it('bakes a strictly increasing input range for every track', () => {
    const tracks = [
      HERO_TRACKS.cook.translateX,
      HERO_TRACKS.cook.rotate,
      HERO_TRACKS.armFront,
      HERO_TRACKS.flame.scaleY,
      HERO_TRACKS.pan.rotate,
      ...HERO_TRACKS.wisps.flatMap((wisp) => [wisp.opacity, wisp.translateY]),
    ];
    for (const track of tracks) {
      const { inputRange, outputRange } = bake(track);
      expect(inputRange[0]).toBe(0);
      expect(inputRange.at(-1)).toBe(1);
      expect(outputRange).toHaveLength(inputRange.length);
      inputRange.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(inputRange[i]!));
    }
  });

  it('walks the cook in from off-stage left, holds at the stove, and out right', () => {
    expect(valueAt(HERO_TRACKS.cook.translateX, 0)).toBe(-300);
    expect(valueAt(HERO_TRACKS.cook.translateX, 50)).toBe(0);
    expect(valueAt(HERO_TRACKS.cook.translateX, 100)).toBe(250);
  });

  it('lights the flame only while the cook is at the stove', () => {
    expect(valueAt(HERO_TRACKS.flame.opacity, 20)).toBe(0);
    expect(valueAt(HERO_TRACKS.flame.opacity, 55)).toBe(1);
    expect(valueAt(HERO_TRACKS.flame.opacity, 90)).toBe(0);
  });

  it('eases a segment rather than running it linearly', () => {
    // 25 → 31.25 % eases out from 0.052 to −0.017 rad: past halfway by the segment's midpoint.
    const mid = valueAt(HERO_TRACKS.cook.rotate, 28.125);
    expect(mid).toBeLessThan((0.052 + -0.017) / 2);
  });

  it('snaps a rising wisp back down at once (step-end)', () => {
    const [first] = HERO_TRACKS.wisps;
    expect(valueAt(first!.translateY, 54.9)).toBe(-16);
    expect(valueAt(first!.translateY, 55)).toBe(0);
  });
});
