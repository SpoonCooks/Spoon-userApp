import { StyleSheet } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  DEMO_LOGIN,
  DEMO_OTP,
  DEMO_OTP_ERROR,
  DEMO_OTP_RESEND_READY,
} from '@/demo/fixtures/screens';

import { LoginScreen } from './LoginScreen';
import { OtpScreen } from './OtpScreen';

/**
 * Auth screens — Figma `fsgGIC4c6DJulb64TTt9yg`, finalized "Login flow" section `275:4472`.
 *
 * These cover the two contracts the finalized frames changed, both of which are easy to regress:
 * the OTP screen has NO submit control, and the last digit is therefore the submit gesture.
 */

describe('LoginScreen — 250:2383', () => {
  const noop = () => undefined;

  it('keeps the CTA inert until the number is complete, and never validates locally', () => {
    const requested: string[] = [];
    render(<LoginScreen login={DEMO_LOGIN} onRequestOtp={(phone) => requested.push(phone)} />);

    const cta = screen.getByTestId('login-screen-cta');
    expect(cta.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId('login-screen-phone'), '9876543210');
    expect(screen.getByTestId('login-screen-cta').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByTestId('login-screen-cta'));
    expect(requested).toEqual(['9876543210']);
  });

  it('strips non-digits rather than authoring a validation message', () => {
    render(<LoginScreen login={DEMO_LOGIN} onRequestOtp={noop} />);

    fireEvent.changeText(screen.getByTestId('login-screen-phone'), '98a76-543 21x0');
    expect(screen.getByTestId('login-screen-phone').props.value).toBe('9876543210');
  });
});

describe('OtpScreen — 275:4289 / 250:2439 / 275:4349', () => {
  const noop = () => undefined;

  const renderOtp = (otp = DEMO_OTP, onVerify: (code: string) => void = noop) =>
    render(<OtpScreen otp={otp} onVerify={onVerify} onResend={noop} onEditNumber={noop} />);

  it('draws no submit CTA — the finalized frames have none', () => {
    renderOtp();
    expect(screen.queryByTestId('otp-screen-cta')).toBeNull();
  });

  it('raises onVerify exactly once, when the last digit lands', () => {
    const verified: string[] = [];
    renderOtp(DEMO_OTP, (code) => verified.push(code));

    const input = screen.getByTestId('otp-screen-input');

    fireEvent.changeText(input, '333');
    expect(verified).toEqual([]);

    fireEvent.changeText(input, '333333');
    expect(verified).toEqual(['333333']);
  });

  it('never submits more digits than the payload asks for', () => {
    const verified: string[] = [];
    renderOtp(DEMO_OTP, (code) => verified.push(code));

    fireEvent.changeText(screen.getByTestId('otp-screen-input'), '3333339999');
    expect(verified).toEqual(['333333']);
  });

  it('renders the error message inside the digits panel (275:4467)', () => {
    renderOtp(DEMO_OTP_ERROR);

    expect(screen.getByTestId('otp-screen-error')).toBeTruthy();
    expect(screen.getByText('Incorrect OTP. Please try again')).toBeTruthy();

    // `275:4449` — every box swaps to the red tint in this state.
    expect(screen.getAllByTestId(/^otp-screen-digit-\d+$/)).toHaveLength(6);
  });

  /**
   * A device-only defect, guarded here because nothing else can guard it.
   *
   * The tagline is one `Text` of TWO runs: the lead, then "minutes" in `#FFD600`. With
   * `alignItems: 'center'` on its container the line shrink-wrapped, Android measured the pair
   * short, framed the view from the first run and never painted the accent. Nothing in JS could
   * see it — the string was in the layout AND in the accessibility tree, so `getByText('minutes')`
   * passed while the screen showed "Trained cooks in".
   *
   * So this asserts the SHAPE that avoids the mis-measure rather than the paint: the lines fill
   * the 268pt block and centre via `textAlign`. Re-adding `alignItems` here brings the bug back.
   */
  it('lets the tagline lines fill their block instead of shrink-wrapping (275:4305)', () => {
    renderOtp(DEMO_OTP);

    const tagline = screen.getByTestId('otp-screen-tagline');
    const style = StyleSheet.flatten(tagline.props.style) as {
      alignItems?: string;
      width?: number;
    };

    expect(style.width).toBe(268);
    expect(style.alignItems).toBeUndefined();
  });

  it('renders both runs of the tagline, lead and accent', () => {
    renderOtp(DEMO_OTP);

    expect(screen.getByText('minutes')).toBeTruthy();
    expect(screen.getByText(/Trained cooks in/)).toBeTruthy();
  });

  it('offers resend only when the payload says so', () => {
    renderOtp(DEMO_OTP);
    expect(screen.getByTestId('otp-screen-resend').props.accessibilityState.disabled).toBe(true);

    screen.unmount();

    renderOtp(DEMO_OTP_RESEND_READY);
    expect(screen.getByTestId('otp-screen-resend').props.accessibilityState.disabled).toBe(false);
  });
});
