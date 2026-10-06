import { useRouter } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { RecurringLandingScreen } from '@features/recurringLanding';

/**
 * Recurring — the landing. Both "schedule" buttons open the plan flow's day picker; "Make your Cook
 * Pool" opens the Cook Pool landing. Back returns to whatever opened it (`/home` when nothing
 * did, as on a deep link).
 *
 * Not linked from Home yet: its entry point has not been designed in.
 */
export default function RecurringRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/home');

  return (
    <RecurringLandingScreen
      onBack={goBack}
      onSchedule={() => router.push('/recurring-setup/days')}
      onMakeCookPool={() => router.push('/cook-pool')}
    />
  );
}
