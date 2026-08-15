import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScheduleView, useScheduleData } from '@features/scheduled';

/**
 * Reschedule - Figma `47:*`. The same screen as Schedule with `mode: reschedule` (C-2), and no
 * Duration section (C-3).
 *
 * Submit is intentionally inert. Blocker B-4: the Reschedule bar shows `Pay ->` with no price,
 * which after ruling R-1 would open Razorpay for an unspecified amount. No submit or payment path
 * is wired until that is answered. Ruling R-3 additionally means eligibility comes from the
 * server - the client never infers it.
 */
export default function RescheduleRoute() {
  const router = useRouter();
  useLocalSearchParams<{ id: string }>();
  const { state, refetch } = useScheduleData('reschedule');

  return (
    <ScheduleView
      state={state}
      onRetry={refetch}
      onBack={() => router.back()}
      onSubmit={() => {
        // Intentionally inert until blocker B-4 resolves whether rescheduling can charge.
      }}
      onOpenMealBrief={() => router.push('/meal-brief')}
    />
  );
}
