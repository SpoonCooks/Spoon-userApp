import type { Catalogue } from '@features/catalogue';

import { slotsByPeriodFrom, daysFrom, periodsFrom, toServiceDate } from './adapters';
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
    // The FULL weekday, matching "TODAY" and "TOMORROW" beside it rather than abbreviating.
    expect(days[2]?.caption).toBe('TUESDAY');
    expect(days[2]?.label).toContain('25');
  });

  it('rolls the strip to tomorrow once today’s last published start has passed', () => {
    // The shortest duration may start until 21:30 IST — the catalogue's own latest start.
    const catalogue = {
      ...catalogueIn('Asia/Kolkata'),
      durations: [{ latestStartLocalMinute: 21 * 60 + 30 }, { latestStartLocalMinute: 20 * 60 }],
    } as unknown as Parameters<typeof daysFrom>[0];

    // 21:29 IST — one bookable minute left, so today still leads the strip.
    const before = daysFrom(catalogue, new Date('2026-08-23T15:59:00.000Z'));
    expect(before[0]?.id).toBe('2026-08-23');
    expect(before[0]?.caption).toBe('TODAY');

    // 21:30 IST — today's slots are finished; the strip leads with tomorrow, captioned as such,
    // and still offers the full published horizon.
    const after = daysFrom(catalogue, new Date('2026-08-23T16:00:00.000Z'));
    expect(after.map((day) => day.id)).toEqual(['2026-08-24', '2026-08-25', '2026-08-26']);
    expect(after[0]?.caption).toBe('TOMORROW');
  });
});

/**
 * The meal-period chips, gated by the SERVICE clock.
 *
 * A period whose window has entirely elapsed cannot hold a bookable start — every candidate in it
 * comes back `SLOT_IN_PAST` from the scheduler — so the chip that leads there is drawn disabled
 * rather than opening a duration section over a grid of uniformly grey cards.
 *
 * The boundaries are the catalogue's and the reading is in `operatingWindow.timeZone`, so these
 * assertions hold wherever the test machine is. Every instant below is stated in UTC and
 * annotated with its IST wall clock.
 */
describe('elapsed meal periods are not selectable', () => {
  const catalogue = catalogueIn('Asia/Kolkata');
  const disabledIds = (now: Date, serviceDate?: string) =>
    periodsFrom(catalogue, { now, ...(serviceDate === undefined ? {} : { serviceDate }) })
      .filter((period) => period.disabled === true)
      .map((period) => period.id);

  it('offers all three early in the morning', () => {
    // 02:30Z is 08:00 IST — inside MORNING, which runs to 12:00.
    expect(disabledIds(new Date('2026-08-25T02:30:00.000Z'))).toEqual([]);
  });

  it('closes MORNING once noon has passed', () => {
    // 08:00Z is 13:30 IST — MORNING is behind us, NOON is running.
    expect(disabledIds(new Date('2026-08-25T08:00:00.000Z'))).toEqual(['MORNING']);
  });

  it('leaves only EVENING clickable in the evening', () => {
    // 12:30Z is 18:00 IST — the founder's case: morning and noon are gone.
    expect(disabledIds(new Date('2026-08-25T12:30:00.000Z'))).toEqual(['MORNING', 'NOON']);
  });

  it('keeps a period alive while its window is still open', () => {
    // 06:29Z is 11:59 IST — MORNING has one minute left and stays selectable. Whether any start
    // in that minute is bookable is the server's question, answered as greyed cards in the grid.
    expect(disabledIds(new Date('2026-08-25T06:29:00.000Z'))).toEqual([]);
  });

  it('gates TODAY only — a future day is wholly ahead of the clock', () => {
    // 18:00 IST on the 25th, asking about the 26th: tomorrow's morning is bookable tonight.
    expect(disabledIds(new Date('2026-08-25T12:30:00.000Z'), '2026-08-26')).toEqual([]);
  });

  it('treats an unstated date as today, which is what the availability read defaults to', () => {
    const now = new Date('2026-08-25T12:30:00.000Z');
    expect(disabledIds(now)).toEqual(disabledIds(now, '2026-08-25'));
  });
});
