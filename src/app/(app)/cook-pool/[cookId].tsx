import { useLocalSearchParams, useRouter } from 'expo-router';

import { useNavigationGuard, useSafeBack } from '@core/navigation';
import { CookProfileScreen } from '@features/cookPool';

/**
 * Cook Profile. Opened from a cook on the pool landing, from Home, and from the assigned cook in a
 * booking; back returns to whichever it was. Removing the cook from the pool returns to the
 * landing — popping back to it when it is below, opening it in place when it is not.
 */
export default function CookProfileRoute() {
  const router = useRouter();
  const { cookId } = useLocalSearchParams<{ cookId: string }>();
  // One screen per tap: a quick double tap must not open (or pop) a screen twice.
  const guard = useNavigationGuard();
  const goBack = useSafeBack('/cook-pool');

  return (
    <CookProfileScreen
      cookId={cookId}
      onBack={guard(goBack)}
      onRemoved={guard(() => router.dismissTo('/cook-pool'))}
    />
  );
}
