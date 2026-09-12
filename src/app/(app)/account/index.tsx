import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { getUserMessage, isAppError } from '@core/errors';
import { useSafeBack } from '@core/navigation';
import { AccountView, useRequestAccountDeletionOtp } from '@features/account';
import { useMe } from '@features/auth';

/**
 * Account — Figma frame id unavailable for this pass; built from the supplied mock.
 *
 * Reached only from Profile's "Manage account" row, so `useSafeBack('/profile')` matches the
 * Refunds route's reasoning exactly: a pop always lands correctly and gets the platform's
 * reverse-of-push animation.
 *
 * ## Why the code is requested HERE and not on the OTP screen
 *
 * This is Login's order, for Login's reason. `/otp` is pushed only once `otp/send` has answered,
 * carrying the server's cooldown with it — so that screen opens knowing a code really is on its
 * way, and its countdown starts from the real interval rather than from zero.
 *
 * Requesting it on the OTP screen instead put both of those the wrong way round: a send that
 * failed left the customer on a screen whose own copy says a code was sent, and the countdown
 * had nothing to count until the reply landed. Neither is reachable from here.
 *
 * The number is the account's own, read from `GET /v1/me`. It is never typed, and `otp/send`
 * texts whatever is in the body — so the value has to be one the server handed back.
 */
export default function AccountRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/profile');
  const me = useMe();
  const requestOtp = useRequestAccountDeletionOtp();
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);

  const identity = me.state.status === 'ready' ? me.state.data : null;

  /*
   * The three states the sheet has to be honest about, without gating Terms and Privacy — which
   * need no identity at all — behind a `/me` read:
   *
   *   loading -> "Yes" shows as busy rather than dead, and resolves into a real send.
   *   error   -> the reason is drawn in the sheet. Nothing is sent, because there is no number.
   *   ready   -> the send fires.
   */
  const identityErrorMessage =
    me.state.status === 'error' ? getUserMessage(me.state.error) : undefined;

  /*
   * Mapped copy, not `error.message`. The likeliest failure here is RATE_LIMITED — the customer
   * has been asking for codes — and the shared taxonomy already words that as "wait a moment",
   * where the raw field would be the backend's own text or, worse, the transport's synthetic
   * "Request failed with status 429".
   */
  const sendErrorMessage = isAppError(requestOtp.error)
    ? getUserMessage(requestOtp.error)
    : (requestOtp.error?.message ?? undefined);

  return (
    <AccountView
      onBack={goBack}
      onOpenTerms={() => router.push('/legal/terms' as Href)}
      onOpenPrivacy={() => router.push('/legal/privacy' as Href)}
      onOpenDeleteSheet={() => {
        requestOtp.reset();
        setDeleteSheetOpen(true);
      }}
      onCloseDeleteSheet={() => setDeleteSheetOpen(false)}
      onConfirmDelete={() => {
        if (identity === null || requestOtp.isPending) return;

        requestOtp.mutate(identity.phone, {
          onSuccess(result) {
            setDeleteSheetOpen(false);
            router.push({
              pathname: '/account/delete-otp',
              // The cooldown is the SERVER's, carried forward so the OTP screen's countdown
              // starts from the real interval rather than a client constant.
              params: { retryAfter: String(result.retryAfterSeconds) },
            } as Href);
          },
        });
      }}
      deleteSheetVisible={deleteSheetOpen}
      requestingDeleteOtp={requestOtp.isPending || me.state.status === 'loading'}
      requestDeleteOtpErrorMessage={sendErrorMessage ?? identityErrorMessage ?? null}
    />
  );
}
