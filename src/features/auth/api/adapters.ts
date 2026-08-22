import { getUserMessage } from '@core/errors';
import type { AppError } from '@core/errors';

import type { LoginViewModel, OtpViewModel } from '../types';

/**
 * DTO/error -> view model adapters for the auth screens.
 *
 * The screens are pixel-final and already read every string from their view model, so nothing
 * here changes a layout. What these functions decide is CONTENT: which server value lands in
 * which already-designed slot.
 *
 * They format; they do not rule. The resend interval, the digit count and the rejection reason
 * are all server-supplied — the only arithmetic below is turning a remaining-seconds number into
 * the label the frame draws, which is presentation.
 */

/**
 * `230:2086` / `250:2437` — the resend line.
 *
 * The frame draws two states, and the split is a typographic one: while the countdown runs the
 * trailing token is Bold against a Medium lead ("Resend OTP in " + **"26s"**), and once resend is
 * offered it is a single run ("Resend OTP via SMS"). The seconds come from the server's
 * `retryAfterSeconds`, counted down locally purely to animate a label — the SERVER still decides
 * whether a resend is accepted, and a 429 is the real answer.
 */
export function resendLabelFor(
  secondsRemaining: number,
): Pick<OtpViewModel, 'resendLabel' | 'resendLabelAccent' | 'resendEnabled'> {
  if (secondsRemaining <= 0) {
    return { resendLabel: 'Resend OTP via SMS', resendEnabled: true };
  }
  return {
    resendLabel: 'Resend OTP in ',
    resendLabelAccent: `${secondsRemaining}s`,
    resendEnabled: false,
  };
}

/**
 * `227:1680` — "OTP has been sent to +91 9876543210", pre-formatted with the number.
 *
 * The dial code is PASSED IN rather than pattern-matched out of the E.164 string. A greedy
 * `\+\d{1,3}` would read "+919876543210" as "+919" and render "+919 876543210", and no regex
 * can split a country code from a national number without already knowing the country. The
 * caller has that knowledge — it is `LoginViewModel.dialCode`, which is data.
 *
 * A number that does not start with the expected dial code is shown verbatim rather than guessed
 * at, so an unexpected country degrades to "unformatted" instead of "wrong".
 */
export function sentToLabelFor(phoneE164: string, dialCode: string): string {
  const pretty =
    dialCode.length > 0 && phoneE164.startsWith(dialCode)
      ? `${dialCode} ${phoneE164.slice(dialCode.length)}`
      : phoneE164;
  return `OTP has been sent to ${pretty}`;
}

/**
 * Builds the complete OTP view model.
 *
 * It composes rather than letting the caller spread, because spreading is what leaks a stale
 * field: `resendLabelFor` omits `resendLabelAccent` in the offered state, so a spread over the
 * static fixture kept the fixture's "25s" and rendered "Resend OTP via SMS25s". Composing the
 * whole object makes the absent case genuinely absent.
 */
export function otpViewModel(input: {
  readonly base: OtpViewModel;
  readonly phone: string;
  readonly dialCode: string;
  readonly secondsRemaining: number;
  readonly error: AppError | null;
  readonly submitting: boolean;
}): OtpViewModel {
  const resend = resendLabelFor(input.secondsRemaining);

  return {
    title: input.base.title,
    taglineLead: input.base.taglineLead,
    taglineAccent: input.base.taglineAccent,
    taglineSub: input.base.taglineSub,
    digitCount: input.base.digitCount,
    sentToLabel: sentToLabelFor(input.phone, input.dialCode),
    resendLabel: resend.resendLabel,
    ...(resend.resendLabelAccent === undefined
      ? {}
      : { resendLabelAccent: resend.resendLabelAccent }),
    resendEnabled: resend.resendEnabled,
    ...(input.error === null ? {} : { errorMessage: getUserMessage(input.error) }),
    submitting: input.submitting,
  };
}

/**
 * Applies a failure to the Login screen's own error slot.
 *
 * `275:4467`'s error region is the designed home for this, so a rejected number never becomes an
 * `Alert`. RATE_LIMITED is the one a real user meets most often — the send cooldown — and it
 * reads as "wait", not as "that number is wrong".
 */
export function loginWithError(base: LoginViewModel, error: AppError | null): LoginViewModel {
  if (error === null) return base;
  return { ...base, errorMessage: getUserMessage(error) };
}

/** The same, for the OTP screen. A wrong code arrives as INVALID_REQUEST from `otp/verify`. */
export function otpWithError(base: OtpViewModel, error: AppError | null): OtpViewModel {
  if (error === null) return base;
  return { ...base, errorMessage: getUserMessage(error) };
}
