import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useSafeBack } from '@core/navigation';
import { useRuntime } from '@core/runtimeContext';
import { OtpScreen, otpViewModel, useMe } from '@features/auth';
import { useConfirmAccountDeletion, useRequestAccountDeletionOtp } from '@features/account';
import { QueryBoundary } from '@ui';
import { DEMO_LOGIN, DEMO_OTP } from '@/demo/fixtures/screens';

/**
 * Delete-account OTP confirmation — reuses `OtpScreen` (`@features/auth`) exactly as Login draws
 * it, per the supplied mock: same brand block, same six-box panel, same countdown/error copy.
 * `DEMO_OTP` / `DEMO_LOGIN.dialCode` supply the same static copy Login's own OTP screen uses —
 * this is not a second design, it is the same screen for a second purpose.
 *
 * Reached only from the Account screen's Delete Account confirmation, so `useSafeBack('/account')`
 * matches every other single-entry-point screen in this app (Refunds, Account itself).
 *
 * Why this is NOT `useSendOtp`/`useVerifyOtp`: those are login's, and `useVerifyOtp` rotates the
 * session's tokens on success as an inseparable side effect — reusing it here would silently
 * re-authenticate the customer instead of confirming a deletion. See `@features/account/data.ts`
 * for `useRequestAccountDeletionOtp` / `useConfirmAccountDeletion`, both local stubs pending a
 * dedicated backend contract (`docs/FRONTEND_BACKEND_PENDING.md`, `BACKEND_GAP_ACCOUNT_DELETE`).
 *
 * The pencil (`onEditNumber` on `OtpScreen`) has nothing to "edit" here — there is no phone entry
 * step, the number is the account's own. It is repurposed as the screen's cancel: back to Account.
 */
export default function DeleteAccountOtpRoute() {
  const router = useRouter();
  const { session } = useRuntime();
  const params = useLocalSearchParams<{ retryAfter?: string }>();
  const me = useMe();

  const requestOtp = useRequestAccountDeletionOtp();
  const confirmDeletion = useConfirmAccountDeletion();

  const [secondsLeft, setSecondsLeft] = useState(() => Number(params.retryAfter ?? 0) || 0);

  const goBack = useSafeBack('/account');

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const onResend = useCallback(() => {
    requestOtp.mutate(undefined, {
      onSuccess(result) {
        setSecondsLeft(result.retryAfterSeconds);
      },
    });
  }, [requestOtp]);

  return (
    <QueryBoundary state={me.state} onRetry={me.refetch}>
      {(identity) => {
        /*
         * `otpViewModel`'s `error` slot maps a backend `AppError` to copy via `getUserMessage` —
         * the "kind" taxonomy for a transport failure. `AccountDeletionUnavailableError` isn't
         * one: it is a known, named gap with its OWN message, not a status code to interpret. So
         * its `.message` is written straight into the slot rather than routed through that
         * mapping, which would otherwise replace the real reason with a generic "something went
         * wrong".
         */
        const base = otpViewModel({
          base: DEMO_OTP,
          phone: identity.phone,
          dialCode: DEMO_LOGIN.dialCode,
          secondsRemaining: secondsLeft,
          error: null,
          submitting: confirmDeletion.isPending,
        });
        const otp =
          confirmDeletion.error === null
            ? base
            : { ...base, errorMessage: confirmDeletion.error.message };

        return (
          <OtpScreen
            otp={otp}
            onVerify={(code) => {
              confirmDeletion.mutate(code, {
                onSuccess() {
                  // Unreachable until the real endpoint exists — see the boundary note above.
                  // Kept so only `useConfirmAccountDeletion`'s `mutationFn` needs to change: a
                  // customer who deletes their account must end up signed out, same as Log Out.
                  void session.signOut().then(() => router.replace('/' as Href));
                },
              });
            }}
            onResend={onResend}
            onEditNumber={goBack}
          />
        );
      }}
    </QueryBoundary>
  );
}
