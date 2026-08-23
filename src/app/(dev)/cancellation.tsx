import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import { QueryBoundary, RouteScaffold, Screen } from '@ui';

/**
 * Cancellation sheet — DEVELOPMENT ONLY. Reachable at `spoon://cancellation`.
 *
 * The four-step sheet (`6:2` → `104:2260` → `104:2336` → `115:2703`) is fully designed and fully
 * built, but blocker B-11 means **no live-booking screen draws a Cancel control**, so the flow has
 * no product entry point and could not be opened on a device at all. That made it the one built
 * surface that could never be compared against its frames.
 *
 * This route is the review path and nothing more: it invents no entry point in the product, and it
 * refuses to render outside `__DEV__`. `?step=` opens any of the four steps directly.
 */
const DEV_STEPS: readonly CancellationStep[] = ['policy', 'reason', 'refund', 'confirmed'];

export default function DevCancellationRoute() {
  const router = useRouter();
  const { step: requested } = useLocalSearchParams<{ step?: string }>();
  const initial = DEV_STEPS.find((candidate) => candidate === requested) ?? 'policy';
  const [step, setStep] = useState<CancellationStep>(initial);
  const { state, refetch } = useCancellationData();

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Cancellation"
        status="foundation"
        notes={['The cancellation sheet has no product entry point yet (blocker B-11)']}
      />
    );
  }

  return (
    <Screen testID="dev-cancellation-route">
      <QueryBoundary state={state} onRetry={refetch}>
        {(cancellation) => (
          <CancelBookingSheet
            visible
            cancellation={cancellation}
            step={step}
            onStepChange={setStep}
            onClose={() => router.back()}
            onReschedule={() => router.push('/reschedule/demo')}
            onHelp={() => {
              // TODO(product B-10): `Help` still has no destination anywhere in the file.
            }}
            onConfirmCancel={() => {
              // Review-only: no request is made, so the step is advanced here to keep `115:2703`
              // reachable from the dev menu. The REAL host advances only on the server's answer.
              setStep('confirmed');
            }}
            onBookAgain={() => router.back()}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}
