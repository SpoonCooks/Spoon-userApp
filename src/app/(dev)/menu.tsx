import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { DevRouteMenu, RouteScaffold, Screen } from '@ui';

/**
 * Development navigation — DEVELOPMENT ONLY. Reachable at `spoon://menu`.
 *
 * This menu used to be rendered BELOW the Login screen inside `(auth)/login.tsx`. That was a
 * layout defect, not just untidiness: `LoginScreen` is a `flex: 1` `SafeAreaView`, and a ~1500pt
 * content-sized sibling in the same column shrank it to a few pixels. `spoon://login` therefore
 * resolved to the route but rendered the dev menu, which is why Login could never be compared
 * against `53:174` on the handset.
 *
 * Splitting it out keeps `/login` byte-identical to the frame and leaves production navigation
 * untouched — nothing in the app links here, and the route refuses to render outside `__DEV__`.
 */
export default function DevMenuRoute() {
  const router = useRouter();

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Development navigation"
        status="foundation"
        notes={['The development navigation menu is available in development builds only']}
      />
    );
  }

  return (
    <Screen scroll testID="dev-menu-route">
      <DevRouteMenu onNavigate={(path) => router.push(path as Href)} />
    </Screen>
  );
}
