import { useRouter } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { RecurringLandingScreen, useExplainerVideoSource } from '@features/recurringLanding';
import { useRecurringEligibility } from '@features/recurringSetup';

/**
 * Recurring — the landing. "Make your Cook Pool" opens the Cook Pool landing. Both "schedule"
 * buttons open the plan flow's day picker once Recurring is unlocked (DEC-086: 2 pool Cooks);
 * until then they open the Cook Pool too — the spec's locked action — rather than a flow whose
 * every read would refuse the household. While eligibility has not answered, the flow opens as
 * before and its own reads decide. Back returns to whatever opened it (`/home` when nothing did,
 * as on a deep link).
 *
 * The explainer video's URL is set in one place, `@features/recurringLanding`'s `video.ts`.
 *
 * Opened from Home's "Check Recurring" chip (a household below the unlock).
 */
export default function RecurringRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/home');
  const videoSource = useExplainerVideoSource();
  const eligibility = useRecurringEligibility();
  const locked = eligibility.state.status === 'ready' && !eligibility.state.data.unlocked;

  return (
    <RecurringLandingScreen
      onBack={goBack}
      onSchedule={() => router.push(locked ? '/cook-pool' : '/recurring-setup/days')}
      onMakeCookPool={() => router.push('/cook-pool')}
      {...(videoSource === undefined ? {} : { videoSource })}
    />
  );
}
