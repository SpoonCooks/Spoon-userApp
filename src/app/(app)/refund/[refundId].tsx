import { useLocalSearchParams } from 'expo-router';

import { useNavigationGuard, useSafeBack } from '@core/navigation';
import { RefundScreen } from '@features/refunds';

/** One refund's tracker. Back returns to wherever it was opened from; Refunds when nothing is below. */
export default function RefundRoute() {
  const { refundId } = useLocalSearchParams<{ refundId: string }>();
  // One screen per tap: a quick double tap must not open (or pop) a screen twice.
  const guard = useNavigationGuard();
  const goBack = useSafeBack('/refunds');
  return <RefundScreen refundId={refundId} onBack={guard(goBack)} />;
}
