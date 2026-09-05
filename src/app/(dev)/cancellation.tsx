import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { CancelBookingSheet, useCancellationData } from '@features/cancellation';
import type { CancellationStep } from '@features/cancellation';
import { QueryBoundary, RouteScaffold, Screen } from '@ui';

/**
 * Cancellation sheet — DEVELOPMENT ONLY. Reachable at `spoon://cancellation`.
 *
 * The four-step sheet (`6:2` → `104:2260` → `104:2336` → `115:2703`) is designed, built, and now
 * REACHABLE in the product: `booking/[id]` draws Cancel and opens this same sheet at `policy`.
 * Blocker B-11 — "no live-booking screen draws a Cancel control" — is closed, and the note that
 * said so was left behind when the control landed. It mattered: read literally it told a reviewer
 * this flow could not be opened on a device, which would justify either skipping it in testing or
 * building a second entry point beside the one that already exists.
 *
 * The route survives its blocker because it is still the only way to open a given STEP directly.
 * `?step=` jumps to any of the four without arranging a booking in the matching state, which is
 * what makes the frames comparable one at a time. It invents no entry point in the product and
 * refuses to render outside `__DEV__`.
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
