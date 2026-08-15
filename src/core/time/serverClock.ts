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
