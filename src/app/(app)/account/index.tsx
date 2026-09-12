import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { AccountView, useRequestAccountDeletionOtp } from '@features/account';

/**
 * Account — Figma frame id unavailable for this pass; built from the supplied mock.
 *
 * Reached only from Profile's "Manage account" row, so `useSafeBack('/profile')` matches the
 * Refunds route's reasoning exactly: a pop always lands correctly and gets the platform's
 * reverse-of-push animation.
 *
 * "Yes" on the confirmation sheet requests an OTP (`useRequestAccountDeletionOtp`, a local stub —
 * see `@features/account`) and, on success, hands off to `/account/delete-otp` carrying the
 * cosmetic countdown, exactly as Login hands off to `/otp` with `retryAfter`.
 */
export default function AccountRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/profile');
  const requestOtp = useRequestAccountDeletionOtp();
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);

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
        if (requestOtp.isPending) return;
        requestOtp.mutate(undefined, {
          onSuccess(result) {
            setDeleteSheetOpen(false);
            router.push(`/account/delete-otp?retryAfter=${result.retryAfterSeconds}` as Href);
          },
        });
      }}
      deleteSheetVisible={deleteSheetOpen}
      requestingDeleteOtp={requestOtp.isPending}
      requestDeleteOtpErrorMessage={requestOtp.error?.message ?? null}
    />
  );
}
