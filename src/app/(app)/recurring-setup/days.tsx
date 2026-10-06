import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';

import {
  RecurringAutopayScreen,
  RecurringBookedScreen,
  RecurringPlanFlow,
  RecurringPlanningProvider,
  useRecurringPlanningSource,
} from '@features/recurringSetup';
import type {
  MandateVerifyDto,
  RecurringBookingDto,
  RecurringPlanDraft,
} from '@features/recurringSetup';
import { useSafeBack } from '@core/navigation';

/**
 * Recurring setup — the whole flow: pick days and plans → Schedule each plan's visits → Summary
 * → UPI Autopay → confirmation. Reachable at `spoon://recurring-setup/days`. (The file keeps its
 * name: `/recurring-setup` itself is the dev preview's path, `(dev)/recurring-setup.tsx`, and two
 * routes can't share it.)
 *
 * The flow plans against the backend's Recurring reads (DEC-086): the window and day limits, the
 * days a live Recurring booking already has, the durations with their base and effective prices,
 * and start times per visit by time of day (`useRecurringPlanningSource`). Each falls back to the
 * local rules until it has answered.
 *
 * "Book Now" opens the Autopay step with the plans; its back (and "Change times", after a time was
 * taken) returns to the Summary with the plans as they were. The Autopay step and the
 * confirmation have no Figma frames yet (see their headers).
 *
 * The "?" on every screen opens the Recurring landing page (`/recurring`, `1302:2617`).
 *
 * Not linked from anywhere in the app yet; `/home` is a placeholder fallback for the same reason:
 * nothing has decided where this flow is entered from, nor where the Recurring tab lives.
 */
type Stage =
  | { readonly kind: 'flow'; readonly plans: readonly RecurringPlanDraft[] | null }
  | { readonly kind: 'autopay'; readonly plans: readonly RecurringPlanDraft[] }
  | {
      readonly kind: 'booked';
      readonly booking: RecurringBookingDto;
      readonly mandate: MandateVerifyDto;
    };

export default function RecurringSetupRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/home');
  const planning = useRecurringPlanningSource();
  const [stage, setStage] = useState<Stage>({ kind: 'flow', plans: null });

  if (stage.kind === 'booked') {
    return (
      <RecurringBookedScreen
        booking={stage.booking}
        mandate={stage.mandate}
        onDone={() => router.dismissTo('/home')}
      />
    );
  }

  if (stage.kind === 'autopay' && planning.addressId !== null) {
    const backToSummary = () => setStage({ kind: 'flow', plans: stage.plans });
    return (
      <RecurringPlanningProvider value={planning}>
        <RecurringAutopayScreen
          addressId={planning.addressId}
          plans={stage.plans}
          onBack={backToSummary}
          onChangeTimes={backToSummary}
          onBooked={(booking, mandate) => setStage({ kind: 'booked', booking, mandate })}
        />
      </RecurringPlanningProvider>
    );
  }

  // Swipe-back is off: a sweep across the calendar from its Monday column would otherwise start
  // the stack's back gesture. Each screen has its own back button.
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <RecurringPlanningProvider value={planning}>
        <RecurringPlanFlow
          onExit={goBack}
          onOpenInfo={() => router.push('/recurring')}
          onComplete={(plans) => setStage({ kind: 'autopay', plans })}
          {...(stage.plans === null
            ? {}
            : {
                seed: {
                  plans: stage.plans,
                  stage: { kind: 'summary', planIndex: 0, visitIndex: 0 },
                },
              })}
        />
      </RecurringPlanningProvider>
    </>
  );
}
