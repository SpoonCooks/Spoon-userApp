import { act, fireEvent, screen } from '@testing-library/react-native';

import { renderWithDefaultRuntime as render } from '@/test/renderWithRuntime';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { ready } from '@core/data';
import { lightColors } from '@ui';

import {
  DEMO_BOOKING_ARRIVED,
  DEMO_BOOKING_COMPLETION,
  DEMO_BOOKING_FEEDBACK_SUBMITTED,
  DEMO_BOOKING_CONFIRMATION,
  DEMO_BOOKING_EN_ROUTE,
  DEMO_BOOKING_EN_ROUTE_LATE,
  demoInServiceBooking,
} from '@/demo/fixtures/booking';
import { BookingDetailView } from './BookingDetailScreen';

const onRetry = jest.fn();

/**
 * Lets the mounting reads resolve under fake timers.
 *
 * The stub transport resolves on a microtask and React Query notifies on a zero-delay timer, so
 * a screen whose prices come from `GET /v1/catalogue` needs both flushed before it can draw one.
 * That wait is the point of the assertions around it: nothing is priced before it, and everything
 * priced after it is the server's.
 */
async function settleReads(): Promise<void> {
  // Several passes: the stub resolves on a microtask, React Query notifies on a zero-delay timer,
  // and the render that follows can queue another. One flush is not reliably enough.
  for (let pass = 0; pass < 5; pass += 1) {
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
  }
}

function flatten(node: { readonly props: { readonly style?: unknown } }): ViewStyle {
  return (StyleSheet.flatten(node.props.style) ?? {}) as ViewStyle;
}

describe('Booking host — confirmation (3:1041)', () => {
  it('renders the banner, its schedule line, the cook card and the note', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_CONFIRMATION)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('confirmation-banner')).toBeTruthy();
    expect(screen.getByTestId('confirmation-cook')).toBeTruthy();
    expect(screen.getByTestId('confirmation-note')).toBeTruthy();

    // `250:2951` — the pre-formatted schedule line replaced the inline Date / Start time /
    // Duration / End time rows, which `3:1041` no longer draws. They now live on `250:2861`.
    expect(screen.getByText('Today, Aug 5 • 12:00 PM • 1 hr')).toBeTruthy();
    expect(screen.queryByText('₹135')).toBeNull();
  });

  it('opens the 250:2861 details sheet from the 250:2966 row', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_CONFIRMATION)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    // The sheet stays closed until the row is pressed.
    expect(screen.queryByTestId('booking-details-sheet-booking-rows')).toBeNull();

    fireEvent.press(screen.getByTestId('confirmation-view-details'));

    // The rows Confirmation stopped drawing inline are what this sheet carries.
    expect(screen.getByTestId('booking-details-sheet-booking-rows')).toBeTruthy();
    expect(screen.getByTestId('booking-details-sheet-payment-rows')).toBeTruthy();
    expect(screen.getByText('Today, Aug 5')).toBeTruthy();
    expect(screen.getByText('₹198')).toBeTruthy();
  });

  it('hides the details row when the server supplies no details (250:2966)', () => {
    const { details: _omitted, ...withoutDetails } = DEMO_BOOKING_CONFIRMATION;
    render(
      <BookingDetailView state={ready(withoutDetails)} onRetry={onRetry} onBack={jest.fn()} />,
    );

    expect(screen.queryByTestId('confirmation-view-details')).toBeNull();
  });

  it('shows Reschedule only when the server says it is allowed (R-3)', () => {
    const onReschedule = jest.fn();
    const { rerender } = render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_CONFIRMATION)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onReschedule={onReschedule}
      />,
    );
    expect(screen.getByTestId('confirmation-reschedule')).toBeTruthy();

    rerender(
      <BookingDetailView
        state={ready({
          ...DEMO_BOOKING_CONFIRMATION,
          summary: { ...DEMO_BOOKING_CONFIRMATION.summary!, rescheduleAllowed: false },
        })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onReschedule={onReschedule}
      />,
    );
    expect(screen.queryByTestId('confirmation-reschedule')).toBeNull();
  });

  it('leaves cancellation unwired until its entry point is confirmed (B-11)', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_CONFIRMATION)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('confirmation-cancel')).toBeNull();
  });
});

describe('Booking host — en route on time and late (3:1381 / 99:1413)', () => {
  it('renders the on-time banner from server copy', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_EN_ROUTE)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText('The cook will reach your location on time!')).toBeTruthy();
    expect(screen.getByText('16 mins')).toBeTruthy();
  });

  it('renders the late variant when the SERVER says late — not from a client clock comparison', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_EN_ROUTE_LATE)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText("We're sorry for the delay, the cook is running late")).toBeTruthy();
    expect(screen.getByText('21 mins')).toBeTruthy();
  });

  it('has no cancel control on either en-route state', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_EN_ROUTE)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('confirmation-cancel')).toBeNull();
  });
});

describe('Booking host — arrived (3:1658)', () => {
  it('shows the Start OTP and the Start Service CTA', () => {
    const onStartService = jest.fn();
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_ARRIVED)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onStartService={onStartService}
      />,
    );

    expect(screen.getByTestId('arrived-handover-otp')).toBeTruthy();
    fireEvent.press(screen.getByTestId('arrived-handover-cta'));
    expect(onStartService).toHaveBeenCalledTimes(1);
  });

  it('draws the handover even when no host has wired the CTA (it is drawn unconditionally)', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_ARRIVED)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('arrived-handover-otp')).toBeTruthy();
    expect(screen.getByTestId('arrived-handover-cta')).toBeTruthy();
  });

  it('draws the OTP panel in the lime `start` tone, not the In-service yellow', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_ARRIVED)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onStartService={jest.fn()}
      />,
    );

    // `21:1105` — the panel is `lime300` at 30%; `101:1905` is `yellow300` at 30%.
    expect(flatten(screen.getByTestId('arrived-handover-otp')).backgroundColor).toBe(
      lightColors.surfaceOtpStart,
    );
  });
});

describe('Booking host — in service (101:1812)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders the countdown from the server end timestamp', () => {
    const now = 1_000_000;
    jest.setSystemTime(now);

    render(
      <BookingDetailView
        state={ready(demoInServiceBooking(now, 30 * 60 * 1000))}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    // `101:1890` — the countdown occupies the banner's 117 × 103 panel, as "48 mins" does in the
    // frame. It is not a separate chip.
    expect(screen.getByTestId('in-service-banner-highlight')).toBeTruthy();
    expect(screen.getByText('30 mins')).toBeTruthy();
  });

  it('refetches — and does NOT transition — when the countdown reaches zero', () => {
    const now = 2_000_000;
    jest.setSystemTime(now);
    const refetch = jest.fn();

    render(
      <BookingDetailView
        state={ready(demoInServiceBooking(now, 1_000))}
        onRetry={refetch}
        onBack={jest.fn()}
      />,
    );

    act(() => {
      jest.setSystemTime(now + 5_000);
      jest.advanceTimersByTime(2_000);
    });

    expect(refetch).toHaveBeenCalled();
    // The view is unchanged: only the server can move the booking on.
    expect(screen.getByTestId('in-service-body')).toBeTruthy();
  });

  /**
   * `3:2002` — the sheet opens, and every price on it is the SERVER's.
   *
   * This used to assert `₹35` and `Extend • ₹16` on the FIRST synchronous render, which passed
   * only because `useExtensionData` returned the design fixture verbatim while the catalogue was
   * still in flight. Those are transcribed frame values: ₹16 is the extension total for a
   * 10-minute SKU as it was priced when the frame was drawn, and neither figure had any
   * connection to what the customer would be charged.
   *
   * So the test now pins both halves of the corrected behaviour — nothing priced before the
   * server answers, and the server's own figures after.
   */
  it('opens the extension sheet unpriced, then draws the server’s amounts', async () => {
    const now = 3_000_000;
    jest.setSystemTime(now);

    render(
      <BookingDetailView
        state={ready(demoInServiceBooking(now))}
        onRetry={onRetry}
        onBack={jest.fn()}
        onExtendBooking={jest.fn(() => Promise.resolve())}
      />,
    );

    fireEvent.press(screen.getByTestId('in-service-extend-cta'));

    expect(screen.getByTestId('extension-sheet')).toBeTruthy();
    // Nothing has answered yet: no option, no amount, and a CTA that names no price.
    expect(screen.queryByText('₹35')).toBeNull();
    expect(screen.queryByText('Extend • ₹16')).toBeNull();
    expect(screen.getByText('Extend')).toBeTruthy();
    expect(screen.getByTestId('extension-submit').props.accessibilityState.disabled).toBe(true);

    // `GET /v1/catalogue` publishes 10 min @ ₹15 (total ₹15.75) and 20 min @ ₹35.
    await settleReads();
    expect(screen.getByText('₹35')).toBeTruthy();
    expect(screen.getByText('₹15')).toBeTruthy();
    // `143:381` draws "10 mins" selected, so the bar is live and carries THAT option's total.
    expect(screen.getByTestId('extension-submit').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByText('Extend • ₹15.75')).toBeTruthy();
  });

  /**
   * Task §11 / §27 — the extension must not be a button that closes a sheet and changes nothing.
   *
   * It sends `POST /v1/bookings/:id/extensions` with the catalogue's own minutes, and the sheet
   * stays OPEN until the SERVER answers: an extension has billing consequences, so a sheet that
   * dismissed itself on press would be a receipt for a charge that had not happened.
   */
  it('sends the chosen extension in MINUTES and holds the sheet open until the server answers', async () => {
    const now = 3_000_000;
    jest.setSystemTime(now);

    let resolveExtend: (() => void) | null = null;
    const onExtendBooking = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveExtend = resolve;
        }),
    );

    render(
      <BookingDetailView
        state={ready(demoInServiceBooking(now))}
        onRetry={onRetry}
        onBack={jest.fn()}
        onExtendBooking={onExtendBooking}
      />,
    );

    fireEvent.press(screen.getByTestId('in-service-extend-cta'));

    // Nothing may be submitted before the server has said what it sells: pressing now is a
    // no-op, which is the whole point of gating the CTA on a server-supplied option.
    fireEvent.press(screen.getByTestId('extension-submit'));
    expect(onExtendBooking).not.toHaveBeenCalled();

    await settleReads();
    fireEvent.press(screen.getByTestId('extension-submit'));

    // `ext-10` decoded from an option the SERVER published, never a duration this client chose.
    expect(onExtendBooking).toHaveBeenCalledWith(10);
    expect(screen.getByTestId('extension-sheet')).toBeTruthy();

    await act(async () => {
      resolveExtend?.();
    });

    // The sheet dismisses on an animation, so let it finish before asserting it is gone.
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });

    expect(screen.queryByTestId('extension-sheet')).toBeNull();
  });

  /** An unwired host DISABLES the bar rather than drawing a live one over nothing (§11). */
  it('disables the extension CTA when the host wires no extension action', () => {
    const now = 3_000_000;
    jest.setSystemTime(now);

    render(
      <BookingDetailView
        state={ready(demoInServiceBooking(now))}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('in-service-extend-cta'));

    expect(screen.getByTestId('extension-submit').props.accessibilityState.disabled).toBe(true);
  });

  it('opens the extension taxes dialog from Check payment details (275:4189)', () => {
    const now = 3_000_000;
    jest.setSystemTime(now);

    render(
      <BookingDetailView
        state={ready(demoInServiceBooking(now))}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('in-service-extend-cta'));
    fireEvent.press(screen.getByTestId('extension-payment-details'));

    // `275:4274` — this frame's own copy, NOT the Instant sheet's 2.5% CGST + 2.5% SGST line.
    expect(screen.getByText('What is Taxes and Fee?')).toBeTruthy();
  });
});

describe('Booking host — completion (143:207)', () => {
  it('renders the rating scale and keeps Submit disabled until a rating is picked', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_COMPLETION)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('completion-rating')).toBeTruthy();
    expect(screen.getByTestId('completion-submit').props.accessibilityState.disabled).toBe(true);
  });

  /**
   * The regression this screen actually shipped: Submit was gated on the FEEDBACK text, so a
   * customer who picked a rating and wrote nothing found the button dead with no explanation.
   * The rating is what the screen exists to collect, and the words are optional — the submit
   * handler already drops an empty string from the request.
   */
  it('enables Submit on the rating alone and sends it with no feedback', () => {
    const onSubmitFeedback = jest.fn();
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_COMPLETION)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onSubmitFeedback={onSubmitFeedback}
      />,
    );

    fireEvent.press(screen.getByTestId('completion-rating-5'));
    expect(screen.getByTestId('completion-submit').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByTestId('completion-submit'));
    expect(onSubmitFeedback).toHaveBeenCalledWith('', 5);
  });

  it('accepts a half-step rating and opens the tip sheet from the `308:3121` row', () => {
    const onSelectTip = jest.fn(() => new Promise<void>(() => undefined));
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_COMPLETION)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onSelectTip={onSelectTip}
      />,
    );

    fireEvent.press(screen.getByTestId('completion-rating-4.5'));
    expect(screen.getByTestId('completion-rating-4.5').props.accessibilityState.selected).toBe(
      true,
    );

    // `299:1424` no longer draws inline tip chips: the row opens `306:2885`, and the chips are
    // there. Nothing is charged either way (ruling R-1).
    fireEvent.press(screen.getByTestId('completion-tip-row'));
    fireEvent.press(screen.getByTestId('tip-sheet-option-tip-50'));
    fireEvent.press(screen.getByTestId('tip-sheet-confirm'));
    expect(onSelectTip).toHaveBeenCalledWith('tip-50');
    // The sheet is still up: only the SERVER taking the tip closes it (§11 — no invented success).
    expect(screen.getByTestId('tip-sheet')).toBeTruthy();
  });

  it('updates the tip CTA to the selected catalogue amount', () => {
    const tip = DEMO_BOOKING_COMPLETION.tip;
    if (tip === undefined) throw new Error('expected the completion fixture to include tips');

    const booking = {
      ...DEMO_BOOKING_COMPLETION,
      tip: {
        ...tip,
        options: [{ id: 'tip-20', label: '₹20' }, ...tip.options],
      },
    };

    render(
      <BookingDetailView
        state={ready(booking)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onSelectTip={jest.fn(() => new Promise<void>(() => undefined))}
      />,
    );

    fireEvent.press(screen.getByTestId('completion-tip-row'));
    fireEvent.press(screen.getByTestId('tip-sheet-option-tip-20'));

    expect(screen.getByText('Tip • ₹20')).toBeTruthy();
  });

  it('drops the scale and the Submit chip once the SERVER says the feedback is in', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_FEEDBACK_SUBMITTED)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    // `319:3217` keeps the "5+" legend and removes the nine chips.
    expect(screen.getByTestId('completion-rating-prompt')).toBeTruthy();
    expect(screen.queryByTestId('completion-rating-5')).toBeNull();
    expect(screen.queryByTestId('completion-submit')).toBeNull();
    // `319:3191` — the heading reports the submission rather than repeating the invitation, and
    // the acknowledgement is the shorter v16 line.
    expect(screen.getByText('Rating & Feedback submitted!')).toBeTruthy();
    expect(screen.getByText('Thanks for sharing!')).toBeTruthy();
    expect(screen.queryByText('Your feedback helps us improve!')).toBeNull();
  });
});

describe('Booking host — unknown state', () => {
  it('renders a safe fallback rather than guessing', () => {
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_EN_ROUTE, view: 'unknown' as const })}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('booking-unknown-view')).toBeTruthy();
  });

  it('falls back when the payload lacks the section its view needs', () => {
    const { tracking: _tracking, ...withoutTracking } = DEMO_BOOKING_EN_ROUTE;

    render(
      <BookingDetailView state={ready(withoutTracking)} onRetry={onRetry} onBack={jest.fn()} />,
    );

    expect(screen.getByTestId('booking-unknown-view')).toBeTruthy();
  });
});

/**
 * Call Cook — §31. The control reveals a cook's PERSONAL number, so its visibility is the
 * server's decision and nothing else.
 *
 * These pin the fail-closed direction in both places it matters: a payload that does not grant
 * the action must not draw the button even when the host wires the callback, and a payload that
 * does grant it must draw it. Deriving visibility from status, from a cook being present, or
 * from the clock is exactly what ruling R-3 forbids.
 */
describe('Booking host — Call Cook is gated by allowedActions (§31)', () => {
  it('hides the control when the server does not allow the call', () => {
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_CONFIRMATION, callCookAllowed: false })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCallCook={jest.fn()}
      />,
    );

    expect(screen.queryByText('Call Cook')).toBeNull();
  });

  it('hides the control when the payload says nothing at all', () => {
    const { callCookAllowed: _omitted, ...withoutTheField } = {
      ...DEMO_BOOKING_CONFIRMATION,
      callCookAllowed: true,
    };

    render(
      <BookingDetailView
        state={ready(withoutTheField)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCallCook={jest.fn()}
      />,
    );

    expect(screen.queryByText('Call Cook')).toBeNull();
  });

  it('draws the control and calls the host when the server allows it', () => {
    const onCallCook = jest.fn();
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_CONFIRMATION, callCookAllowed: true })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCallCook={onCallCook}
      />,
    );

    fireEvent.press(screen.getByText('Call Cook'));
    expect(onCallCook).toHaveBeenCalledTimes(1);
  });

  it('gates the live service screens by the same field, not by their status', () => {
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_EN_ROUTE, callCookAllowed: false })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCallCook={jest.fn()}
      />,
    );

    expect(screen.queryByText('Call Cook')).toBeNull();
  });

  it('surfaces a failure rather than leaving the press silent', () => {
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_CONFIRMATION, callCookAllowed: true })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCallCook={jest.fn()}
        callCookError="Your cook’s contact isn’t available right now."
        onDismissCallCookError={jest.fn()}
      />,
    );

    expect(screen.getByTestId('call-cook-error')).toBeTruthy();
    expect(screen.getByText('Your cook’s contact isn’t available right now.')).toBeTruthy();
  });
});

/**
 * Cancel — §36, and the closing of blocker B-11.
 *
 * B-11 recorded that no live-booking frame drew a Cancel control, so the four-step sheet had no
 * entry point. The current file draws the Reschedule/Cancel pair on `3:1041` and `292:241`, so
 * the control exists — and what decides whether it is OFFERED is `allowedActions.canCancel`, not
 * the status and not which screen happens to draw the pair. A cancellation carries a fee and a
 * refund the server computes, so offering it where the server refuses would walk the customer
 * into a flow that cannot complete.
 */
describe('Booking host — Cancel is gated by allowedActions (§36)', () => {
  it('hides Cancel when the server does not allow it', () => {
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_CONFIRMATION, cancelAllowed: false })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(
      screen.queryByText(DEMO_BOOKING_CONFIRMATION.summary?.cancelLabel ?? 'Cancel'),
    ).toBeNull();
  });

  it('hides Cancel when the payload says nothing about it', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_CONFIRMATION)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(
      screen.queryByText(DEMO_BOOKING_CONFIRMATION.summary?.cancelLabel ?? 'Cancel'),
    ).toBeNull();
  });

  it('offers Cancel and calls the host when the server allows it', () => {
    const onCancel = jest.fn();
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_CONFIRMATION, cancelAllowed: true })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByText(DEMO_BOOKING_CONFIRMATION.summary?.cancelLabel ?? 'Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('gates the en-route pair by the same field', () => {
    render(
      <BookingDetailView
        state={ready({ ...DEMO_BOOKING_EN_ROUTE, cancelAllowed: true })}
        onRetry={onRetry}
        onBack={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText(DEMO_BOOKING_EN_ROUTE.tracking?.cancelLabel ?? 'Cancel')).toBeTruthy();
  });
});
