import { bookingDetailFrom, summaryFrom, trackingDetailFrom } from './adapters';
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

  it('keeps the designed ETA copy when the server has no ETA', () => {
    // A null ETA is a legitimate state (no cook is travelling yet). It is not an empty string.
    const view = trackingDetailFrom({ base: BASE, dto: tracking() });

    expect(view.tracking?.etaLabel).toBe('DESIGNED ETA');
  });

  it('keeps the designed ETA copy when the server sends an unparseable instant', () => {
    const view = trackingDetailFrom({
      base: BASE,
      dto: tracking({ eta: { estimatedArrivalAt: 'not-a-date', updatedAt: null } }),
    });

    expect(view.tracking?.etaLabel).toBe('DESIGNED ETA');
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
