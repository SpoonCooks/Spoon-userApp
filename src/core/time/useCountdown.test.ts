import { act, renderHook } from '@testing-library/react-native';

import { createServerClock } from './serverClock';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  let deviceNow = 0;
  const clock = createServerClock(0, () => deviceNow);

  beforeEach(() => {
    jest.useFakeTimers();
    deviceNow = 1_000_000;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('derives the remaining time from the server end timestamp', () => {
    const { result } = renderHook(() => useCountdown(deviceNow + 90_000, clock));

    expect(result.current.remainingMs).toBe(90_000);
    expect(result.current.isElapsed).toBe(false);
  });

  it('recomputes as time passes rather than decrementing a counter', () => {
    const endsAt = deviceNow + 10_000;
    const { result } = renderHook(() => useCountdown(endsAt, clock));

    act(() => {
      deviceNow += 4_000;
      jest.advanceTimersByTime(1_000);
    });

    expect(result.current.remainingMs).toBe(6_000);
  });

  it('calls onElapsed exactly once at zero and never transitions state itself', () => {
    const onElapsed = jest.fn();
    const endsAt = deviceNow + 2_000;

    const { result } = renderHook(() => useCountdown(endsAt, clock, { onElapsed }));

    act(() => {
      deviceNow += 5_000;
      jest.advanceTimersByTime(1_000);
    });

    expect(result.current.remainingMs).toBe(0);
    expect(result.current.isElapsed).toBe(true);
    expect(onElapsed).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(3_000);
    });

    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it('is inert when there is no active session', () => {
    const onElapsed = jest.fn();
    const { result } = renderHook(() => useCountdown(null, clock, { onElapsed }));

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(result.current.remainingMs).toBe(0);
    expect(result.current.isElapsed).toBe(false);
    expect(onElapsed).not.toHaveBeenCalled();
  });

  it('corrects for a skewed device clock', () => {
    // Device is 10 minutes ahead of the server.
    const skewedClock = createServerClock(600_000, () => deviceNow);
    const serverNow = deviceNow - 600_000;

    const { result } = renderHook(() => useCountdown(serverNow + 1_800_000, skewedClock));

    expect(result.current.remainingMs).toBe(1_800_000);
  });
});
