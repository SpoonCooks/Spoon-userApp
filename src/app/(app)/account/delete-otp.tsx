import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { idempotency } from '@core/api';
import { getUserMessage, isAppError } from '@core/errors';
import { useSafeBack } from '@core/navigation';
import {
  accountDeletionScope,
  deletionFailureView,
  useConfirmAccountDeletion,
  useRequestAccountDeletionOtp,
} from '@features/account';
import { OtpScreen, otpViewModel, useMe } from '@features/auth';
import type { OtpNotice } from '@features/auth';
import { useWhatsAppHelp } from '@features/support';
import { QueryBoundary } from '@ui';
import { DEMO_LOGIN, DEMO_OTP } from '@/demo/fixtures/screens';

/**
 * Delete-account confirmation — `POST /v1/auth/otp/send` then `DELETE /v1/me`.
 *
 * The screen is Login's `OtpScreen` (`@features/auth`), reused rather than reproduced: same brand
 * block, same six-box panel, same countdown and rejected-code states. It is not a second design.
 *
 * ## What is deliberately NOT here
 *
 * `POST /v1/auth/otp/verify` is never called. It would consume the one-time code and mint a fresh
 * session as a side effect, so the code this screen collects would be spent before `DELETE /v1/me`
 * — which verifies it itself — ever saw it. The code goes straight into the delete call.
 *
 * ## The number
 *
 * `otp/send` texts whatever number is in the body, so the number is read back from `GET /v1/me`
 * and never typed. The pencil (`onEditNumber`) therefore has nothing to edit and is repurposed as
 * this screen's cancel: back to Account.
 *
 * ## The idempotency key
 *
 * One key per ATTEMPT, held across every retry of it — a wrong code, a block, a timeout — because
 * the server hashes an empty body against the key and marks a failure retryable, so the same key
 * with a corrected code is processed normally. Leaving this screen abandons the attempt and
 * retires the key, so re-entering the flow starts a genuinely new one.
 */
export default function DeleteAccountOtpRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ retryAfter?: string }>();
  const me = useMe();
  const openHelp = useWhatsAppHelp();
  const requestOtp = useRequestAccountDeletionOtp();
  const confirmDeletion = useConfirmAccountDeletion();
  const goBack = useSafeBack('/account');

  /*
   * Seeded from the send that already happened on the Account screen, exactly as Login's OTP
   * screen is seeded by the send that happened on Login. This screen is only ever reached once a
   * code is genuinely on its way, so the countdown starts from the server's own interval instead
   * of from zero.
   */
  const [secondsLeft, setSecondsLeft] = useState(() => Number(params.retryAfter ?? 0) || 0);

  const identity = me.state.status === 'ready' ? me.state.data : null;
  const phone = identity === null ? null : identity.phone;
  const scope = identity === null ? null : accountDeletionScope(identity.id);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  /** Leaving is abandoning: the next visit is a new attempt and must not reuse this key. */
  useEffect(() => {
    if (scope === null) return undefined;
    return () => idempotency.release(scope);
  }, [scope]);

  const onResend = useCallback(() => {
    if (phone === null || requestOtp.isPending) return;
    requestOtp.mutate(undefined, {
      onSuccess(result) {
        setSecondsLeft(result.retryAfterSeconds);
      },
    });
  }, [phone, requestOtp]);

  const noticeFor = useCallback(
    (failure: ReturnType<typeof deletionFailureView>): OtpNotice | undefined => {
      const blocked = failure?.notice;
      if (blocked === undefined) return undefined;
      if (blocked.actionLabel === undefined || blocked.target === undefined) {
        return { message: blocked.message };
      }

      const target = blocked.target;
      return {
        message: blocked.message,
        actionLabel: blocked.actionLabel,
        onAction: () => {
          /*
           * REPLACE, not push. Taking this link abandons the deletion: the blocker has to be
           * cleared first, and the code in the boxes will have expired long before that is done.
           * Pushing left this spent screen underneath, so backing out of the bookings list
           * returned the customer to an OTP they could no longer use and could not get past —
           * observed on staging. Replacing drops it, leaving the Account screen as the thing
           * behind them, which is where a second attempt starts anyway. Unmounting also retires
           * the idempotency key, which is correct: the next attempt is a new one.
           */
          if (target === 'bookings') router.replace('/history' as Href);
          if (target === 'refunds') router.replace('/refunds' as Href);
          // No resolution screen exists in this app (BLOCKED_BY_MISSING_EXISTING_UI in
          // `docs/FRONTEND_BACKEND_PENDING.md`), so a recovery case goes to the same WhatsApp
          // line every other Help control in the app goes to. That one does not navigate, so
          // the screen stays as it is.
          if (target === 'support') openHelp('Hi Spoon, I want to delete my account.');
        },
      };
    },
    [openHelp, router],
  );

  return (
    <QueryBoundary state={me.state} onRetry={me.refetch}>
      {(account) => {
        const failure = deletionFailureView(confirmDeletion.error);
        /*
         * Only a RESEND can fail here — the first code was already sent before this screen
         * opened. So "OTP has been sent to +91 …" stays true and is left alone; a failed resend
         * is reported in the error slot, which is what Login's OTP screen does with the same
         * failure.
         */
        const resendError = isAppError(requestOtp.error) ? requestOtp.error : null;

        const base = otpViewModel({
          base: DEMO_OTP,
          phone: account.phone,
          dialCode: DEMO_LOGIN.dialCode,
          secondsRemaining: secondsLeft,
          error: null,
          submitting: confirmDeletion.isPending,
        });

        const errorMessage =
          failure?.errorMessage ?? (resendError === null ? undefined : getUserMessage(resendError));
        const notice = noticeFor(failure);

        const otp = {
          ...base,
          ...(errorMessage === undefined ? {} : { errorMessage }),
          // A code cannot be re-sent while one is already on its way out, and it cannot be
          // re-sent mid-deletion: the code in the boxes is the one being spent.
          resendEnabled: base.resendEnabled && !requestOtp.isPending && !confirmDeletion.isPending,
        };

        return (
          <OtpScreen
            otp={otp}
            onVerify={(code) => {
              if (scope === null || confirmDeletion.isPending) return;
              confirmDeletion.mutate(
                { otp: code, scope },
                {
                  onSuccess() {
                    /*
                     * The account, every session and every refresh token are already gone, and
                     * the mutation has cleared what this device still held. Nothing authenticated
                     * may be called from here — it would 401 — so this only moves the customer:
                     * `/` is the boot gate, which sends an unauthenticated app to Login.
                     */
                    router.replace('/' as Href);
                  },
                },
              );
            }}
            onResend={onResend}
            onEditNumber={goBack}
            {...(notice === undefined ? {} : { notice })}
          />
        );
      }}
    </QueryBoundary>
  );
}
