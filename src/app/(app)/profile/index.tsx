import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { useSignOut } from '@features/auth';
import { ProfileView, useProfileData } from '@features/profile';
import { useWhatsAppHelp } from '@features/support';

/** Profile - Figma `6:663`. */
export default function ProfileRoute() {
  const router = useRouter();
  const { state, refetch } = useProfileData();
  const signOut = useSignOut();
  const openHelp = useWhatsAppHelp();
  /**
   * `6:663` back -> HOME, always (V7 founder comment, task §14/§15).
   *
   * Profile is reachable from Home's banner and from a `spoon://profile` deep link, and both are
   * meant to end at the same place — which is also exactly where a pop lands, since the only
   * push to `/profile` in the app is Home's. `useSafeBack`, not `useDeterministicBack`: popping
   * gets the platform's reverse-of-push closing animation (matching Scheduled's), where
   * `dismissAll` + `replace` played none; the deep-link case still falls back to `/home` when
   * there is nothing to pop.
   */
  const goBack = useSafeBack('/home');

  return (
    <ProfileView
      state={state}
      onRetry={refetch}
      onBack={goBack}
      /**
       * `222:1590` / `456:3479` — Complete profile / View profile.
       *
       * ONE destination for both states, per the founder's ruling: the same `338:4508` page,
       * opened in the EDIT context so it arrives prefilled, keeps its back control, and returns
       * here on Confirm rather than pushing the customer into the address flow (task §10).
       */
      onOpenProfileDetails={() => router.push('/profile/details' as Href)}
      onSelectTile={(tileId) => {
        if (tileId === 'orders') router.push('/history');
        if (tileId === 'addresses') router.push('/address?from=profile');
        if (tileId === 'refunds') router.push('/refunds');
        /*
         * `69:502` — the Help tile. Blocker B-10 ("no destination anywhere in the file") is
         * CLOSED: the founder's comment on the final file settles every Help control in the app
         * on Spoon's WhatsApp line (task §15). It was the last inert Help entry point.
         */
        if (tileId === 'help') openHelp('Hi Spoon, I need help with my account.');
      }}
      /** V9 — the legal row moved into `@features/account`; Profile now only opens that screen. */
      onOpenManageAccount={() => router.push('/account' as Href)}
      onLogout={() => {
        // Revokes the session server-side, then clears SecureStore, the query cache and the
        // session machine. The local teardown is not conditional on the network call, so this
        // always ends signed out.
        signOut.mutate(undefined, {
          onSettled() {
            router.replace('/' as Href);
          },
        });
      }}
    />
  );
}
