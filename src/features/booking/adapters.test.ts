import { bookingDetailFrom, bookingRowsFrom, summaryFrom, trackingDetailFrom } from './adapters';
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

  it('renders the server ETA on the tracking banner', () => {
    const at = new Date('2026-08-18T09:35:00.000Z');
    const view = trackingDetailFrom({
      base: BASE,
      dto: tracking({ eta: { estimatedArrivalAt: at.toISOString(), updatedAt: null } }),
    });

    expect(view.tracking?.etaLabel).toBe(
      at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    );
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

  /**
   * The deployed detail endpoint has always sent `rescheduleCount`; it was undeclared in the
   * schema, so Zod stripped it and the banner could not tell a moved booking from a fresh one.
   * These pin the field's presence as much as the copy.
   */
  it('says a booking was moved when the server says it was', () => {
    expect(
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: { ...SUMMARY_DTO, rescheduleCount: 1 } as BookingDetailDto,
      }).bannerTitle,
    ).toBe('Booking rescheduled!');
  });

  it('leaves a booking that was never moved saying what it said before', () => {
    for (const rescheduleCount of [0, null, undefined]) {
      expect(
        summaryFrom({
          base: DEMO_BOOKING_CONFIRMATION.summary!,
          dto: { ...SUMMARY_DTO, rescheduleCount } as BookingDetailDto,
        }).bannerTitle,
      ).toBe(DEMO_BOOKING_CONFIRMATION.summary!.bannerTitle);
    }
  });

  /**
   * `created` is the server saying the payment has not settled. The screen it lands on is headed
   * "Booking confirmed!", so without this it announced a confirmation for a booking nobody had
   * paid for -- reachable by killing the app while Razorpay is open, which is the one path that
   * leaves a hold alive (dismissing checkout cancels it server-side).
   */
  it('does not call an unsettled hold confirmed', () => {
    const summary = summaryFrom({
      base: DEMO_BOOKING_CONFIRMATION.summary!,
      dto: { ...SUMMARY_DTO, status: 'created' } as BookingDetailDto,
    });

    expect(summary).toMatchObject({
      bannerTitle: 'Payment pending!',
      tone: 'warning',
      /* The banner and the ACTIONS are one decision -- see `paymentPending` on the view model. */
      paymentPending: true,
    });
  });

  /** The ordinary confirmed screen keeps its action pair: the flag is set for `created` alone. */
  it('does not mark a settled booking as awaiting payment', () => {
    for (const status of ['assigned', 'cook_en_route', 'cooking', 'completed'] as const) {
      expect(
        summaryFrom({
          base: DEMO_BOOKING_CONFIRMATION.summary!,
          dto: { ...SUMMARY_DTO, status } as BookingDetailDto,
        }).paymentPending,
      ).toBeUndefined();
    }
  });

  /** A paid booking with no cook matched yet is still confirmed, and must keep saying so. */
  it('leaves an assigned booking confirmed', () => {
    expect(
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: { ...SUMMARY_DTO, status: 'assigned' } as BookingDetailDto,
      }).bannerTitle,
    ).toBe(DEMO_BOOKING_CONFIRMATION.summary!.bannerTitle);
  });

  /** Unpaid outranks moved: what matters more is that it is not paid for. */
  it('says payment is pending on a hold that was also rescheduled', () => {
    expect(
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: { ...SUMMARY_DTO, status: 'created', rescheduleCount: 1 } as BookingDetailDto,
      }).bannerTitle,
    ).toBe('Payment pending!');
  });

  /** A problem to act on outranks how the slot was arrived at. */
  it('lets a support handoff outrank the rescheduled banner', () => {
    expect(
      summaryFrom({
        base: DEMO_BOOKING_CONFIRMATION.summary!,
        dto: {
          ...SUMMARY_DTO,
          rescheduleCount: 1,
          recovery: { state: 'support_handoff', openedAt: '2026-08-20T10:00:00.000Z' },
        } as BookingDetailDto,
      }).bannerTitle,
    ).toBe('This booking needs attention');
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
 * `250:2861` — the Start time / End Time rows behind "View booking details".
 *
 * Service begins when the customer hands over the OTP, which the server reports as
 * `timing.actualStart`. These rows read `scheduledStart` alone, so a cook who arrived late left
 * the customer looking at a start time that had already passed with nothing having happened.
 */
describe('bookingRowsFrom — the times the customer actually experienced', () => {
  const row = (dto: BookingDetailDto, label: string) =>
    bookingRowsFrom(dto).find((entry) => entry.label === label)?.value;

  const withTiming = (timing: Record<string, string | null>): BookingDetailDto =>
    ({
      ...SUMMARY_DTO,
      scheduledStart: '2026-08-20T06:00:00.000Z',
      timing: { arrivedAt: null, actualStart: null, expectedEnd: null, actualEnd: null, ...timing },
    }) as BookingDetailDto;

  it('reads the start from the OTP handover once service has begun', () => {
    const dto = withTiming({
      actualStart: '2026-08-20T06:30:00.000Z',
      expectedEnd: '2026-08-20T07:30:00.000Z',
    });

    // 6:30, the actual start — NOT the 6:00 that was booked.
    expect(row(dto, 'Start time')).toBe(
      new Date('2026-08-20T06:30:00.000Z').toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    );
  });

  it('falls back to the booked start before service has begun', () => {
    expect(row(withTiming({}), 'Start time')).toBe(
      new Date('2026-08-20T06:00:00.000Z').toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    );
  });

  /**
   * The end is the SERVER's projection, never start + duration computed here: an extended
   * booking's end moves without `durationMinutes` moving with it, so arithmetic would
   * under-report every extended service.
   */
  it('prefers the actual end once the service is over', () => {
    const dto = withTiming({
      actualStart: '2026-08-20T06:30:00.000Z',
      expectedEnd: '2026-08-20T07:30:00.000Z',
      actualEnd: '2026-08-20T07:28:00.000Z',
    });

    expect(row(dto, 'End Time')).toBe(
      new Date('2026-08-20T07:28:00.000Z').toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    );
  });

  it('shows no end time when the server has projected none', () => {
    expect(row(withTiming({ actualStart: '2026-08-20T06:30:00.000Z' }), 'End Time')).toBe('—');
  });

  /**
   * The Duration row sits between the two, so it has to agree with them.
   *
   * `durationMinutes` is the original PRICED duration and never moves when a booking is extended
   * -- pricing and capacity key off it. `totalDurationMinutes` is the server's sum of it and every
   * confirmed extension, and is the only field that can describe an extended service.
   */
  it('reads the Duration row from the served duration once a booking is extended', () => {
    const dto = {
      ...withTiming({
        actualStart: '2026-08-20T06:30:00.000Z',
        expectedEnd: '2026-08-20T07:45:00.000Z',
      }),
      durationMinutes: 45,
      totalDurationMinutes: 75,
    } as BookingDetailDto;

    // 75, matching 6:30 -> 7:45 — NOT the 45 minutes that were priced.
    expect(row(dto, 'Duration')).toBe('75 mins');
  });

  it('falls back to the priced duration while the server sends no total', () => {
    const dto = { ...withTiming({}), durationMinutes: 45 } as BookingDetailDto;

    expect(row(dto, 'Duration')).toBe('45 mins');
  });
});
