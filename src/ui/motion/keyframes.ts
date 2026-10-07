import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/**
 * Figma keyframe motion on React Native's native driver.
 *
 * Figma's motion export (`get_motion_context`) gives each animated property as CSS keyframes:
 * percent stops over one timeline, each stop carrying the timing function for the segment that
 * STARTS there (linear when absent). A `Track` is that list as `[percent, value, ease?]`.
 *
 * The native driver takes no per-segment easing on `interpolate`, so `bake` samples every eased
 * segment into extra points and runs linearly between them; `keyframed` hands back the
 * interpolation, cached per value and track so a re-render reuses the native node.
 */
export type Ease =
  | 'in'
  | 'out'
  | 'inOut'
  /** `step-end`: hold the start value, jump at the next stop. */
  | 'step'
  /** `cubic-bezier(0.5, 0, 0.5, 1)` — Figma's symmetric fade. */
  | 'snap'
  /** `cubic-bezier(0.45, 1.45, 0.8, 1)` — an overshooting grow. */
  | 'overshoot'
  /** `cubic-bezier(0.22, 1.2, 0.36, 1)` — a quick rise that overshoots a touch and lands. */
  | 'land'
  /** Figma's springs, exported as CSS `linear()` stops (see `SPRINGS`). */
  | 'spring'
  | 'bouncy'
  | 'soft';
export type Keyframe = readonly [percent: number, value: number, ease?: Ease];
export type Track = readonly Keyframe[];

const BEZIERS: Record<
  'in' | 'out' | 'inOut' | 'snap' | 'overshoot' | 'land',
  (t: number) => number
> = {
  in: Easing.bezier(0.42, 0, 1, 1),
  out: Easing.bezier(0, 0, 0.58, 1),
  inOut: Easing.bezier(0.42, 0, 0.58, 1),
  snap: Easing.bezier(0.5, 0, 0.5, 1),
  overshoot: Easing.bezier(0.45, 1.45, 0.8, 1),
  land: Easing.bezier(0.22, 1.2, 0.36, 1),
};

/** The `linear()` stops Figma exports for its spring presets, evenly spaced in time. */
const SPRINGS: Record<'spring' | 'bouncy' | 'soft', readonly number[]> = {
  spring: [
    0, 0.0188, 0.0679, 0.1374, 0.2195, 0.308, 0.3978, 0.4856, 0.5686, 0.6452, 0.7142, 0.7753,
    0.8283, 0.8735, 0.9113, 0.9423, 0.9671, 0.9866, 1.0014, 1.0123, 1.0198, 1.0247, 1.0274, 1.0283,
    1.0281, 1.0268, 1.025, 1.0227, 1.0202, 1.0177, 1.0152, 1.0128, 1.0106, 1.0085, 1.0068, 1.0052,
    1.0039, 1.0028, 1.0018, 1.0011, 1.0005, 1, 0.9997, 0.9995, 0.9993, 0.9992, 0.9992, 0.9992,
    0.9992, 0.9993, 0.9993,
  ],
  bouncy: [
    0, 0.0985, 0.342, 0.6483, 0.9442, 1.1767, 1.3179, 1.364, 1.3302, 1.2427, 1.1314, 1.0233, 0.9377,
    0.8853, 0.8675, 0.8791, 0.9105, 0.9509, 0.9904, 1.0219, 1.0414, 1.0482, 1.0443, 1.033, 1.0183,
    1.0039, 0.9923, 0.9851, 0.9825, 0.9838, 0.9878, 0.9932, 0.9984, 1.0027, 1.0054, 1.0064, 1.0059,
    1.0045, 1.0025, 1.0006, 0.9991, 0.9981, 0.9977, 0.9978, 0.9983, 0.9991, 0.9998, 1.0003, 1.0007,
    1.0008, 1.0008,
  ],
  soft: [
    0, 0.0216, 0.0747, 0.1458, 0.2255, 0.3076, 0.3879, 0.4638, 0.5339, 0.5974, 0.6542, 0.7044,
    0.7484, 0.7866, 0.8196, 0.8479, 0.8722, 0.8928, 0.9103, 0.9251, 0.9375, 0.948, 0.9568, 0.9642,
    0.9703, 0.9754, 0.9797, 0.9832, 0.9862, 0.9886, 0.9906, 0.9923, 0.9936, 0.9948, 0.9957, 0.9965,
    0.9971, 0.9976, 0.9981, 0.9984, 0.9987, 0.9989, 0.9991, 0.9993, 0.9994, 0.9995, 0.9996, 0.9997,
    0.9997, 0.9998, 0.9998,
  ],
};

const SAMPLES = 8;
/** A step-end segment holds its start value until a hair before the next stop. */
const STEP_GAP = 0.01;

export function bake(track: Track): { inputRange: number[]; outputRange: number[] } {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  const push = (percent: number, value: number) => {
    const t = percent / 100;
    const last = inputRange[inputRange.length - 1];
    if (last !== undefined && t <= last) return;
    inputRange.push(t);
    outputRange.push(value);
  };
  // A track that starts after 0 or ends before 100 holds its first / last value.
  const first = track[0];
  if (first !== undefined && first[0] > 0) push(0, first[1]);

  track.forEach(([percent, value, ease], index) => {
    push(percent, value);
    const next = track[index + 1];
    if (next === undefined || ease === undefined) return;
    const [nextPercent, nextValue] = next;
    const at = (t: number, progress: number) =>
      push(percent + (nextPercent - percent) * t, value + (nextValue - value) * progress);
    if (ease === 'step') {
      push(nextPercent - STEP_GAP, value);
    } else if (ease === 'spring' || ease === 'bouncy' || ease === 'soft') {
      const stops = SPRINGS[ease];
      stops.forEach((progress, i) => {
        if (i > 0 && i < stops.length - 1) at(i / (stops.length - 1), progress);
      });
    } else {
      const curve = BEZIERS[ease];
      for (let i = 1; i < SAMPLES; i += 1) at(i / SAMPLES, curve(i / SAMPLES));
    }
  });

  const last = track[track.length - 1];
  if (last !== undefined && last[0] < 100) push(100, last[1]);
  return { inputRange, outputRange };
}

type Interpolation = Animated.AnimatedInterpolation<number | string>;
const CACHE = new WeakMap<Animated.Value, Map<Track, Map<string, Interpolation>>>();

/** The track over `progress` (0 → 1); `unit` (e.g. `'rad'`) for transforms that need one. */
export function keyframed(progress: Animated.Value, track: Track, unit = ''): Interpolation {
  let byTrack = CACHE.get(progress);
  if (byTrack === undefined) {
    byTrack = new Map();
    CACHE.set(progress, byTrack);
  }
  let byUnit = byTrack.get(track);
  if (byUnit === undefined) {
    byUnit = new Map();
    byTrack.set(track, byUnit);
  }
  const cached = byUnit.get(unit);
  if (cached !== undefined) return cached;
  const { inputRange, outputRange } = bake(track);
  const interpolation: Interpolation =
    unit === ''
      ? progress.interpolate({ inputRange, outputRange })
      : progress.interpolate({ inputRange, outputRange: outputRange.map((v) => `${v}${unit}`) });
  byUnit.set(unit, interpolation);
  return interpolation;
}

/** Whether the system asks for reduced motion; `false` until it has answered. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (live) setReduce(value);
      },
      () => undefined,
    );
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/**
 * A 0 → 1 clock on the native driver: looping while `loop`, otherwise played once each time
 * `replayKey` changes. Under Reduce Motion it rests at `restAt` (default: the end).
 */
export function useTimeline({
  durationMs,
  loop = false,
  replayKey,
  restAt = 1,
}: {
  readonly durationMs: number;
  readonly loop?: boolean;
  readonly replayKey?: unknown;
  readonly restAt?: number;
}): Animated.Value {
  const [progress] = useState(() => new Animated.Value(0));
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      progress.setValue(restAt);
      return undefined;
    }
    progress.setValue(0);
    const run = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const animation = loop ? Animated.loop(run) : run;
    animation.start();
    return () => animation.stop();
  }, [progress, reduce, durationMs, loop, replayKey, restAt]);

  return progress;
}

/** The tracks one layer animates; any it leaves out stay at rest. */
export interface MotionPart {
  readonly opacity?: Track;
  readonly translateX?: Track;
  readonly translateY?: Track;
  /** Radians. */
  readonly rotate?: Track;
  readonly scale?: Track;
  readonly scaleX?: Track;
  readonly scaleY?: Track;
}

/**
 * A layer's animated style over `progress`, its transforms in CSS's own order for Figma's
 * individual properties: translate, then rotate, then scale — each about the layer's centre.
 */
export function keyframedStyle(progress: Animated.Value, part: MotionPart) {
  const transform: Animated.WithAnimatedValue<
    | { translateX: number }
    | { translateY: number }
    | { rotate: string }
    | { scale: number }
    | { scaleX: number }
    | { scaleY: number }
  >[] = [];
  const at = (track: Track) => keyframed(progress, track) as Animated.AnimatedInterpolation<number>;
  if (part.translateX) transform.push({ translateX: at(part.translateX) });
  if (part.translateY) transform.push({ translateY: at(part.translateY) });
  if (part.rotate) {
    transform.push({
      rotate: keyframed(progress, part.rotate, 'rad') as Animated.AnimatedInterpolation<string>,
    });
  }
  if (part.scale) transform.push({ scale: at(part.scale) });
  if (part.scaleX) transform.push({ scaleX: at(part.scaleX) });
  if (part.scaleY) transform.push({ scaleY: at(part.scaleY) });
  return {
    ...(part.opacity ? { opacity: at(part.opacity) } : {}),
    ...(transform.length > 0 ? { transform } : {}),
  };
}
