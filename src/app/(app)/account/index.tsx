import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { useNavigationGuard, useSafeBack } from '@core/navigation';
import { ManageAccountScreen } from '@features/account';
import { useSignOut } from '@features/auth';

/**
 * Manage account — Figma `1517:10267` (dev note `2084:2777`). Reached only from the Account hub's
 * "Manage account" row, so a pop always lands correctly.
 *
 * Delete Account moved one level down, to Account & data (`/account/data`), which keeps the
 * deletion-code request exactly as this screen used to make it.
 */
export default function AccountRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/profile');
  const signOut = useSignOut();
  // One screen per tap: a quick double tap must not open the same screen twice.
  const guard = useNavigationGuard();

  return (
    <ManageAccountScreen
      onBack={guard(goBack)}
      onAccountData={guard(() => router.push('/account/data' as Href))}
      onPrivacy={guard(() => router.push('/legal/privacy' as Href))}
      onTerms={guard(() => router.push('/legal/terms' as Href))}
      loggingOut={signOut.isPending}
      onLogout={() => {
        // Revokes the session server-side, then clears SecureStore, the query cache and the
        // session machine. The local teardown is not conditional on the network call, so this
        // always ends signed out — and the account stays, so the number can sign back in.
        signOut.mutate(undefined, {
          onSettled() {
            router.replace('/' as Href);
          },
        });
      }}
    />
  );
}
