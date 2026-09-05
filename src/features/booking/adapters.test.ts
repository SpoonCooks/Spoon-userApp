import {
  blockedNotesFrom,
  bookingDetailFrom,
  bookingRowsFrom,
  summaryFrom,
  trackingDetailFrom,
} from './adapters';
import { DEMO_BOOKING_CONFIRMATION } from '@/demo/fixtures/booking';
import type { BookingDetailDto, TrackingDto } from './api';
import type { BookingDetailViewModel } from './types';

/**
 * The tracking layer of the lifecycle view model.
 *
 * These assertions exist because the service OTP is the one field on these screens that is both
 * SAFETY-relevant (the customer reads it out to a stranger at their door) and server-owned. A
 * client that renders a stale, cached or invented code is worse than one that renders nothing —
 * so "the server withheld it" and "the server supplied it" are tested as distinct outcomes.
 */

const BASE = {
  view: 'enRoute',
  tracking: {
    bannerTitle: 'On the way',
    bannerMessage: 'Rekha is heading over',
    tone: 'positive',
    etaLabel: 'DESIGNED ETA',
    noteTitle: 'Note',
    noteBody: 'Keep the gate open',
    viewDetailsLabel: 'View booking details',
    cancelLabel: 'Cancel',
    rescheduleLabel: 'Reschedule',
  },
  arrived: {
    bannerTitle: 'Arrived',
    bannerMessage: 'Rekha is at your gate',
    tone: 'positive',
    etaLabel: 'DESIGNED ETA',
    noteTitle: 'Note',
    noteBody: 'Keep the gate open',
    viewDetailsLabel: 'View booking details',
    cancelLabel: 'Cancel',
    rescheduleLabel: 'Reschedule',
    startCtaLabel: 'Start service',
    otpTitle: 'Start code',
    otpCaption: 'Share with your cook',
    otpCode: 'DESIGNED',
  },
  inService: {
    statusTitle: 'Cooking',
    statusMessage: 'Service in progress',
    endsAtMs: 0,
    clockSkewMs: 0,
    extendCtaLabel: 'Extend',
    endCtaLabel: 'End',
    otpTitle: 'End code',
    otpCaption: 'Share with your cook',
    otpCode: 'DESIGNED',
    noteTitle: 'Note',
    noteBody: 'Keep the gate open',
    extendPrompt: 'Need more time?',
    viewDetailsLabel: 'View booking details',
  },
} as unknown as BookingDetailViewModel;

function tracking(overrides: Partial<TrackingDto> = {}): TrackingDto {
  return {
    bookingId: 'booking-1',
    status: 'cook_en_route',
    eta: { estimatedArrivalAt: null, updatedAt: null },
    ...overrides,
  } as TrackingDto;
}

describe('trackingDetailFrom', () => {
  it('uses the backend-confirmed arrival message and persisted arrival time', () => {
    const arrivedAt = new Date('2026-08-18T09:35:00.000Z');
    const view = bookingDetailFrom({
      base: { ...BASE, view: 'arrived' },
      dto: {
        id: 'booking-1',
        status: 'cook_arrived',
        address: { flat: null, society: null, street: '', city: null },
        cook: null,
        timing: { arrivedAt: arrivedAt.toISOString() },
        allowedActions: {
          canCancel: false,
          canReschedule: false,
          canExtend: false,
          canRate: false,
          canTip: false,
          canCallCook: false,
        },
      } as unknown as BookingDetailDto,
    });

    expect(view.arrived?.bannerMessage).toBe('Cook has arrived at your location');
    expect(view.arrived?.etaLabel).toBe(
      arrivedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    );
  });

  it('renders the start code the server supplies on the Arrived screen', () => {
    const view = trackingDetailFrom({
      base: BASE,
      dto: tracking({ status: 'cook_arrived', serviceOtp: { start: '4821', end: null } }),
    });

    expect(view.arrived?.otpCode).toBe('4821');
    // The END code is a different window; a start-only payload must not fill it in.
    expect(view.inService?.otpCode).toBe('DESIGNED');
  });

  it('renders the end code on the In-service screen', () => {
    const view = trackingDetailFrom({
      base: BASE,
      dto: tracking({ status: 'cooking', serviceOtp: { start: null, end: '9134' } }),
    });

    expect(view.inService?.otpCode).toBe('9134');
    expect(view.arrived?.otpCode).toBe('DESIGNED');
  });

  it('leaves the designed copy alone when the server withholds a code', () => {
    // A consumed or out-of-window code comes back null. Nothing may substitute for it — not a
    // remembered value, not a placeholder that reads like a code.
    const view = trackingDetailFrom({
      base: BASE,
      dto: tracking({ serviceOtp: { start: null, end: null } }),
    });

    expect(view.arrived?.otpCode).toBe('DESIGNED');
    expect(view.inService?.otpCode).toBe('DESIGNED');
  });

  it('leaves the designed copy alone when the payload carries no serviceOtp at all', () => {
    const view = trackingDetailFrom({ base: BASE, dto: tracking() });

    expect(view.arrived?.otpCode).toBe('DESIGNED');
    expect(view.inService?.otpCode).toBe('DESIGNED');
  });

  /**
   * `9a` reads "Cook is arriving in" over "16 mins" — a DURATION.
   *
   * This used to render the arrival instant as a clock time, so the screen said "Cook Test Cook is
   * arriving in / 7:38 AM": the wrong quantity, under a label that does not finish as a sentence.
   * Seen on the handset on 2026-09-02.
   */
  const etaLabelIn = (millisFromNow: number, scheduledStartIso?: string | null) =>
    trackingDetailFrom({
      base: BASE,
      dto: tracking({
        eta: {
          estimatedArrivalAt: new Date(Date.now() + millisFromNow).toISOString(),
          updatedAt: null,
        },
      }),
      ...(scheduledStartIso === undefined ? {} : { scheduledStartIso }),
    }).tracking?.etaLabel;

  it('renders the server ETA as minutes remaining, not a clock time', () => {
    expect(etaLabelIn(16 * 60_000)).toBe('16 mins');
  });

  it('says one minute in the singular', () => {
    expect(etaLabelIn(75_000)).toBe('1 min');
  });

  /**
   * Never earlier than the booking the customer bought.
   *
   * The projection answers "when would she get there if she left now", and a cook who sets off
   * early gets there early. At 11:06 for an 11:30 booking the customer was told the cook arrives
   * in TWO MINUTES — true about the walk, useless as a promise, and a customer who believes it
   * goes and waits at the door for twenty minutes.
   */
  it('never promises an arrival before the booking starts', () => {
    // Cook two minutes away; booking still half an hour off.
    const label = etaLabelIn(2 * 60_000, new Date(Date.now() + 30 * 60_000).toISOString());
    expect(label).toBe('30 mins');
  });

  it('still reports a late arrival honestly', () => {
    // Projected after the start, so the projection wins and the delay is not hidden.
    const label = etaLabelIn(40 * 60_000, new Date(Date.now() + 30 * 60_000).toISOString());
    expect(label).toBe('40 mins');
  });

  it('agrees with the Home banner and the Cook App on rounding', () => {
    // Both round; this briefly used `Math.ceil`, so the booking page said "3 mins" while Home and
    // the cook's own card said 2 for the same arrival.
    expect(etaLabelIn(2 * 60_000 + 20_000)).toBe('2 mins');
  });

  it('does not print a zero or a negative once the ETA has passed', () => {
    // Reachable: a stalled cook, or a refresh that lands after the projection. "0 mins" and
    // "-2 mins" both read as broken rather than imminent; the banner's own late copy carries the
    // story, and this says only that the wait is short.
    expect(etaLabelIn(-5 * 60_000)).toBe('< 1 min');
    expect(etaLabelIn(0)).toBe('< 1 min');
  });

  it('keeps every ETA label inside the fixed panel it is drawn in', () => {
    /*
     * `94:1097` is a fixed 122pt panel and the label is `numberOfLines={1}`, so a label the panel
     * cannot fit is ellipsised with no other symptom. "Any moment" produced "Any mo…" on a live
     * banner — a screen telling the customer nothing while looking like it worked.
     *
     * "16 mins" is the widest label the panel is known to render whole (the horizontal inset was
     * cut from 8 to 5 for exactly that string), so its length is the budget every branch must
     * stay inside.
     */
    const BUDGET = '16 mins'.length;
    /*
     * Up to 45 minutes, because that is `BOOKING_MAX_EARLY_DEPARTURE_MINUTES` — travel cannot
     * legitimately begin earlier, so no larger figure can reach this banner, and two digits is
     * the widest number it has to draw. A three-digit ETA would not fit the panel either; if the
     * departure bound is ever raised, this test is the thing that should stop it quietly.
     */
    const tooWide = [-5 * 60_000, 0, 30_000, 60_000, 9 * 60_000, 45 * 60_000]
      .map((ms) => etaLabelIn(ms) ?? '')
      .filter((label) => label.length > BUDGET);
    expect(tooWide).toEqual([]);
  });

  it('uses the persisted arrival instant from tracking when it is present', () => {
    const arrivedAt = new Date('2026-08-18T09:35:00.000Z');
    const view = trackingDetailFrom({
      base: { ...BASE, view: 'arrived' },
      dto: tracking({ status: 'cook_arrived', arrivedAt: arrivedAt.toISOString() }),
    });

    expect(view.arrived?.etaLabel).toBe(
      arrivedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    );
  });

  it('removes the designed ETA and on-time copy when the server has no ETA', () => {
    // A null ETA is a legitimate state. It must render as unavailable, never as the frame's
    // transcribed number or punctuality claim.
    const view = trackingDetailFrom({ base: BASE, dto: tracking() });

    expect(view.tracking?.etaLabel).toBe('—');
    expect(view.tracking?.tone).toBe('neutral');
    expect(view.tracking?.bannerMessage).toBe('Cook arrival time is not available yet.');
  });

  it('removes the designed ETA when the server sends an unparseable instant', () => {
    const view = trackingDetailFrom({
      base: BASE,
      dto: tracking({ eta: { estimatedArrivalAt: 'not-a-date', updatedAt: null } }),
    });

    expect(view.tracking?.etaLabel).toBe('—');
    expect(view.tracking?.tone).toBe('neutral');
  });

  it('never renders on-time styling for an UNKNOWN verdict', () => {
    const view = trackingDetailFrom({
      base: BASE,
      dto: tracking({
        eta: { estimatedArrivalAt: '2026-08-18T09:35:00.000Z', updatedAt: null },
        timingVerdict: 'UNKNOWN',
      }),
    });

    expect(view.tracking?.tone).toBe('neutral');
    expect(view.tracking?.bannerMessage).toBe('Cook arrival status is being updated.');
  });
});

const SUMMARY_DTO = {
  id: 'booking-1',
  status: 'assigned',
  slotType: 'scheduled',
  scheduledStart: '2026-08-20T09:00:00.000Z',
  durationMinutes: 30,
  price: {
    amountPaise: 7245,
    durationMinutes: 30,
    serviceAmountPaise: 6900,
    taxRateBps: 500,
    taxAmountPaise: 345,
    totalAmountPaise: 7245,
    currency: 'INR',
    pricingVersion: 'pricing-v1',
  },
  address: { flat: null, society: null, street: 'Test Street', city: 'Bengaluru' },
  timing: { arrivedAt: null, actualStart: null, expectedEnd: null, actualEnd: null },
  cook: null,
  mealNotes: null,
  referenceUrl: null,
  mealBrief: null,
  reassignment: { occurred: false, sequence: 0, reassignedAt: null },
  cancellation: null,
  allowedActions: {
    canCancel: true,
    canReschedule: false,
    canExtend: false,
    canRate: false,
    canTip: false,
    canCallCook: false,
  },
} as unknown as BookingDetailDto;

describe('summaryFrom server-owned action and recovery state', () => {
  it('maps canReschedule instead of leaking the design fixture value', () => {
    expect(
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: {
          ...SUMMARY_DTO,
          allowedActions: { ...SUMMARY_DTO.allowedActions, canReschedule: true },
        },
      }).rescheduleAllowed,
    ).toBe(true);
    expect(
      summaryFrom({ base: DEMO_BOOKING_CONFIRMATION.summary!, dto: SUMMARY_DTO }).rescheduleAllowed,
    ).toBe(false);
  });

  /*
   * The Reschedule button is hidden, not disabled. On an instant booking — every booking placed in
   * the Delhi pilot — it is never offered, and once cancellation was closed too the action row
   * vanished whole and the screen explained none of it. The note is what the customer reads
   * instead, so it is mapped from the server's reason rather than inferred from the slot type
   * here, which would put a second copy of the policy in the client.
   */
  it('explains a withheld reschedule, and stays quiet when the banner already says why', () => {
    const withReason = (reason: string | undefined) =>
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: {
          ...SUMMARY_DTO,
          allowedActions: { ...SUMMARY_DTO.allowedActions, rescheduleBlockedReason: reason },
        } as BookingDetailDto,
      }).rescheduleBlockedNote;

    expect(withReason('INSTANT_NOT_RESCHEDULABLE')).toContain('cannot be moved to another time');
    expect(withReason('ALREADY_RESCHEDULED')).toContain('already been moved once');
    // The banner above already reports these, and a second line under the buttons only repeats it.
    expect(withReason('COOK_DISPATCHED')).toBeUndefined();
    expect(withReason('BOOKING_COMPLETED')).toBeUndefined();
    // A code this build has never heard of must read as "no explanation", never as a crash.
    expect(withReason('SOME_REASON_SHIPPED_LATER')).toBeUndefined();
    expect(withReason(undefined)).toBeUndefined();
  });

  /*
   * Cancel is withheld on every instant booking once it has a cook, and instant is the only
   * kind the pilot places — so without a line here the control just disappears from the busiest
   * screen in the product and the customer is left guessing.
   */
  it('explains a withheld cancel, and stays quiet when the banner already says why', () => {
    const withReason = (reason: string | undefined) =>
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: {
          ...SUMMARY_DTO,
          allowedActions: { ...SUMMARY_DTO.allowedActions, cancelBlockedReason: reason },
        } as BookingDetailDto,
      }).cancelBlockedNote;

    expect(withReason('INSTANT_CONFIRMED')).toContain('cannot be cancelled or moved');
    expect(withReason('COOK_DISPATCHED')).toContain('Your cook has arrived');
    // Terminal states are already the whole subject of the banner above.
    expect(withReason('BOOKING_COMPLETED')).toBeUndefined();
    expect(withReason('BOOKING_ALREADY_CANCELLED')).toBeUndefined();
    // A code shipped later must read as "no explanation", never as a crash.
    expect(withReason('SOMETHING_NEW')).toBeUndefined();
    expect(withReason(undefined)).toBeUndefined();
  });

  it('renders a support handoff as attention rather than confirmation', () => {
    const summary = summaryFrom({
      base: DEMO_BOOKING_CONFIRMATION.summary!,
      dto: {
        ...SUMMARY_DTO,
        recovery: { state: 'support_handoff', openedAt: '2026-08-20T10:00:00.000Z' },
      } as BookingDetailDto,
    });

    expect(summary).toMatchObject({
      bannerTitle: 'This booking needs attention',
      tone: 'warning',
      rescheduleAllowed: false,
    });
  });
});

/**
 * `687:75` Page 6d — the Rescheduled flow's confirmation.
 *
 * It is the confirmed frame with one word changed, and the customer was landing on it after a
 * reschedule still reading "Booking confirmed!" — the reschedule appeared not to have happened.
 * The distinguishing fact is the SERVER's `rescheduleCount`; a rescheduled booking keeps its
 * status and only its `serviceStart` moves.
 */
describe('the confirmation banner says what happened to the booking', () => {
  it('says Rescheduled once the server reports the booking was moved', () => {
    const summary = summaryFrom({
      base: DEMO_BOOKING_CONFIRMATION.summary!,
      dto: { ...SUMMARY_DTO, rescheduleCount: 1 } as BookingDetailDto,
    });

    expect(summary.bannerTitle).toBe('Rescheduled!');
  });

  it('still says confirmed for a booking that was never moved', () => {
    expect(
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: { ...SUMMARY_DTO, rescheduleCount: 0 } as BookingDetailDto,
      }).bannerTitle,
    ).toBe(DEMO_BOOKING_CONFIRMATION.summary!.bannerTitle);
  });

  it('falls back to confirmed against a deployment that does not publish the count', () => {
    // The field is nullish precisely so an older API keeps working rather than blanking a banner.
    expect(
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: SUMMARY_DTO,
      }).bannerTitle,
    ).toBe(DEMO_BOOKING_CONFIRMATION.summary!.bannerTitle);
  });

  it('lets a support handoff outrank it — that is the more urgent thing to say', () => {
    const summary = summaryFrom({
      base: DEMO_BOOKING_CONFIRMATION.summary!,
      dto: {
        ...SUMMARY_DTO,
        rescheduleCount: 1,
        recovery: { state: 'support_handoff', openedAt: '2026-08-20T10:00:00.000Z' },
      } as BookingDetailDto,
    });

    expect(summary.bannerTitle).toBe('This booking needs attention');
  });
});

/**
 * Date / Start time / Duration / End Time — all four read on ONE clock.
 *
 * `End Time` switches to the real end as soon as the Start OTP is verified. `Start time` did not,
 * so a service booked for 2:00 that began at 1:54 drew "2:00 PM" beside "2:24 PM" and "30 mins":
 * twenty-four minutes labelled thirty, because the two rows were measuring from different starts.
 * Reported from the handset on 2026-09-03.
 */
describe('the booking details rows agree with each other', () => {
  const dto = (timing: Record<string, unknown>): BookingDetailDto =>
    ({
      scheduledStart: '2026-09-03T08:30:00.000Z', // 2:00 PM IST
      durationMinutes: 30,
      timing: { arrivedAt: null, scheduledEnd: null, actualEnd: null, ...timing },
    }) as never;

  const valueOf = (rows: readonly { label: string; value: string }[], label: string): string =>
    rows.find((row) => row.label === label)?.value ?? '';

  it('runs the row from the real start once cooking has begun', () => {
    const rows = bookingRowsFrom(
      dto({
        actualStart: '2026-09-03T08:24:00.000Z', // 1:54 PM IST
        expectedEnd: '2026-09-03T08:54:00.000Z', // 2:24 PM IST
      }),
    );

    // Start and End are thirty minutes apart, which is what the Duration row already claimed.
    const start = valueOf(rows, 'Start time');
    const end = valueOf(rows, 'End Time');
    expect(valueOf(rows, 'Duration')).toBe('30 mins');
    expect(start).not.toBe(end);
    expect(minutesBetween(start, end)).toBe(30);
  });

  /*
   * Before the Start OTP there is no actual start, and the booked time is both the only honest
   * answer and the one the customer is waiting on.
   */
  it('keeps the booked time until the service actually starts', () => {
    const rows = bookingRowsFrom(dto({ actualStart: null, expectedEnd: null }));

    expect(valueOf(rows, 'Start time')).toBe(
      new Date('2026-09-03T08:30:00.000Z').toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    );
  });
});

/** Minutes between two rendered `h:mm AM/PM` strings, for the agreement check above. */
function minutesBetween(from: string, to: string): number {
  const parse = (value: string): number => {
    const match = /(\d+):(\d+)\s*([AP]M)?/i.exec(value);
    if (match === null) return Number.NaN;
    const hour = Number(match[1]) % 12;
    const pm = (match[3] ?? '').toUpperCase() === 'PM';
    return (hour + (pm ? 12 : 0)) * 60 + Number(match[2]);
  };
  return parse(to) - parse(from);
}

/**
 * One fact, said once.
 *
 * Cancel and Reschedule are separate rulings, and an instant booking refuses both for the same
 * reason. Each note was built on its own, so the screen printed two paragraphs saying the same
 * thing in different words -- "cannot be cancelled or moved to another time" directly above
 * "cannot be moved to another time". From the handset, 2026-09-04.
 */
describe('the blocked-action notes', () => {
  it('says it once for an instant booking', () => {
    const notes = blockedNotesFrom({
      cancelBlockedReason: 'INSTANT_CONFIRMED',
      rescheduleBlockedReason: 'INSTANT_NOT_RESCHEDULABLE',
    });

    // The cancel sentence names both refusals, so it is the only one that appears.
    expect(notes.cancelBlockedNote).toContain('cannot be cancelled or moved to another time');
    expect(notes.rescheduleBlockedNote).toBeUndefined();
  });

  /* Two genuinely different reasons are two genuinely different things to say. */
  it('keeps both when the reasons differ', () => {
    const notes = blockedNotesFrom({
      cancelBlockedReason: 'COOK_DISPATCHED',
      rescheduleBlockedReason: 'ALREADY_RESCHEDULED',
    });

    expect(notes.cancelBlockedNote).toContain('arrived');
    expect(notes.rescheduleBlockedNote).toContain('already been moved once');
  });

  it('says nothing when nothing is blocked', () => {
    expect(blockedNotesFrom({})).toEqual({});
  });
});
