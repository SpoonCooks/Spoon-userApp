import { useRouter } from 'expo-router';

import { MealLibraryScreen } from '@features/mealLibrary';
import { RouteScaffold } from '@ui';

/**
 * Meal Library — DEV PREVIEW, DEVELOPMENT ONLY. Reachable at `spoon://meal-library`.
 *
 * The screen is not linked from anywhere in the app yet and none of its actions are wired; this
 * route exists purely so it can be looked at on a device, the same reason `recurring-setup.tsx`
 * sits outside `(app)`'s session guard.
 */
export default function MealLibraryPreviewRoute() {
  const router = useRouter();

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Meal Library preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  return <MealLibraryScreen onBack={() => router.back()} />;
}
