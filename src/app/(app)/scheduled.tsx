import { useRouter } from 'expo-router';

import { ScheduleView, useScheduleData } from '@features/scheduled';

/**
 * Scheduled booking - Figma `37:*` / `34:*`. One screen, four progressively-disclosed sections.
 *
 * No booking horizon is encoded (blocker B-8): the day row renders whatever the payload provides.
 *
 * `37:3912` — the black `Pay ->` pill inset in the CTA — is DRAWN by the booking frame, so it is
 * wired here and renders. Leaving `onPay` unsupplied hid it, which left the bar with a centred
 * label instead of the frame's left-aligned label plus pill. Ruling R-1 still holds: pressing it
 * takes no payment, and reschedule mode supplies no `payLabel`, so no Razorpay path exists there.
 */
export default function ScheduledRoute() {
  const router = useRouter();
  const { state, refetch } = useScheduleData('book');

  return (
    <ScheduleView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      onSubmit={() => {
        // TODO(backend-contract / ruling R-1): create the booking, then open Razorpay checkout.
        // Not implemented in this phase, and success is never inferred client-side.
      }}
      onPay={() => {
        // TODO(backend-contract / ruling R-1): opens Razorpay checkout. Same seam as `onSubmit`.
      }}
      onOpenMealBrief={() => router.push('/meal-brief')}
    />
  );
}
