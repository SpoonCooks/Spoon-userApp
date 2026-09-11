import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { AccountView, useDeleteAccount } from '@features/account';

/**
 * Account — Figma frame id unavailable for this pass; built from the supplied mock.
 *
 * Reached only from Profile's "Manage account" row, so `useSafeBack('/profile')` matches the
 * Refunds route's reasoning exactly: a pop always lands correctly and gets the platform's
 * reverse-of-push animation.
 */
export default function AccountRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/profile');
  const deleteAccount = useDeleteAccount();
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);

  return (
    <AccountView
      onBack={goBack}
      onOpenTerms={() => router.push('/legal/terms' as Href)}
      onOpenPrivacy={() => router.push('/legal/privacy' as Href)}
      onOpenDeleteSheet={() => {
        deleteAccount.reset();
        setDeleteSheetOpen(true);
      }}
      onCloseDeleteSheet={() => setDeleteSheetOpen(false)}
      onConfirmDelete={() => {
        if (deleteAccount.isPending) return;
        deleteAccount.mutate();
      }}
      deleteSheetVisible={deleteSheetOpen}
      deleting={deleteAccount.isPending}
      deleteErrorMessage={deleteAccount.error?.message ?? null}
    />
  );
}
