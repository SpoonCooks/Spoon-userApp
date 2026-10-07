import { useRouter } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { CookPoolScreen } from '@features/cookPool';

/**
 * Your Cook Pool — the landing. Entered from Home's pool card and from the recurring landing; back
 * returns to whichever opened it (`/home` when nothing did, as on a deep link).
 */
export default function CookPoolRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/home');

  return (
    <CookPoolScreen
      onBack={goBack}
      onAddCooks={() => router.push('/cook-pool/add')}
      onOpenCook={(cookId) => router.push({ pathname: '/cook-pool/[cookId]', params: { cookId } })}
    />
  );
}
