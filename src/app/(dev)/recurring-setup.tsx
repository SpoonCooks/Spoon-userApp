import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { RecurringDaysScreen, RecurringPlanFlow } from '@features/recurringSetup';
import { RouteScaffold } from '@ui';

/**
 * Recurring setup — DEV PREVIEW, DEVELOPMENT ONLY. `spoon://recurring-setup` runs the whole flow;
 * `?step=1` shows the day picker on its own.
 *
 * The real routes (`(app)/recurring-setup/*.tsx`) sit behind `(app)/_layout.tsx`'s session guard
 * like every other authenticated screen, so they redirect to `/login` on a device with no
 * signed-in session — which this build has no way to establish without a live backend. This route
 * exists purely so the screens being built for this flow can be looked at on a device while that
 * is true, the same reason `showcase.tsx` and `menu.tsx` sit outside `(app)`.
 */
/** `144:2404` opens on Sep 28 = today + 3. */
const FIGMA_TODAY = new Date(2026, 8, 25);

export default function RecurringSetupPreviewRoute() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step?: string }>();
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
    case '1':
      return (
        <>
          <Stack.Screen options={{ gestureEnabled: false }} />
          <RecurringDaysScreen onBack={goBack} today={FIGMA_TODAY} />
        </>
      );
    default:
      // The redesigned flow end to end: days and plans → Schedule per plan → Summary. Pinned to
      // the date the Figma frames are drawn for (window Sep 28 – Oct 18), so it can be compared
      // against them side by side. The real route uses today. Swipe-back is off: a sweep across
      // the calendar from its Monday column would otherwise start the stack's back gesture.
      return (
        <>
          <Stack.Screen options={{ gestureEnabled: false }} />
          <RecurringPlanFlow onExit={goBack} today={FIGMA_TODAY} />
        </>
      );
  }
}
