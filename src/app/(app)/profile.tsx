import { useRouter } from 'expo-router';

import { ProfileView, useProfileData } from '@features/profile';

/** Profile - Figma `6:663`. */
export default function ProfileRoute() {
  const router = useRouter();
  const { state, refetch } = useProfileData();

  return (
    <ProfileView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      onSelectTile={(tileId) => {
        if (tileId === 'orders') router.push('/history');
        if (tileId === 'addresses') router.push('/address');
        if (tileId === 'refunds') router.push('/refunds');
        // TODO(product B-10): `help` has no destination anywhere in the Figma file.
      }}
      onOpenLink={() => {
        // TODO(product): the live-site and legal URLs are not specified in the design file.
      }}
      onLogout={() => {
        // TODO(backend-contract): sign-out clears SecureStore, the query cache and session status
        // via the session controller once the auth flow is wired.
      }}
    />
  );
}
