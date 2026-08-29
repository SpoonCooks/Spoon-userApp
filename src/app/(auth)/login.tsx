import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { isAppError } from '@core/errors';
import type { AppError } from '@core/errors';
import { LoginScreen, loginWithError, toE164, useSendOtp } from '@features/auth';
import { DEMO_LOGIN } from '@/demo/fixtures/screens';

/**
 * Login — Figma `53:174`, built as drawn and now wired to `POST /v1/auth/otp/send`.
 *
 * `DEMO_LOGIN` supplies the screen's STATIC COPY only — the title, tagline, placeholder and legal
 * footer, none of which the backend owns or serves. Everything the server does decide flows
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

  const error: AppError | null = isAppError(sendOtp.error) ? sendOtp.error : null;

  return (
    <>
      <LoginScreen
        login={{
          ...loginWithError(DEMO_LOGIN, error),
          submitting: sendOtp.isPending,
        }}
        /**
         * `250:2423` — the two legal links under the CTA, which used to do NOTHING.
         *
         * `LoginScreen` has always accepted `onOpenTerms` / `onOpenPrivacy` as optional props and
         * this route never supplied either, so both were drawn underlined, looked tappable, and
         * absorbed the press silently. That is the dead control task §11 forbids, and it is worse
         * here than anywhere else in the app: the line directly above them reads "By continuing, I
         * accept the Terms of use & Privacy policy", so the customer was being asked to accept two
         * documents they had no way to read.
         *
         * `/legal/:doc` sits outside the `(app)` group precisely so it is reachable from here,
         * with no session. Pushed, so Back returns to Login with the typed number intact.
         */
        onOpenTerms={() => router.push('/legal/terms' as Href)}
        onOpenPrivacy={() => router.push('/legal/privacy' as Href)}
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
