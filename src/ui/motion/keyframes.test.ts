import { bake } from './keyframes';
import type { Track } from './keyframes';

/** Reads a baked track at `percent`, linearly between its points, as `interpolate` does. */
function valueAt(track: Track, percent: number): number {
  const { inputRange, outputRange } = bake(track);
  const t = percent / 100;
  const i = inputRange.findIndex((x) => x >= t);
  if (i === 0) return outputRange[0]!;
  if (i === -1) return outputRange[outputRange.length - 1]!;
  const [x0, x1, y0, y1] = [
    inputRange[i - 1]!,
    inputRange[i]!,
    outputRange[i - 1]!,
    outputRange[i]!,
  ];
  return y0 + ((y1 - y0) * (t - x0)) / (x1 - x0);
}

describe('bake', () => {
  it('holds the first value before a late start and the last after an early end', () => {
    const track: Track = [
      [20, 0, 'out'],
      [40, 1],
    ];
    expect(valueAt(track, 0)).toBe(0);
    expect(valueAt(track, 10)).toBe(0);
    expect(valueAt(track, 40)).toBe(1);
    expect(valueAt(track, 100)).toBe(1);
    const { inputRange } = bake(track);
    expect(inputRange[0]).toBe(0);
    expect(inputRange.at(-1)).toBe(1);
  });

  it('eases a segment by its start stop’s timing function', () => {
    const out: Track = [
      [0, 0, 'out'],
      [100, 1],
    ];
    const linear: Track = [
      [0, 0],
      [100, 1],
    ];
    expect(valueAt(out, 50)).toBeGreaterThan(0.6);
    expect(valueAt(linear, 50)).toBeCloseTo(0.5);
  });

  it('overshoots on a spring and settles on its end value', () => {
    const track: Track = [
      [0, 0, 'spring'],
      [100, 1],
    ];
    const peak = Math.max(...bake(track).outputRange);
    expect(peak).toBeGreaterThan(1);
    expect(valueAt(track, 100)).toBe(1);
  });

  it('holds a step-end segment, then jumps', () => {
    const track: Track = [
      [0, 0, 'step'],
      [50, 1],
    ];
    expect(valueAt(track, 49.9)).toBe(0);
    expect(valueAt(track, 50)).toBe(1);
  });

  it('never repeats an input point', () => {
    const { inputRange } = bake([
      [0, 0, 'inOut'],
      [50, 1, 'bouncy'],
      [50, 2],
      [100, 3],
    ]);
    inputRange.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(inputRange[i]!));
  });
});
