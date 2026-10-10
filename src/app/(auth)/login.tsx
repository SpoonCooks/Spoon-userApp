import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { readLastPhone } from '@core/auth';
import { isAppError } from '@core/errors';
import type { AppError } from '@core/errors';
import {
  consumePhoneEdit,
  isGuestModeAvailable,
  LoginScreen,
  loginSendErrorMessage,
  toE164,
  useContinueAsGuest,
  useSendOtp,
} from '@features/auth';
import { DEMO_LOGIN } from '@/demo/fixtures/screens';

/**
 * Login — Figma `cCQlzTeiObQkpVBzwI8mZi` page "Login" (`1923:1139`), wired to
 * `POST /v1/auth/otp/send`.
 *
 * `DEMO_LOGIN` supplies the screen's STATIC COPY only — the headline, button and legal footer,
 * none of which the backend owns or serves. Everything the server does decide flows
 * through the mutation: whether the number was accepted, how long the resend cooldown is, and
 * what to say when it refuses.
 *
 * The number is normalised to E.164 here and carried to `/otp` as a route param, because the OTP
 * screen must verify against the SAME string that was sent — re-deriving it there would be a
 * second chance to get it wrong.
 *
 * The route renders NOTHING but the frame; the `__DEV__` handle in the corner is a
 * zero-footprint tap target that opens the review menu.
 */
export default function LoginRoute() {
  const router = useRouter();
  const sendOtp = useSendOtp();
  const continueAsGuest = useContinueAsGuest();
  const guestModeAvailable = isGuestModeAvailable();

  const error: AppError | null = isAppError(sendOtp.error) ? sendOtp.error : null;

  /*
   * The OTP screen's Back / Edit return here "with the number prefilled and the keyboard open".
   * The number never left (this screen stays mounted under the OTP screen); the keyboard is
   * brought back only when the return came from there, not from the Terms page.
   */
  const [focusKey, setFocusKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (consumePhoneEdit()) setFocusKey((key) => key + 1);
    }, []),
  );

  /**
   * The number from this device's last sign-in, if `core/auth/lastPhoneStore` has one — read
   * once, off the splash the boot gate (`app/index.tsx`) already held. `undefined` while the
   * read is in flight and `LoginScreen` just waits; there is deliberately no second loading
   * surface here (task §13/§25 — the boot splash is the only one).
   */
  const [initialPhone, setInitialPhone] = useState<string | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    void readLastPhone().then((stored) => {
      if (!cancelled) setInitialPhone(stored ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <LoginScreen
        login={{
          ...DEMO_LOGIN,
          ...(error === null ? {} : { errorMessage: loginSendErrorMessage(error) }),
          submitting: sendOtp.isPending,
        }}
        {...(initialPhone === undefined ? {} : { initialPhone })}
        focusKey={focusKey}
        // A stale send failure clears as soon as the number is edited.
        onChangePhone={() => {
          if (sendOtp.error !== null) sendOtp.reset();
        }}
        /**
         * `1923:1330` — "By continuing, you agree to our Terms of use & Privacy policy". Tapping Get
         * OTP is the acceptance; the links only open the documents, in-app.
         *
         * `/legal/:doc` sits outside the `(app)` group precisely so it is reachable from here,
         * with no session. Pushed, so Back returns to Login with the typed number intact.
         */
        onOpenTerms={() => router.push('/legal/terms' as Href)}
        onOpenPrivacy={() => router.push('/legal/privacy' as Href)}
        /**
         * Guest mode (iOS only). Replacing rather than pushing: Home is the
         * guest's root, and every "sign in to continue" there REPLACES back to this screen, so
         * the stack never grows a Login/Home ping-pong.
         */
        {...(guestModeAvailable
          ? {
              onSkip: () => {
                if (continueAsGuest.isPending) return;
                continueAsGuest.mutate(undefined, {
                  onSuccess: () => router.replace('/home'),
                });
              },
            }
          : {})}
        onRequestOtp={(digits) => {
          const phone = toE164(digits, DEMO_LOGIN.dialCode);

          sendOtp.mutate(phone, {
            onSuccess(result) {
              router.push({
                pathname: '/otp',
                params: {
                  phone,
                  // The cooldown is the SERVER's, carried forward so the OTP screen's countdown
                  // starts from the real interval rather than a client constant.
                  retryAfter: String(result.retryAfterSeconds),
                  // Development-only echo. Absent in staging and production by construction.
                  ...(result.devOtp === undefined ? {} : { devOtp: result.devOtp }),
                },
              } as Href);
            },
          });
        }}
      />

      {__DEV__ ? (
        <Pressable
          style={styles.devHandle}
          onPress={() => router.push('/menu' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Development navigation"
          testID="login-dev-menu-handle"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  /** Absolute, transparent and unpainted: it occupies no layout and draws nothing. */
  devHandle: { position: 'absolute', top: 0, left: 0, width: 44, height: 44 },
});
