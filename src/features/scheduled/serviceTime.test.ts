import type { Catalogue } from '@features/catalogue';

import { slotsByPeriodFrom, daysFrom, toServiceDate } from './adapters';
import { addServiceDays, localMinuteIn, serviceDateIn, formatServiceTime } from './serviceTime';

/**
 * Meal-period grouping is a SERVICE-clock question.
 *
 * The backend sends instants and publishes the period boundaries as minutes from midnight in
 * `operatingWindow.timeZone`. Reading those instants with the DEVICE's clock compares two
 * different frames of reference, and a 12:00 IST slot then files under MORNING on a handset set to
 * UTC — the Noon section showing the wrong cards, or none.
 *
 * Every assertion below states the timezone explicitly, so the expected answer does not depend on
 * where the machine running the test happens to be.
 */

const NOON_START = 12 * 60;
const EVENING_START = 16 * 60;

function catalogueIn(timeZone: string): Catalogue {
  return {
    durations: [],
    operatingWindow: { timeZone, openLocalMinute: 300, closeLocalMinute: 1320 },
    scheduled: {
      horizonDays: 3,
      slotIntervalMinutes: 15,
      periods: [
        { id: 'MORNING', startMinute: 300, endMinute: NOON_START },
        { id: 'NOON', startMinute: NOON_START, endMinute: EVENING_START },
        { id: 'EVENING', startMinute: EVENING_START, endMinute: 1320 },
      ],
    },
  } as unknown as Catalogue;
}

/** The server's own answer shape: every candidate, bookable or not. */
function availabilityWith(starts: readonly string[]) {
  return {
    date: '2026-08-25',
    durationMinutes: 120,
    slots: starts.map((start) => ({ start, available: false, reason: 'NO_PRESENT_COOK' })),
    validUntil: '2026-08-23T10:00:30.000Z',
  };
}

function bucketOf(timeZone: string, isoStart: string): string | undefined {
  const buckets = slotsByPeriodFrom({
    catalogue: catalogueIn(timeZone),
    availability: availabilityWith([isoStart]),
  });
  return Object.keys(buckets).find((id) => buckets[id]?.length === 1);
}

describe('the service clock, not the device clock', () => {
  it('reads a slot instant in the published service timezone', () => {
    // 2026-08-25T06:30Z is 12:00 in Asia/Kolkata and 06:30 in UTC.
    const noonIst = new Date('2026-08-25T06:30:00.000Z');

    expect(localMinuteIn('Asia/Kolkata', noonIst)).toBe(NOON_START);
    expect(localMinuteIn('UTC', noonIst)).toBe(6 * 60 + 30);
  });

  it('buckets the SAME instant by the catalogue timezone, never the machine it runs on', () => {
    const noonIst = '2026-08-25T06:30:00.000Z';

    expect(bucketOf('Asia/Kolkata', noonIst)).toBe('NOON');
    // The bug this replaces, made explicit: read as UTC the same slot is a MORNING slot.
    expect(bucketOf('UTC', noonIst)).toBe('MORNING');
  });

  it('writes the card label on the service clock', () => {
    const label = formatServiceTime('Asia/Kolkata', new Date('2026-08-25T06:30:00.000Z'));
    // Locale decides the separator and the case of the meridiem; the HOUR is the assertion.
    expect(label).toMatch(/\b12\b/);
    expect(label.toLowerCase()).toContain('pm');
  });
});

describe('period boundaries are half-open and non-overlapping', () => {
  const cases: readonly [string, string, string][] = [
    // 11:45 IST — the last MORNING start.
    ['2026-08-25T06:15:00.000Z', 'MORNING', 'the minute before noon stays in MORNING'],
    // 12:00 IST — the first NOON start.
    ['2026-08-25T06:30:00.000Z', 'NOON', 'the noon cut point opens NOON'],
    // 15:45 IST — the last NOON start.
    ['2026-08-25T10:15:00.000Z', 'NOON', 'the minute before the evening cut stays in NOON'],
    // 16:00 IST — the first EVENING start.
    ['2026-08-25T10:30:00.000Z', 'EVENING', 'the evening cut point opens EVENING'],
  ];

  for (const [instant, expected, what] of cases) {
    it(what, () => {
      expect(bucketOf('Asia/Kolkata', instant)).toBe(expected);
    });
  }

  it('files every candidate in exactly one period', () => {
    const starts = [
      '2026-08-25T06:15:00.000Z',
      '2026-08-25T06:30:00.000Z',
      '2026-08-25T10:30:00.000Z',
    ];
    const buckets = slotsByPeriodFrom({
      catalogue: catalogueIn('Asia/Kolkata'),
      availability: availabilityWith(starts),
    });

    const total = Object.values(buckets).reduce((sum, slots) => sum + slots.length, 0);
    expect(total).toBe(starts.length);
  });
});

describe('the calendar day is the service day', () => {
  it('keeps a just-after-midnight IST slot on its own IST date', () => {
    // 2026-08-24T19:00Z is 00:30 on 25 Aug in India. A device-local reading calls it 24 Aug.
    expect(serviceDateIn('Asia/Kolkata', new Date('2026-08-24T19:00:00.000Z'))).toBe('2026-08-25');
    expect(serviceDateIn('UTC', new Date('2026-08-24T19:00:00.000Z'))).toBe('2026-08-24');
  });

  it('asks the availability endpoint for the service day', () => {
    expect(toServiceDate(new Date('2026-08-24T19:00:00.000Z'), 'Asia/Kolkata')).toBe('2026-08-25');
  });

  it('steps the day strip on the DATE so no offset can drag it across a boundary', () => {
    expect(addServiceDays('2026-08-23', 2)).toBe('2026-08-25');
    expect(addServiceDays('2026-08-31', 1)).toBe('2026-09-01');
  });

  it('labels Tuesday 25 Aug as Tuesday on any handset', () => {
    const days = daysFrom(catalogueIn('Asia/Kolkata'), new Date('2026-08-23T06:00:00.000Z'));

    expect(days.map((day) => day.id)).toEqual(['2026-08-23', '2026-08-24', '2026-08-25']);
    expect(days[2]?.caption).toBe('TUE');
    expect(days[2]?.label).toContain('25');
  });
});
