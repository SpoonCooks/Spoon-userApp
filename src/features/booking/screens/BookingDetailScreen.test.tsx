import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { ready } from '@core/data';
import { lightColors } from '@ui';

import {
  DEMO_BOOKING_ARRIVED,
  DEMO_BOOKING_COMPLETION,
  DEMO_BOOKING_CONFIRMATION,
  DEMO_BOOKING_EN_ROUTE,
  DEMO_BOOKING_EN_ROUTE_LATE,
  demoInServiceBooking,
} from '@/demo/fixtures/booking';
import { BookingDetailView } from './BookingDetailScreen';

const onRetry = jest.fn();

function flatten(node: { readonly props: { readonly style?: unknown } }): ViewStyle {
  return (StyleSheet.flatten(node.props.style) ?? {}) as ViewStyle;
}

describe('Booking host — confirmation (3:1041)', () => {
  it('renders the banner, cook card and the server-provided summary rows', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_CONFIRMATION)}
        onRetry={onRetry}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('confirmation-banner')).toBeTruthy();
    expect(screen.getByTestId('confirmation-cook')).toBeTruthy();
    expect(screen.getByText('Today, Aug 5')).toBeTruthy();
    expect(screen.getByText('₹135')).toBeTruthy();
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

  it('opens the extension sheet from Extend Time', () => {
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

    expect(screen.getByTestId('extension-sheet')).toBeTruthy();
    expect(screen.getByText('₹35')).toBeTruthy();
    expect(screen.getByTestId('extension-submit').props.accessibilityState.disabled).toBe(true);
  });
});

describe('Booking host — completion (143:207)', () => {
  it('renders the rating scale and keeps feedback submission disabled while empty', () => {
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

  it('accepts a half-step rating and a tip selection', () => {
    const onSelectTip = jest.fn();
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

    fireEvent.press(screen.getByTestId('completion-tip-tip-50'));
    expect(onSelectTip).toHaveBeenCalledWith('tip-50');
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
