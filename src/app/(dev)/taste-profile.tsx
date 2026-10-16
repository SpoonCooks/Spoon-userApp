import { useLocalSearchParams, useRouter } from 'expo-router';

import { EMPTY_PROFILE_DETAILS, TasteProfileWizard, WIZARD_STEPS } from '@features/profile';
import type { WizardStepId } from '@features/profile';
import { RouteScaffold } from '@ui';

/**
 * Taste-profile wizard — DEV PREVIEW, DEVELOPMENT ONLY. `spoon://taste-profile` opens step 1;
 * `?step=diet|taste|cook` opens that step, and `?meal=regular-cook` (any meal setup id) opens the
 * Cook step with that setup picked, so the hassle list (`2522:1049`) shows.
 *
 * The real route (`(app)/profile/details.tsx`) sits behind the session guard, which a build with
 * no signed-in session cannot pass — the same reason `cook-pool-preview.tsx` sits outside `(app)`.
 * Nothing here is saved: Save & Continue goes back.
 */
export default function TasteProfilePreviewRoute() {
  const router = useRouter();
  const { step, meal } = useLocalSearchParams<{ step?: string; meal?: string }>();
  const initialStep: WizardStepId = WIZARD_STEPS.find((entry) => entry.id === step)?.id ?? 'family';

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Taste profile preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  return (
    <TasteProfileWizard
      // A new deep link into the open preview starts it afresh on that step.
      key={`${initialStep}-${meal ?? ''}`}
      initialValues={{
        ...EMPTY_PROFILE_DETAILS,
        name: initialStep === 'family' ? '' : 'Aarav',
        dietaryPreference: initialStep === 'family' ? null : 'non-vegetarian',
        mealStructure: meal ?? null,
      }}
      initialStep={initialStep}
      onExit={() => router.back()}
      onSubmit={() => router.back()}
    />
  );
}
