/**
 * Service-timezone arithmetic for the Schedule screen.
 *
 * ## Why the device clock is not the answer
 *
 * The backend returns every slot as an ISO **instant** and publishes the meal-period boundaries as
 * minutes-from-midnight in the SERVICE timezone (`catalogue.operatingWindow.timeZone`, currently
 * `Asia/Kolkata`). Reading those instants back with `Date#getHours` asks the DEVICE what time it
 * is, which is a different question: on a handset set to UTC a 12:00 IST slot reports 06:30 and
 * lands in MORNING, and the Aug 25 grid can be read as Aug 24. The boundaries and the instants
 * have to be compared in the same frame of reference, and the server's is the authoritative one.
 *
 * Nothing here decides availability. It converts an instant the server already sent into the local
 * wall-clock the server already used, so the two can be compared at all.
 *
 * ## Degrading rather than crashing
 *
 * `Intl` with a `timeZone` is available on the engines this app ships on, but a runtime that lacks
 * it must not take the screen down. Every helper falls back to the device's own reading — which is
 * exactly the behaviour this module replaces, so the worst case is the previous behaviour and
 * never a blank screen or a thrown render.
 */

export interface ServiceWallClock {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
}

const MINUTES_PER_DAY = 24 * 60;
const DAY_MS = 86_400_000;

function readParts(timeZone: string, instant: Date): ServiceWallClock | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(instant);

    const read = (type: string): number =>
      Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);

    const clock: ServiceWallClock = {
      year: read('year'),
      month: read('month'),
      day: read('day'),
      // `h23` still reports midnight as 24 on some implementations.
      hour: read('hour') % 24,
      minute: read('minute'),
    };

    return Object.values(clock).every((value) => Number.isFinite(value)) ? clock : null;
  } catch {
    return null;
  }
}

/** The wall clock the SERVICE would read for this instant, falling back to the device's. */
export function wallClockIn(timeZone: string | undefined, instant: Date): ServiceWallClock {
  const parts = timeZone === undefined ? null : readParts(timeZone, instant);
  if (parts !== null) return parts;

  return {
    year: instant.getFullYear(),
    month: instant.getMonth() + 1,
    day: instant.getDate(),
    hour: instant.getHours(),
    minute: instant.getMinutes(),
  };
}

/** Minutes from local midnight, in the service timezone. The unit the period boundaries use. */
export function localMinuteIn(timeZone: string | undefined, instant: Date): number {
  const clock = wallClockIn(timeZone, instant);
  return clock.hour * 60 + clock.minute;
}

/** The service calendar date (`YYYY-MM-DD`) an instant falls on. A date, never an instant. */
export function serviceDateIn(timeZone: string | undefined, instant: Date): string {
  const { year, month, day } = wallClockIn(timeZone, instant);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Calendar-date arithmetic, done on the DATE rather than on an instant.
 *
 * Anchoring `YYYY-MM-DD` at UTC midnight makes "+2 days" exact: it cannot be dragged across a
 * boundary by the device's offset the way adding to a local `Date` can.
 */
export function addServiceDays(serviceDate: string, offset: number): string {
  const anchored = Date.parse(`${serviceDate}T00:00:00Z`);
  if (!Number.isFinite(anchored)) return serviceDate;
  return new Date(anchored + offset * DAY_MS).toISOString().slice(0, 10);
}

/** A `YYYY-MM-DD` as the instant that renders it back unchanged under a UTC formatter. */
export function serviceDateAnchor(serviceDate: string): Date {
  return new Date(Date.parse(`${serviceDate}T00:00:00Z`));
}

/**
 * Formats a calendar date without letting the device's offset shift it.
 *
 * The parts are read at UTC against a UTC-anchored instant, so `2026-08-25` is Tuesday 25 Aug on
 * every handset rather than Monday 24 Aug on the ones behind India.
 */
export function formatServiceDate(
  serviceDate: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const anchor = serviceDateAnchor(serviceDate);
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(anchor);
  } catch {
    return anchor.toLocaleDateString(undefined, options);
  }
}

/** The start-time label, written on the service clock the slot was offered against. */
export function formatServiceTime(timeZone: string | undefined, instant: Date): string {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  if (timeZone !== undefined) {
    try {
      return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(instant);
    } catch {
      // Falls through to the device reading below.
    }
  }
  return instant.toLocaleTimeString(undefined, options);
}

/** Whether a minute-of-day sits inside a half-open period window. */
export function isWithinPeriod(
  minute: number,
  period: { readonly startMinute: number; readonly endMinute: number },
): boolean {
  if (minute < 0 || minute >= MINUTES_PER_DAY) return false;
  return minute >= period.startMinute && minute < period.endMinute;
}
