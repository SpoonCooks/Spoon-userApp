import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  RecurringAutopayScreen,
  RecurringDaysScreen,
  RecurringPlanConfirmedScreen,
  RecurringReviewScreen,
  RecurringTimeScreen,
  RecurringTimesByDateScreen,
} from '@features/recurringSetup';
import { RouteScaffold } from '@ui';

/**
 * Recurring setup — DEV PREVIEW, DEVELOPMENT ONLY. Reachable at `spoon://recurring-setup`,
 * `?step=2`, etc. — the same `?step=` convention `ScheduleScreen`'s route already uses.
 *
 * The real routes (`(app)/recurring-setup/*.tsx`) sit behind `(app)/_layout.tsx`'s session guard
 * like every other authenticated screen, so they redirect to `/login` on a device with no
 * signed-in session — which this build has no way to establish without a live backend. This route
 * exists purely so the screens being built for this flow can be looked at on a device while that
 * is true, the same reason `showcase.tsx` and `menu.tsx` sit outside `(app)`.
 *
 * Grows as each step is built; nothing here is wired to the real flow or to the previous step's
 * selection.
 */
/** `144:2404` opens on Sep 28 = today + 3. */
const FIGMA_TODAY = new Date(2026, 8, 25);

export default function RecurringSetupPreviewRoute() {
  const router = useRouter();
  const { step, visits } = useLocalSearchParams<{ step?: string; visits?: string }>();
  const goBack = () => router.back();

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Recurring setup preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  switch (step) {
    case '2':
      return <RecurringTimeScreen onBack={goBack} />;
    case '3': {
      const visitCount: 1 | 2 | 3 = visits === '1' ? 1 : visits === '2' ? 2 : 3;
      return <RecurringTimesByDateScreen onBack={goBack} visitCount={visitCount} />;
    }
    case '4':
      return <RecurringReviewScreen onBack={goBack} />;
    case '5':
      return <RecurringAutopayScreen onBack={goBack} />;
    case '6':
      return <RecurringPlanConfirmedScreen />;
    default:
      // Pinned to the date the Figma frames are drawn for (window Sep 28 – Oct 18), so the
      // preview can be compared against `144:2404` side by side. The real route uses today.
      return <RecurringDaysScreen onBack={goBack} today={FIGMA_TODAY} />;
  }
}
