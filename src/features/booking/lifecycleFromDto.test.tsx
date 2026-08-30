import { screen } from '@testing-library/react-native';

import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';
import type { StubHandlers } from '@/test/renderWithRuntime';

import { BookingDetailScreen } from './screens/BookingDetailScreen';

/**
 * The booking lifecycle, driven by REAL `GET /v1/bookings/:id` payloads.
 *
 * ## Why this file exists
 *
 * Every other lifecycle test renders a fixture view model directly. That proves the presentation
 * is right and proves nothing at all about the pipeline in front of it — which is exactly where
 * the defect was. `DEV_BASE_FOR_STATUS` was keyed by VIEW names (`enRoute`, `arrived`,
 * `completion`) and indexed by BACKEND statuses (`cook_en_route`, `cook_arrived`, `completed`),
 * so every lookup missed, every real booking fell back to the confirmation copy, and the host
 * then rendered its generic "This booking is being updated" fallback because that copy carries
 * none of the sub-models the live views need.
 *
 * A presentational test cannot see any of that. So these mount the REAL screen over the REAL
 * hooks and a stub transport, and assert on what a customer would see for each backend status.
 *
 * The payloads below are the contract's shape — `bookingDetailSchema` parses every one of them,
 * so a field renamed server-side fails here rather than silently rendering an empty screen.
 */

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';
const COOK_ID = '22222222-2222-4222-8222-222222222222';

const PRICE = {
  amountPaise: 13545,
  durationMinutes: 60,
  serviceAmountPaise: 12900,
  taxRateBps: 500,
  taxAmountPaise: 645,
  totalAmountPaise: 13545,
  currency: 'INR' as const,
  pricingVersion: 'pricing-policy-v0',
};

const ADDRESS = {
  label: 'Home',
  latitude: 12.902429,
  longitude: 77.649321,
  flat: 'E102',
  tower: null,
  society: 'Purva Skydale',
  street: 'Silver County Road',
  pincode: '560102',
  city: 'Bengaluru',
  state: 'Karnataka',
  hubName: 'Bengaluru Hub',
  receiverName: null,
  receiverPhone: null,
};

const ALLOWED = {
  canCancel: false,
  canReschedule: false,
  canExtend: false,
  canRate: false,
  canTip: false,
  canCallCook: false,
};

function bookingDto(overrides: {
  status: string;
  cook?: unknown;
  timing?: Record<string, unknown>;
  allowedActions?: Partial<typeof ALLOWED>;
  reassignment?: unknown;
  recovery?: unknown;
  cancellation?: unknown;
}): Record<string, unknown> {
  return {
    id: BOOKING_ID,
    status: overrides.status,
    slotType: 'scheduled',
    scheduledStart: '2026-08-20T06:30:00.000Z',
    durationMinutes: 60,
    price: PRICE,
    holdExpiresAt: null,
    address: ADDRESS,
    mealNotes: null,
    referenceUrl: null,
    mealBrief: null,
    cook:
      overrides.cook === undefined
        ? { id: COOK_ID, name: 'Sanchita', phone: null, rating: null, photoUrl: null }
        : overrides.cook,
    timing: {
      arrivedAt: null,
      actualStart: null,
      expectedEnd: null,
      actualEnd: null,
      ...overrides.timing,
    },
    reassignment: overrides.reassignment ?? {
      occurred: false,
      sequence: 0,
      reassignedAt: null,
    },
    recovery: overrides.recovery,
    cancellation: overrides.cancellation ?? null,
    allowedActions: { ...ALLOWED, ...overrides.allowedActions },
  };
}

function trackingDto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    bookingId: BOOKING_ID,
    status: 'cook_en_route',
    eta: { estimatedArrivalAt: '2026-08-20T06:24:00.000Z', updatedAt: '2026-08-20T06:10:00.000Z' },
    movement: {
      status: 'progress_observed',
      lastEvidenceAt: '2026-08-20T06:10:00.000Z',
      etaConfidence: 'usable',
    },
    arrivedAt: null,
    reassignment: { occurred: false, sequence: 0, reassignedAt: null },
    timingVerdict: 'ON_TIME',
    serviceOtp: { start: null, end: null },
    refreshAfterSeconds: 30,
    ...overrides,
  };
}

function renderBooking(handlers: StubHandlers) {
  return renderWithRuntime(<BookingDetailScreen bookingId={BOOKING_ID} onBack={jest.fn()} />, {
    runtime: createTestRuntime({
      api: createStubApi({
        ...DEFAULT_API_STUBS,
        [`GET /v1/bookings/${BOOKING_ID}`]: () => ({ booking: bookingDto({ status: 'created' }) }),
        ...handlers,
      }),
    }),
  });
}

/** The stub resolves on a microtask and React Query notifies on a zero-delay timer. */
async function settle(): Promise<void> {
  for (let pass = 0; pass < 6; pass += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('booking lifecycle from real DTOs', () => {
  it('renders 8a Confirmation for a created booking', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({ booking: bookingDto({ status: 'created' }) }),
    });
    await settle();

    expect(screen.getByTestId('confirmation-banner')).toBeTruthy();
    expect(screen.queryByTestId('booking-unknown-view')).toBeNull();
  });

  it('renders 8a Confirmation for an assigned booking', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({ booking: bookingDto({ status: 'assigned' }) }),
    });
    await settle();

    expect(screen.getByTestId('confirmation-banner')).toBeTruthy();
  });

  it('renders a support handoff as attention, not Confirmed', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'assigned',
          recovery: { state: 'support_handoff', openedAt: '2026-08-20T10:00:00.000Z' },
        }),
      }),
    });
    await settle();

    expect(screen.getByText('This booking needs attention')).toBeTruthy();
    expect(screen.queryByText('Booking confirmed!')).toBeNull();
  });

  /**
   * 8b `289:6607` — a reassignment BEFORE departure keeps the confirmation screen and adds the
   * `292:201` notice. Resolving it to the `reassigned` (en-route) view sent a booking with no
   * ETA to `TrackingBody`, which then had no sub-model to render and fell through to the
   * unknown-view fallback.
   */
  it('renders 8b Confirm reassign — confirmation plus the notice, not the en-route screen', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'assigned',
          reassignment: { occurred: true, sequence: 1, reassignedAt: '2026-08-20T05:00:00.000Z' },
        }),
      }),
    });
    await settle();

    expect(screen.getByTestId('confirmation-banner')).toBeTruthy();
    expect(screen.getByText('Apologies, we have assigned you another cook')).toBeTruthy();
    expect(screen.queryByTestId('booking-unknown-view')).toBeNull();
  });

  /** And the notice is DROPPED when the server reports no reassignment. */
  it('draws no reassignment notice for an ordinary confirmed booking', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({ booking: bookingDto({ status: 'assigned' }) }),
    });
    await settle();

    expect(screen.queryByText('Apologies, we have assigned you another cook')).toBeNull();
  });

  it('renders 9a En route with the SERVER cook and the SERVER ETA', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({ status: 'cook_en_route' }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/tracking`]: () => trackingDto(),
    });
    await settle();

    expect(screen.getByTestId('tracking-banner')).toBeTruthy();
    expect(screen.queryByTestId('booking-unknown-view')).toBeNull();
    // The banner names the booking's OWN cook, not the frame's "Rekha".
    expect(screen.getByText('Cook Sanchita is arriving in')).toBeTruthy();
  });

  /**
   * 9b `99:1413` — the LATE variant is selected by the backend's `timingVerdict`, never by
   * comparing an ETA to the device clock (the contract forbids exactly that).
   */
  it('switches to the late en-route copy on the backend timing verdict', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({ status: 'cook_en_route' }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/tracking`]: () => trackingDto({ timingVerdict: 'LATE' }),
    });
    await settle();

    expect(screen.getByText("We're sorry for the delay, the cook is running late")).toBeTruthy();
  });

  it('renders 10a Reassigned for an en-route booking whose assignment changed', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'cook_en_route',
          reassignment: { occurred: true, sequence: 1, reassignedAt: '2026-08-20T06:00:00.000Z' },
        }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/tracking`]: () =>
        trackingDto({
          reassignment: { occurred: true, sequence: 1, reassignedAt: '2026-08-20T06:00:00.000Z' },
        }),
    });
    await settle();

    expect(screen.getByTestId('tracking-banner')).toBeTruthy();
    expect(screen.getByText('Apologies, we have assigned you another cook')).toBeTruthy();
    expect(screen.queryByTestId('booking-unknown-view')).toBeNull();
  });

  /**
   * 11 `3:1658` — Arrived, with the persisted `timing.arrivedAt` and the server's Start OTP.
   *
   * The OTP assertions are the point: `111` is the frame's transcription and must never reach a
   * customer, because they read it out to a stranger at their door.
   */
  it('renders 11 Arrived from arrivedAt and shows the SERVER Start OTP', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'cook_arrived',
          timing: { arrivedAt: '2026-08-20T06:25:00.000Z' },
        }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/tracking`]: () =>
        trackingDto({
          status: 'cook_arrived',
          arrivedAt: '2026-08-20T06:25:00.000Z',
          eta: { estimatedArrivalAt: null, updatedAt: null },
          serviceOtp: { start: '482', end: null },
        }),
    });
    await settle();

    expect(screen.getByTestId('tracking-banner')).toBeTruthy();
    expect(screen.getByText('Cook has arrived at your location')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.queryByText('1')).toBeNull();
  });

  it('shows an EMPTY Start OTP panel when the server withholds the code', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'cook_arrived',
          timing: { arrivedAt: '2026-08-20T06:25:00.000Z' },
        }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/tracking`]: () =>
        trackingDto({
          status: 'cook_arrived',
          arrivedAt: '2026-08-20T06:25:00.000Z',
          eta: { estimatedArrivalAt: null, updatedAt: null },
          serviceOtp: { start: null, end: null },
        }),
    });
    await settle();

    // The designed panel is still drawn — title, caption, geometry — with no digits in it.
    expect(screen.getByTestId('arrived-handover-otp')).toBeTruthy();
    expect(screen.getByText('Start OTP')).toBeTruthy();
    // Never the fixture's `111`.
    expect(screen.queryByText('1')).toBeNull();
  });

  /**
   * 12a `101:1812` — the countdown target is `timing.expectedEnd` and nothing else.
   *
   * `scheduledStart + durationMinutes` is deliberately WRONG here: the booking below started
   * late, so the two differ by fifteen minutes and only one of them is the answer.
   */
  it('renders 12a In service and counts down to timing.expectedEnd', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T06:50:00.000Z'));

    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'cooking',
          timing: {
            arrivedAt: '2026-08-20T06:40:00.000Z',
            actualStart: '2026-08-20T06:45:00.000Z',
            // A LATE start: scheduledStart + 60 min would be 07:30, this is 07:45.
            expectedEnd: '2026-08-20T07:45:00.000Z',
          },
          allowedActions: { canExtend: true },
        }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/tracking`]: () =>
        trackingDto({
          status: 'cooking',
          eta: { estimatedArrivalAt: null, updatedAt: null },
          serviceOtp: { start: null, end: '907' },
        }),
    });

    await jest.advanceTimersByTimeAsync(50);

    expect(screen.getByTestId('in-service-body')).toBeTruthy();
    // 06:50 -> 07:45 is 55 minutes. Not 40, which is what `scheduledStart + duration` would give.
    expect(screen.getByText('55 mins')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();

    jest.useRealTimers();
  });

  it('renders 14a Completion, and 14b once the server says it may no longer be rated', async () => {
    const { unmount } = renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'completed',
          timing: {
            actualStart: '2026-08-20T06:30:00.000Z',
            expectedEnd: '2026-08-20T07:30:00.000Z',
            actualEnd: '2026-08-20T07:28:00.000Z',
          },
          allowedActions: { canRate: true, canTip: true },
        }),
      }),
    });
    await settle();

    expect(screen.getByTestId('completion-body')).toBeTruthy();
    expect(screen.queryByTestId('booking-unknown-view')).toBeNull();
    // The headline names THIS booking, not the frame's "12th April • 1:15 PM • 1 hr".
    expect(screen.queryByText('12th April • 1:15 PM • 1 hr')).toBeNull();
    unmount();

    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'completed',
          timing: {
            actualStart: '2026-08-20T06:30:00.000Z',
            expectedEnd: '2026-08-20T07:30:00.000Z',
            actualEnd: '2026-08-20T07:28:00.000Z',
          },
          allowedActions: { canRate: false, canTip: true },
        }),
      }),
    });
    await settle();

    // `319:3191` — v16 swaps the heading to report that the feedback landed, and shortens the
    // line beneath it. These read "…helps us improve!" over "Thanks for sharing your feedback!".
    expect(screen.getByText('Rating & Feedback submitted!')).toBeTruthy();
    expect(screen.getByText('Thanks for sharing!')).toBeTruthy();
  });

  /**
   * 8e `201:278` — the auto-cancelled surface, with the refund the SERVER recorded.
   *
   * `GET /v1/bookings/:id/refunds` is the only source of that figure: the booking detail's
   * `cancellation` block carries who cancelled and why, and no amount at all. The frame's ₹135
   * must not survive.
   */
  it('renders 8e Auto cancelled with the backend refund amount', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'cancelled',
          cancellation: {
            cancelledAt: '2026-08-20T05:00:00.000Z',
            cancelledBy: 'system',
            reasonCode: 'NO_COOK_AVAILABLE',
            reasonDetail: null,
          },
        }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/refunds`]: () => ({
        refunds: [
          {
            refundId: '33333333-3333-4333-8333-333333333333',
            bookingId: BOOKING_ID,
            reason: 'service_failure',
            amountPaise: 13545,
            currency: 'INR',
            state: 'provider_pending',
            requestedAt: '2026-08-20T05:00:05.000Z',
            completedAt: null,
          },
        ],
      }),
    });
    await settle();

    expect(screen.getByTestId('auto-cancelled-body')).toBeTruthy();
    expect(screen.getByText('₹135.45')).toBeTruthy();
    expect(screen.queryByText('₹135')).toBeNull();
  });

  /**
   * Opening 8c tells the server the apology has been read.
   *
   * Home draws the Cancelled banner (`393:1072`) until it is told, so without this the customer
   * comes back from the apology to Home and is shown it again — being notified of something they
   * have just dealt with. The design offers nothing to press, so ARRIVING here is the only signal
   * there is.
   */
  it('marks the apology as seen when 8c opens, exactly once', async () => {
    const seen: string[] = [];
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'cancelled',
          cancellation: {
            cancelledAt: '2026-08-20T05:00:00.000Z',
            cancelledBy: 'system',
            reasonCode: 'NO_COOK_AVAILABLE',
            reasonDetail: null,
          },
        }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/refunds`]: () => ({ refunds: [] }),
      [`POST /v1/bookings/${BOOKING_ID}/cancellation/seen`]: () => {
        seen.push(BOOKING_ID);
        return { acknowledged: true };
      },
    });
    await settle();

    expect(screen.getByTestId('auto-cancelled-body')).toBeTruthy();
    // Once, not once per refetch: the screen polls, and every poll changes the query result's
    // identity. A guard keyed on the booking is what keeps this to a single request.
    expect(seen).toEqual([BOOKING_ID]);
  });

  it('never marks a booking that was not cancelled', async () => {
    let posted = false;
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({ booking: bookingDto({ status: 'assigned' }) }),
      [`POST /v1/bookings/${BOOKING_ID}/cancellation/seen`]: () => {
        posted = true;
        return { acknowledged: false };
      },
    });
    await settle();

    expect(posted).toBe(false);
  });

  /**
   * A CUSTOMER cancellation has no designed surface, and `201:278` is not it — that frame
   * apologises for a cancellation Spoon made. The safe fallback is the correct answer here, and
   * it is recorded as a UI gap rather than solved by showing the wrong apology.
   */
  it('falls back safely for a customer cancellation rather than apologising for it', async () => {
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: bookingDto({
          status: 'cancelled',
          cancellation: {
            cancelledAt: '2026-08-20T05:00:00.000Z',
            cancelledBy: 'customer',
            reasonCode: 'URGENT_CHANGE',
            reasonDetail: null,
          },
        }),
      }),
    });
    await settle();

    expect(screen.getByTestId('booking-unknown-view')).toBeTruthy();
    expect(screen.queryByText('We sincerely apologize for cancelling this booking')).toBeNull();
  });

  /**
   * The polling contract: the SAME mounted screen follows the booking as the server moves it.
   *
   * `useBookingDetail(..., { poll: true })` is what makes the customer's screen advance from
   * "arriving" to "arrived" without them reopening the booking, and it is why the detail read is
   * polled at all.
   */
  it('transitions a mounted screen from en route to arrived on the next poll', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T06:20:00.000Z'));

    let arrived = false;
    renderBooking({
      [`GET /v1/bookings/${BOOKING_ID}`]: () => ({
        booking: arrived
          ? bookingDto({
              status: 'cook_arrived',
              timing: { arrivedAt: '2026-08-20T06:25:00.000Z' },
            })
          : bookingDto({ status: 'cook_en_route' }),
      }),
      [`GET /v1/bookings/${BOOKING_ID}/tracking`]: () =>
        arrived
          ? trackingDto({
              status: 'cook_arrived',
              arrivedAt: '2026-08-20T06:25:00.000Z',
              eta: { estimatedArrivalAt: null, updatedAt: null },
              serviceOtp: { start: '551', end: null },
            })
          : trackingDto(),
    });

    await jest.advanceTimersByTimeAsync(50);
    expect(screen.getByText('Cook Sanchita is arriving in')).toBeTruthy();

    arrived = true;
    // `LIVE_POLL_MS` is 30s for the detail; tracking follows the server's `refreshAfterSeconds`.
    await jest.advanceTimersByTimeAsync(31_000);
    await jest.advanceTimersByTimeAsync(31_000);

    expect(screen.getByText('Cook has arrived at your location')).toBeTruthy();
    expect(screen.queryByTestId('booking-unknown-view')).toBeNull();

    jest.useRealTimers();
  });
});
