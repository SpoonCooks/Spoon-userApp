import { computeSkewMs, createServerClock, remainingMs, splitDuration } from './serverClock';

describe('server clock', () => {
  it('measures a device clock running ahead of the server', () => {
    expect(computeSkewMs(1_000_000, 1_005_000)).toBe(5_000);
  });

  it('measures a device clock running behind the server', () => {
    expect(computeSkewMs(1_000_000, 995_000)).toBe(-5_000);
  });

  it('corrects device time by the measured skew', () => {
    const clock = createServerClock(5_000, () => 1_005_000);

    expect(clock.now()).toBe(1_000_000);
  });

  it('renders a countdown from server truth, not a local guess', () => {
    // Device is 10 minutes fast; without correction the countdown would read 10 minutes short.
    const clock = createServerClock(600_000, () => 1_600_000);
    const endsAt = 1_000_000 + 1_800_000;

    expect(remainingMs(endsAt, clock.now())).toBe(1_800_000);
  });
});

describe('remainingMs', () => {
  it('never returns a negative remainder', () => {
    expect(remainingMs(500, 1_000)).toBe(0);
  });

  it('returns zero exactly at the boundary', () => {
    expect(remainingMs(1_000, 1_000)).toBe(0);
  });
});

describe('splitDuration', () => {
  it('splits milliseconds into hours, minutes and seconds', () => {
    expect(splitDuration(3_723_000)).toEqual({ hours: 1, minutes: 2, seconds: 3 });
  });

  it('handles zero', () => {
    expect(splitDuration(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });
});
