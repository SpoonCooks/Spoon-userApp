import {
  currentSkewMs,
  hasSkewObservation,
  observeServerTime,
  resetSkewObservation,
} from './clockSkew';
import { createServerClock, remainingMs } from './serverClock';

/**
 * Clock skew (§29).
 *
 * The behaviour worth pinning is that a BAD observation never displaces a good one. A countdown
 * that jumps because one response omitted `serverTime` is worse than one that is slightly stale,
 * and the failure is invisible in normal testing because the field is usually present.
 */

beforeEach(() => {
  resetSkewObservation();
});

describe('observeServerTime', () => {
  it('measures how far the device clock is ahead of the server', () => {
    // Device says 12:00:05, server said 12:00:00 — the device is 5s fast.
    observeServerTime('2026-08-18T12:00:00.000Z', Date.parse('2026-08-18T12:00:05.000Z'));

    expect(currentSkewMs()).toBe(5_000);
    expect(hasSkewObservation()).toBe(true);
  });

  it('measures a device clock that is behind as a negative offset', () => {
    observeServerTime('2026-08-18T12:00:00.000Z', Date.parse('2026-08-18T11:59:57.000Z'));

    expect(currentSkewMs()).toBe(-3_000);
  });

  it('reports zero, and no observation, before anything has been seen', () => {
    expect(currentSkewMs()).toBe(0);
    expect(hasSkewObservation()).toBe(false);
  });

  it('KEEPS a good measurement when a later response omits the field', () => {
    observeServerTime('2026-08-18T12:00:00.000Z', Date.parse('2026-08-18T12:00:05.000Z'));

    observeServerTime(undefined);
    observeServerTime(null);

    // Resetting to 0 here would make every running countdown jump by five seconds.
    expect(currentSkewMs()).toBe(5_000);
  });

  it('ignores a timestamp it cannot parse rather than treating it as zero', () => {
    observeServerTime('2026-08-18T12:00:00.000Z', Date.parse('2026-08-18T12:00:05.000Z'));
    observeServerTime('not a timestamp');

    expect(currentSkewMs()).toBe(5_000);
  });

  it('takes the newest observation, so a corrected clock is followed', () => {
    observeServerTime('2026-08-18T12:00:00.000Z', Date.parse('2026-08-18T12:00:05.000Z'));
    observeServerTime('2026-08-18T12:30:00.000Z', Date.parse('2026-08-18T12:30:00.000Z'));

    expect(currentSkewMs()).toBe(0);
  });
});

describe('the countdown reads server time, not device time', () => {
  it('counts to the server’s end instant even when the device clock is wrong', () => {
    // The device is a full minute fast. Against the raw device clock the service would appear to
    // end a minute early — which is exactly the customer-visible bug this exists to prevent.
    const deviceNow = Date.parse('2026-08-18T12:01:00.000Z');
    observeServerTime('2026-08-18T12:00:00.000Z', deviceNow);

    const clock = createServerClock(currentSkewMs(), () => deviceNow);
    const expectedEnd = Date.parse('2026-08-18T12:10:00.000Z');

    // Ten minutes of service remain by the SERVER's clock, not nine by the device's.
    expect(remainingMs(expectedEnd, clock.now())).toBe(10 * 60_000);
  });
});
