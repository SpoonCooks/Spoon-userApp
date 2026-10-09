/**
 * Version comparison and the update decision.
 *
 * Pure, so the one rule that decides whether a customer is blocked from the app is testable
 * without a device, a store or Firebase.
 *
 * ## Fails OPEN
 *
 * Every value here comes from a console a person types into. A blank, a typo ("1.2.x") or a
 * version the parser cannot read is treated as "no requirement", never as "block". Locking every
 * customer out of the app because someone mistyped a field is a far worse outcome than failing to
 * enforce one update.
 */

export type UpdateRequirement = 'none' | 'optional' | 'required';

/** `major.minor.patch`; a missing minor or patch is 0 (`"2"` and `"2.0.0"` are equal). */
export function parseVersion(
  raw: string | null | undefined,
): readonly [number, number, number] | null {
  if (raw === null || raw === undefined) return null;
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(raw.trim());
  if (match === null) return null;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

/** Negative when `a` is older than `b`, positive when newer, 0 when equal; null if either is unreadable. */
export function compareVersions(a: string, b: string): number | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (left === null || right === null) return null;
  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function decideUpdate(input: {
  readonly installed: string;
  readonly minimum: string | null;
  readonly latest: string | null;
}): UpdateRequirement {
  const belowMinimum =
    input.minimum === null ? null : compareVersions(input.installed, input.minimum);
  if (belowMinimum !== null && belowMinimum < 0) return 'required';

  const belowLatest = input.latest === null ? null : compareVersions(input.installed, input.latest);
  if (belowLatest !== null && belowLatest < 0) return 'optional';

  return 'none';
}
