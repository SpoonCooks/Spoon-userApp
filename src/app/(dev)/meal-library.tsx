import { useLocalSearchParams, useRouter } from 'expo-router';

import { MealLibraryScreen, useMealLibraryDemo } from '@features/mealLibrary';
import { RouteScaffold } from '@ui';

/**
 * Meal Library — DEV PREVIEW, DEVELOPMENT ONLY. Reachable at `spoon://meal-library`.
 *
 * The screen is not linked from anywhere in the app yet and none of its actions are wired; this
 * route exists purely so it can be looked at on a device, the same reason `recurring-setup.tsx`
 * sits outside `(app)`'s session guard. `useMealLibraryDemo` stands in for the catalogue backend.
 *
 * `?diet=` stands in for the profile's `dietaryPreference` (`vegan`, `vegetarian`, `eggetarian`,
 * `non-vegetarian`), which this route cannot read without a session.
 */
export default function MealLibraryPreviewRoute() {
  const router = useRouter();
  const { diet } = useLocalSearchParams<{ diet?: string }>();
  const demo = useMealLibraryDemo();

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Meal Library preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  return (
    <MealLibraryScreen {...demo} onBack={() => router.back()} dietaryPreference={diet ?? null} />
  );
}
