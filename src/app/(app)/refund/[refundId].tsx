import { useLocalSearchParams } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { RefundScreen } from '@features/refunds';

/** One refund's tracker. Back returns to wherever it was opened from; Refunds when nothing is below. */
export default function RefundRoute() {
  const { refundId } = useLocalSearchParams<{ refundId: string }>();
  const goBack = useSafeBack('/refunds');
  return <RefundScreen refundId={refundId} onBack={goBack} />;
}
