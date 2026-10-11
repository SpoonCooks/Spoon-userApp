import { useRouter } from 'expo-router';

import { useNavigationGuard, useSafeBack } from '@core/navigation';
import { CookPoolScreen } from '@features/cookPool';

/**
 * Your Cook Pool — the landing. Entered from Home's pool card and from the recurring landing; back
 * returns to whichever opened it (`/home` when nothing did, as on a deep link).
 */
export default function CookPoolRoute() {
  const router = useRouter();
  // One screen per tap: a quick double tap must not open (or pop) a screen twice.
  const guard = useNavigationGuard();
  const goBack = useSafeBack('/home');

  return (
    <CookPoolScreen
      onBack={guard(goBack)}
      onAddCooks={guard(() => router.push('/cook-pool/add'))}
      onOpenCook={guard((cookId) =>
        router.push({ pathname: '/cook-pool/[cookId]', params: { cookId } }),
      )}
    />
  );
}
