import { useRouter } from 'expo-router';

import { MealBriefView, useMealBriefData } from '@features/mealBrief';

/** Meal Brief & Recipe Link - Figma `3:684`. Skippable by design. */
export default function MealBriefRoute() {
  const router = useRouter();
  const { state, refetch } = useMealBriefData();

  return (
    <MealBriefView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      onSkip={() => router.back()}
      onSubmit={() => {
        // TODO(backend-contract): no meal-brief endpoint exists; the draft is not persisted yet.
        router.back();
      }}
    />
  );
}
