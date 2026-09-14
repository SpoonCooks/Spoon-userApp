/**
 * Server-clock skew correction. (FRONTEND_FOUNDATION_PLAN.md §19)
 *
 * Countdowns are a RENDERING of server truth, never a client-owned clock. Remaining time is
 * always derived from a server-provided absolute timestamp, corrected for device clock skew.
 * Device clocks are wrong more often than people expect.
 */

export interface ServerClock {
  /** Best estimate of the server's current epoch milliseconds. */
  now(): number;
  /** Milliseconds the device clock is ahead of (positive) or behind (negative) the server. */
  readonly skewMs: number;
}

/**
 * @param serverNowMs epoch ms reported by the server
 * @param deviceNowMs epoch ms read from the device at the same moment
 */
export function computeSkewMs(serverNowMs: number, deviceNowMs: number): number {
  return deviceNowMs - serverNowMs;
}

export function createServerClock(
  skewMs: number,
  deviceNow: () => number = () => Date.now(),
): ServerClock {
  return {
    skewMs,
    now: () => deviceNow() - skewMs,
  };
}

/** Remaining milliseconds until an absolute server timestamp. Never negative. */
export function remainingMs(endsAtMs: number, serverNowMs: number): number {
  return Math.max(0, endsAtMs - serverNowMs);
}

/**
 * Whether a booked slot — a start instant plus a booked duration — is already over.
 *
 * The window is the one the screens themselves draw: "5:30 PM • 2 hr" is `scheduledStart` plus
 * `durationMinutes`, so a card and its own lifetime are derived from the same two fields and
 * cannot drift apart.
 *
 * It is NOT a substitute for `timing.expectedEnd`, which is when a service ACTUALLY ends and is
 * the only authority for "Time left" on a live card — a service can start late or be extended.
 * This answers a different question: whether the slot a booking was made for has passed, which
 * matters for bookings where no service is going to happen at all.
 *
 * An absent or unparseable start means there is no window to have ended — an instant booking
 * carries no `scheduledStart` — so it reports false. Retiring something on the strength of a
 * timestamp that could not be read would be the worse failure.
 */
export function slotHasEnded(
  startIso: string | null | undefined,
  durationMinutes: number,
  now: Date = new Date(),
): boolean {
  if (startIso === null || startIso === undefined) return false;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() + durationMinutes * 60_000 <= now.getTime();
}

export interface DurationParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

export function splitDuration(ms: number): DurationParts {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
