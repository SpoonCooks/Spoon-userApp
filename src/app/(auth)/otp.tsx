import { useLocalSearchParams, useRouter } from 'expo-router';

import { OtpScreen } from '@features/auth';
import { DEMO_OTP, DEMO_OTP_ERROR, DEMO_OTP_RESEND_READY } from '@/demo/fixtures/screens';

/**
 * OTP verification — NEW Figma `227:1649` "Page 17b- Login OTP".
 *
 * This screen was blocker B-7 ("do not invent it") until the new file designed it. It is now built
 * as drawn.
 *
 * DEV reachability (task §12): `?state=` selects the states the frames imply —
 * `waiting` (countdown running), `ready` (resend offered), `error` (server rejected the code).
 * The switch is `__DEV__`-only; a release build always renders the waiting state from real data.
 *
 * BOUNDARY: verifying, resending, expiry and rate limits are all backend. Every callback is inert.
 */
const DEV_STATES = {
  waiting: DEMO_OTP,
  ready: DEMO_OTP_RESEND_READY,
  error: DEMO_OTP_ERROR,
} as const;

export default function OtpRoute() {
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state?: keyof typeof DEV_STATES }>();
  const otp = __DEV__ && state !== undefined ? (DEV_STATES[state] ?? DEMO_OTP) : DEMO_OTP;

  return (
    <OtpScreen
      otp={otp}
      onVerify={() => {
        // TODO(backend-contract): verify the code, then hand off to the session controller.
      }}
      onResend={() => {
        // TODO(backend-contract): re-request the code. The interval is a server/config value.
      }}
      onEditNumber={() => router.back()}
    />
  );
}
