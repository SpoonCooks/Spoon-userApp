import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { getUserMessage, isAppError, isRateLimited } from '@core/errors';
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
   * Mapped copy, not `error.message` — the raw field would be the backend's own text or, worse,
   * the transport's synthetic "Request failed with status 429".
   *
   * RATE_LIMITED gets its OWN wording here rather than the shared taxonomy's "Too many attempts."
   * That sentence is true on Login, where a customer taps Resend and is told they tapped it too
   * often. It was never true here: deletion's code used to come from the endpoint login shares,
   * whose cooldown is keyed on the phone, so a customer who signed in and went straight to Delete
   * Account was told they had attempted too many times on their FIRST press. The endpoint now
   * carries its own cooldown and that case is gone, but the remaining one -- pressing Yes, going
   * back, pressing it again -- is still not "too many attempts", it is one attempt too soon.
   *
   * No countdown: a 429 carries no retry hint the client keeps, and inventing 30 seconds from the
   * SUCCESS envelope would be a guess dressed as a fact. The OTP screen counts down the real
   * interval, because there the server has just told us what it is.
   */
  const sendErrorMessage =
    isAppError(requestOtp.error) && isRateLimited(requestOtp.error)
      ? 'A code was just sent. Please wait a moment before asking for another.'
      : isAppError(requestOtp.error)
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

        // No argument: the endpoint resolves the account from the session. `identity` is still
        // required above, because the sheet must not open against a profile that failed to load.
        requestOtp.mutate(undefined, {
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
