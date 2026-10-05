import type { DurationOption } from '../types';

export type DishComplexity = 'simple' | 'complex';

export interface DialInputs {
  readonly complexity: DishComplexity;
  readonly dishes: number;
  readonly people: number;
}

/**
 * The dial's recommended duration.
 *
 * TODO(product): PLACEHOLDER FORMULA. The dev notes say the dial result selects a tile but do not
 * give the rule. This one is tuned only so the frame's inputs (simple, 2 dishes, 4 people) land
 * on the frame's answer (1.5 hrs): 30 min base, 15 min per simple dish or 25 per complex dish,
 * and 7.5 min per person beyond two — rounded UP to the next offered duration.
 */
export function recommendedMinutes({ complexity, dishes, people }: DialInputs): number {
  const perDish = complexity === 'complex' ? 25 : 15;
  return 30 + dishes * perDish + Math.max(0, people - 2) * 7.5;
}

/** The shortest offered duration that covers the recommendation, else the longest one. */
export function recommendDuration(
  inputs: DialInputs,
  durations: readonly DurationOption[],
): DurationOption | null {
  if (durations.length === 0) return null;
  const sorted = durations.slice().sort((a, b) => a.minutes - b.minutes);
  const need = recommendedMinutes(inputs);
  return sorted.find((d) => d.minutes >= need) ?? sorted[sorted.length - 1]!;
}
