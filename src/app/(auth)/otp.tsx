import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { isAppError } from '@core/errors';
import type { AppError } from '@core/errors';
import { useSafeBack } from '@core/navigation';
import { OtpScreen, otpViewModel, useSendOtp, useVerifyOtp } from '@features/auth';
import { DEMO_LOGIN, DEMO_OTP } from '@/demo/fixtures/screens';

/**
 * OTP verification — Figma `227:1649`, wired to `POST /v1/auth/otp/verify`.
 *
 * `DEMO_OTP` supplies static copy only (title, tagline, digit count). Everything else is real:
 * the number came from Login, the cooldown came from `otp/send`'s `retryAfterSeconds`, the
 * rejection message comes from the backend's error code, and a success hands the token triple to
 * the session controller — which writes SecureStore and flips the session machine, so the
 * redirect at `/` takes the user into the app.
 *
 * The countdown is a LABEL ANIMATION, not a rule. It ticks a server-supplied number down so the
 * frame's "Resend OTP in 26s" has something to draw; whether a resend is actually allowed is
 * decided by the server, which answers RATE_LIMITED if it is not.
 */
export default function OtpRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; retryAfter?: string; devOtp?: string }>();

  const phone = params.phone ?? '';
  const verify = useVerifyOtp();
  const resend = useSendOtp();

  const [secondsLeft, setSecondsLeft] = useState(() => Number(params.retryAfter ?? 0) || 0);

  /**
   * "Edit number" is a return to Login, and it is reached by a push in the real flow. The fallback
   * exists for the case where it is not — a cold start into `spoon://otp`, or a reload during
   * development — because an OTP screen with no way back to the number is a trap: the code cannot
   * arrive at a number the customer cannot change.
   */
  const goBack = useSafeBack('/login');

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const error: AppError | null = isAppError(verify.error)
    ? verify.error
    : isAppError(resend.error)
      ? resend.error
      : null;

  const onResend = useCallback(() => {
    if (phone.length === 0) return;
    resend.mutate(phone, {
      onSuccess(result) {
        setSecondsLeft(result.retryAfterSeconds);
      },
    });
  }, [phone, resend]);

  return (
    <OtpScreen
      otp={otpViewModel({
        base: DEMO_OTP,
        phone,
        dialCode: DEMO_LOGIN.dialCode,
        secondsRemaining: secondsLeft,
        error,
        submitting: verify.isPending,
      })}
      onVerify={(code) => {
        if (phone.length === 0) return;
        verify.mutate(
          { phone, otp: code },
          {
            onSuccess(result) {
              /*
               * `onboardingRequired` is the SERVER's answer to "does this account still owe the
               * profile page", and it is the exact inverse of `profileComplete` on `GET /v1/me`
               * — the same three starred fields, read by the same rule. Honouring it here sends
               * a first-run customer straight to `338:4508` instead of bouncing through `/` and
               * waiting on a `/me` that can only agree.
               *
               * It is not a second opinion, and it cannot loop: the profile page's own Confirm
               * decides where onboarding goes next, and `/` remains the authority for every
               * other launch. Anything but onboarding still falls through to the boot gate,
               * which is what owns the address-versus-Home question.
               *
               * Replacing rather than pushing, so Back cannot return to a spent OTP screen.
               */
              router.replace(
                (result.user.onboardingRequired
                  ? '/profile/details?context=onboarding'
                  : '/') as Href,
              );
            },
          },
        );
      }}
      onResend={onResend}
      onEditNumber={goBack}
    />
  );
}
