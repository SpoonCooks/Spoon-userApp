import { durationsFrom, rejectionMessageFor, scheduleFrom } from './adapters';
import type { Catalogue } from '@features/catalogue';
import type { ScheduleViewModel } from './types';

/** Minimal catalogue for the refusal cases: the periods matter, the prices do not. */
const CATALOGUE = {
  durations: [],
  operatingWindow: { timeZone: 'Asia/Kolkata', openLocalMinute: 300, closeLocalMinute: 1320 },
  scheduled: {
    horizonDays: 3,
    slotIntervalMinutes: 15,
    periods: [
      { id: 'MORNING', startMinute: 300, endMinute: 720 },
      { id: 'NOON', startMinute: 720, endMinute: 960 },
      { id: 'EVENING', startMinute: 960, endMinute: 1320 },
    ],
  },
} as unknown as Catalogue;

const BASE = {
  mode: 'book',
  title: 'Schedule',
  sectionTitles: { day: 'Day', time: 'Time', duration: 'Duration', startTime: 'Start time' },
  days: [],
  periods: [],
  slotsByPeriod: {},
  slotsPending: false,
  primaryCtaLabel: 'Book Now',
} as unknown as ScheduleViewModel;

/**
 * `275:4938`'s duration grid draws the SAME six options as `1:728`, written the same way. This
 * adapter used to carry its own copy of the label rule, converting only exact multiples of 60, so
 * the two identical grids disagreed: Instant read "1.5 hr" / "2.5 hrs" and Scheduled read
 * "90 mins" / "150 mins". Both now go through `durationLabelFor`.
 */
function catalogueWith(minutes: readonly number[]): Catalogue {
  return {
    durations: minutes.map((durationMinutes) => ({
      durationMinutes,
      serviceAmountPaise: durationMinutes * 100,
      taxAmountPaise: 0,
      totalAmountPaise: durationMinutes * 100,
      latestStartLocalMinute: 1290,
    })),
  } as unknown as Catalogue;
}

describe('scheduled duration tiles', () => {
  it('writes every duration the way the frames do', () => {
    const tiles = durationsFrom(catalogueWith([30, 45, 60, 90, 120, 150]));

    expect(tiles.map((tile) => tile.label)).toEqual([
      '30 min',
      '45 min',
      '1 hr',
      '1.5 hr',
      '2 hr',
      '2.5 hrs',
    ]);
  });

  it('keeps the id addressed to the server minutes', () => {
    expect(durationsFrom(catalogueWith([90])).map((tile) => tile.id)).toEqual(['dur-90']);
  });

  it('formats the price through the shared formatter', () => {
    // 6900 paise -> ₹69, with no fractional tail.
    const [tile] = durationsFrom(catalogueWith([69]));
    expect(tile?.price).toBe('₹69');
  });
});

/**
 * A day-level refusal must reach the customer in WORDS.
 *
 * The server declines a whole day by returning `slots: []` plus a `rejection`, and the reason used
 * to be carried on the view model and never drawn — so a covered-address refusal rendered as the
 * "Start time" heading over blank space, indistinguishable from a broken screen. That is the
 * defect observed on device.
 */
describe('a refused day says why', () => {
  /** The backend's `availabilityReasons` is a CLOSED set, so these are mapped, not guessed. */
  it('maps each day-level refusal the backend can send', () => {
    expect(rejectionMessageFor('NOT_SERVICEABLE')).toContain('does not reach this address');
    expect(rejectionMessageFor('SOCIETY_NOT_SUPPORTED')).toContain('not live in this society');
    expect(rejectionMessageFor('OUTSIDE_BOOKING_WINDOW')).toContain('outside the booking window');
    expect(rejectionMessageFor('DURATION_NOT_ALLOWED')).toContain('duration');
  });

  /**
   * An unrecognised code must claim NOTHING about the cause. A reason added to the backend
   * tomorrow must not be able to put words in the server's mouth — only the server knows whether
   * it was coverage, supply or the clock.
   */
  it('says nothing it cannot know about an unrecognised reason', () => {
    const message = rejectionMessageFor('SOME_FUTURE_REASON');

    expect(message).toContain('cannot be shown');
    expect(message).not.toMatch(/address|society|cook|window/i);
  });

  it('resolves the message onto the view model beside the raw code', () => {
    const schedule = scheduleFrom({
      base: BASE,
      catalogue: CATALOGUE,
      availability: {
        date: '2026-08-25',
        durationMinutes: 30,
        slots: [],
        rejection: 'SOCIETY_NOT_SUPPORTED',
        validUntil: '2026-08-25T10:00:30.000Z',
      },
      now: new Date('2026-08-25T06:00:00.000Z'),
    });

    // The code stays — it is the machine fact — and the words sit beside it.
    expect(schedule.slotsRejection).toBe('SOCIETY_NOT_SUPPORTED');
    expect(schedule.slotsMessage).toContain('not live in this society');
  });

  /** An ANSWERED day that simply refused nothing carries no message to draw. */
  it('carries no message when the server did not refuse the day', () => {
    const schedule = scheduleFrom({
      base: BASE,
      catalogue: CATALOGUE,
      availability: {
        date: '2026-08-25',
        durationMinutes: 30,
        slots: [],
        validUntil: '2026-08-25T10:00:30.000Z',
      },
      now: new Date('2026-08-25T06:00:00.000Z'),
    });

    expect(schedule.slotsRejection).toBeUndefined();
    expect(schedule.slotsMessage).toBeUndefined();
  });
});
