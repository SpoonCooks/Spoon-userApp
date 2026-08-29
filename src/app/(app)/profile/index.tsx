import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { useDeterministicBack } from '@core/navigation';
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
   * meant to end at the same place. Deterministic rather than a pop so the destination is the
   * product decision it was written as, not a consequence of how the customer got here.
   */
  const goBack = useDeterministicBack('/home');

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
        if (tileId === 'addresses') router.push('/address');
        if (tileId === 'refunds') router.push('/refunds');
        /*
         * `69:502` — the Help tile. Blocker B-10 ("no destination anywhere in the file") is
         * CLOSED: the founder's comment on the final file settles every Help control in the app
         * on Spoon's WhatsApp line (task §15). It was the last inert Help entry point.
         */
        if (tileId === 'help') openHelp('Hi Spoon, I need help with my account.');
      }}
      /**
       * `6:779` — the legal row.
       *
       * BACKEND_GAP (`docs/FRONTEND_BACKEND_PENDING.md`): no legal or policy URL is published by
       * any endpoint, so `ProfileLinkViewModel.url` is absent and the row renders as plain text
       * rather than as a control. This handler therefore only runs once a URL EXISTS — it opens
       * that URL and never a guessed one, because sending a customer to an invented address for a
       * terms document is worse than not linking it.
       */
      /**
       * Terms and Privacy open IN THE APP, at `spoon://legal/:doc`.
       *
       * This used to be `Linking.openURL`, which ejected the customer into Chrome or Safari — and
       * with no legal URL published by any endpoint (BACKEND_GAP, see `features/legal`), the row
       * had nothing to open at all and simply did nothing. The documents now ship with the app,
       * so the link id IS the route parameter and there is no URL to look up or fail on.
       *
       * Pushed, not replaced: the customer is reading a document mid-session and Back has to
       * return them to Profile.
       */
      onOpenLink={(linkId) => {
        router.push(`/legal/${linkId}` as Href);
      }}
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
