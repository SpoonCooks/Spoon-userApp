import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { useAccountSummary } from '@features/account';
import { useMe } from '@features/auth';
import { useNavigationGuard, useSafeBack } from '@core/navigation';
import {
  AccountHubScreen,
  firstNameOf,
  foodSummaryOf,
  phoneLabelOf,
  poolCardStateOf,
} from '@features/profile';
import { useWhatsAppHelp } from '@features/support';
import { QueryBoundary } from '@ui';

/**
 * Account — Figma `2202:4311` (V1: booking flow, Accounts). Replaces the `6:663` Profile grid.
 *
 * Log out now lives on Manage account (`1517:10267`), and the Refunds tile is gone — the Account
 * frame draws no Refunds entry; a cancelled booking's Visit details carries its own refund.
 */
export default function ProfileRoute() {
  const router = useRouter();
  const me = useMe();
  const summary = useAccountSummary();
  const openHelp = useWhatsAppHelp();
  /**
   * Back -> Home (V7 founder comment): pops when Home pushed this, and falls back to Home for a
   * `spoon://profile` deep link.
   */
  const goBack = useSafeBack('/home');
  // One screen per tap: a quick double tap must not open the same screen twice.
  const guard = useNavigationGuard();

  return (
    <QueryBoundary state={me.state} onRetry={me.refetch}>
      {(identity) => (
        <AccountHubScreen
          model={{
            firstName: firstNameOf(identity.name),
            phone: phoneLabelOf(identity.phone),
            profileComplete: identity.profileComplete,
            foodSummary: foodSummaryOf(identity),
            pool: poolCardStateOf({
              poolCount: summary.poolCount,
              hasBooked: summary.hasBooked,
              pending: summary.poolPending,
            }),
            poolFaces: summary.poolFaces,
            version: Constants.expoConfig?.version ?? '1.0.0',
          }}
          onBack={guard(goBack)}
          /*
           * Both card states open the one food profile form, prefilled (founder's ruling on
           * `222:1590` / `456:3479`): "Finish profile" resumes it, "View & edit" reviews it.
           */
          onFoodProfile={guard(() => router.push('/profile/details' as Href))}
          onViewPool={guard(() => router.push('/cook-pool' as Href))}
          onAddCook={guard(() => router.push('/cook-pool/add' as Href))}
          onBook={guard(() => router.push('/scheduled'))}
          onBookings={guard(() => router.push('/history'))}
          onAddresses={guard(() => router.push('/address?from=profile'))}
          // Every Help control in the app opens Spoon's WhatsApp line (founder, task §15).
          onHelp={guard(() => openHelp('Hi Spoon, I need help with my account.'))}
          onManageAccount={guard(() => router.push('/account' as Href))}
        />
      )}
    </QueryBoundary>
  );
}
