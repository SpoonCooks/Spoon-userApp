import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { ready } from '@core/data';
import { lightColors } from '@ui';

import {
  DEMO_BOOKING_ARRIVED,
  DEMO_BOOKING_AUTO_CANCELLED,
  DEMO_BOOKING_EN_ROUTE,
  DEMO_BOOKING_REASSIGNED,
  DEMO_BOOKING_REASSIGNED_LATE,
  demoInServiceBooking,
} from '@/demo/fixtures/booking';
import { BookingDetailView } from '../screens/BookingDetailScreen';

const onRetry = jest.fn();

function flatten(node: { readonly props: { readonly style?: unknown } }): ViewStyle {
  return (StyleSheet.flatten(node.props.style) ?? {}) as ViewStyle;
}

function show(state: Parameters<typeof BookingDetailView>[0]['state']) {
  render(<BookingDetailView state={state} onRetry={onRetry} onBack={jest.fn()} />);
}

describe('Service handover — `21:1091` / `101:1893`', () => {
  it('draws the Arrived block in lime and the In-service block in yellow', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_ARRIVED)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onStartService={jest.fn()}
      />,
    );
    expect(flatten(screen.getByTestId('arrived-handover-otp')).backgroundColor).toBe(
      lightColors.surfaceOtpStart,
    );

    screen.unmount();

    show(ready(demoInServiceBooking(1_000_000)));
    expect(flatten(screen.getByTestId('in-service-handover-otp')).backgroundColor).toBe(
      lightColors.surfaceOtpEnd,
    );
  });

  it('renders one tile per digit at the frame size (`21:1095`: 31 × 44)', () => {
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_ARRIVED)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onStartService={jest.fn()}
      />,
    );

    const panel = screen.getByTestId('arrived-handover-otp');
    expect(flatten(panel).height).toBe(112);
    expect(screen.getAllByText('1')).toHaveLength(3);
  });
});

describe('Reassignment — `201:100` / `209:747`', () => {
  it('adds the notice to En route and changes nothing else', () => {
    show(ready(DEMO_BOOKING_EN_ROUTE));
    expect(screen.queryByTestId('tracking-reassignment')).toBeNull();
    screen.unmount();

    show(ready(DEMO_BOOKING_REASSIGNED));
    expect(screen.getByTestId('tracking-reassignment')).toBeTruthy();
    // The rest of En route survives — banner, cook card and note are all still there.
    expect(screen.getByTestId('tracking-banner')).toBeTruthy();
    expect(screen.getByTestId('tracking-cook')).toBeTruthy();
    expect(screen.getByTestId('tracking-note')).toBeTruthy();
  });

  it('takes the late tone from the payload, never from a clock comparison', () => {
    show(ready(DEMO_BOOKING_REASSIGNED));
    expect(flatten(screen.getByTestId('tracking-banner')).backgroundColor).toBe(
      lightColors.surfacePositive,
    );
    screen.unmount();

    show(ready(DEMO_BOOKING_REASSIGNED_LATE));
    expect(flatten(screen.getByTestId('tracking-banner')).backgroundColor).toBe(
      lightColors.surfaceAccentStrong,
    );
  });
});

describe('Auto cancelled — `201:278`', () => {
  it('renders the hero, the summary and both notices', () => {
    show(ready(DEMO_BOOKING_AUTO_CANCELLED));

    expect(screen.getByTestId('auto-cancelled-hero')).toBeTruthy();
    expect(screen.getByTestId('auto-cancelled-summary')).toBeTruthy();
    expect(screen.getByTestId('auto-cancelled-apology')).toBeTruthy();
    expect(screen.getByTestId('auto-cancelled-refund')).toBeTruthy();
    expect(screen.getByText('This booking has been cancelled')).toBeTruthy();
  });

  it('renders the SUPPLIED refund amount and never derives it', () => {
    show(ready(DEMO_BOOKING_AUTO_CANCELLED));

    // Both figures are ₹135 in the fixture; the point is that the refund line is read from
    // `refundAmount`, not computed from the Total row.
    expect(screen.getByText('Refund Amount')).toBeTruthy();
    expect(screen.getAllByText('₹135')).toHaveLength(2);
  });

  it('shows a refund figure that disagrees with Total, exactly as supplied', () => {
    const partial = {
      ...DEMO_BOOKING_AUTO_CANCELLED,
      autoCancelled: {
        ...DEMO_BOOKING_AUTO_CANCELLED.autoCancelled!,
        refundAmount: '₹68',
      },
    };
    show(ready(partial));

    // A client that computed `paid − fee` could not produce this pair. It renders both verbatim.
    expect(screen.getByText('₹135')).toBeTruthy();
    expect(screen.getByText('₹68')).toBeTruthy();
  });

  it('draws both rebook answers, inert until a host wires them (PRODUCT_PENDING routes)', () => {
    show(ready(DEMO_BOOKING_AUTO_CANCELLED));
    expect(screen.getByTestId('auto-cancelled-rebook')).toBeTruthy();
    // `201:92` draws them unconditionally, so they render; pressing one is a no-op.
    expect(screen.getByTestId('auto-cancelled-accept')).toBeTruthy();
    fireEvent.press(screen.getByTestId('auto-cancelled-accept'));

    screen.unmount();

    const onRebook = jest.fn();
    render(
      <BookingDetailView
        state={ready(DEMO_BOOKING_AUTO_CANCELLED)}
        onRetry={onRetry}
        onBack={jest.fn()}
        onRebook={onRebook}
      />,
    );
    fireEvent.press(screen.getByTestId('auto-cancelled-accept'));
    expect(onRebook).toHaveBeenCalledTimes(1);
  });
});
