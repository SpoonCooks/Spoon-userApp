import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { remainingMs } from './serverClock';
import type { ServerClock } from './serverClock';

/**
 * Countdown rendering. (FRONTEND_FOUNDATION_PLAN.md §19)
 *
 * Rules encoded here:
 *  - the remaining time is DERIVED during render from a server-provided absolute `endsAtMs`
 *    and a skew-corrected clock — never from a decremented counter;
 *  - the only state is the current server time, refreshed by one interval and re-read on app
 *    foreground, because JS timers are throttled while backgrounded;
 *  - reaching zero calls `onElapsed` (a REFETCH hook), never a state transition. Session end is
 *    a backend decision.
 */

export interface CountdownResult {
  readonly remainingMs: number;
  readonly isElapsed: boolean;
}

export function useCountdown(
  endsAtMs: number | null,
  clock: ServerClock,
  options: { intervalMs?: number; onElapsed?: () => void } = {},
): CountdownResult {
  const intervalMs = options.intervalMs ?? 1000;
  const onElapsed = options.onElapsed;

  const [nowMs, setNowMs] = useState<number>(() => clock.now());

  useEffect(() => {
    if (endsAtMs === null) {
      return;
    }

    const sync = () => setNowMs(clock.now());
    const timer = setInterval(sync, intervalMs);
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') sync();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [endsAtMs, intervalMs, clock]);

  const value = endsAtMs === null ? 0 : remainingMs(endsAtMs, nowMs);
  const isElapsed = endsAtMs !== null && value === 0;

  // Fires once per `endsAtMs`; an extension produces a new end time and re-arms it.
  const firedFor = useRef<number | null>(null);

  useEffect(() => {
    if (endsAtMs === null || !isElapsed || firedFor.current === endsAtMs) {
      return;
    }
    firedFor.current = endsAtMs;
    onElapsed?.();
  }, [endsAtMs, isElapsed, onElapsed]);

  return { remainingMs: value, isElapsed };
}
