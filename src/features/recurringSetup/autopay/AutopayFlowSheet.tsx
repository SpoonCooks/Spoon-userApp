import type { CheckoutLauncher } from '@features/payment';

import type { RecurringBookingDto } from '../api';
import { AutopaySheet } from './AutopaySheet';
import type { AutopaySheetSummary } from './AutopaySheet';
import { useAutopayFlow } from './useAutopayFlow';
import type { AutopaySource } from './useAutopayFlow';

/**
 * The live UPI Autopay sheet: `useAutopayFlow` driving `AutopaySheet`. Opened over the Summary by
 * "Book Now" (note 2317:13580) and from a live booking that needs Autopay re-approved.
 */
export interface AutopayFlowSheetProps {
  readonly visible: boolean;
  readonly source: AutopaySource;
  readonly summary: AutopaySheetSummary;
  readonly userId: string | null;
  /** Back / scrim on the list: the booking (if saved) stays waiting for approval. */
  readonly onClose: () => void;
  /** "Back to home" while the bank is still confirming (2317:13605). */
  readonly onBackToHome: () => void;
  /** "View my plan" once Autopay is on (2317:13617): the Recurring live booking. */
  readonly onViewPlan: (recurringBookingId: string) => void;
  readonly launcher?: CheckoutLauncher;
  /** See `useAutopayFlow`: keep the saved booking so a reopened sheet reuses it. */
  readonly onBookingSaved?: (booking: RecurringBookingDto) => void;
  readonly testID?: string;
}

export function AutopayFlowSheet({
  visible,
  source,
  summary,
  userId,
  onClose,
  onBackToHome,
  onViewPlan,
  launcher,
  onBookingSaved,
  testID,
}: AutopayFlowSheetProps) {
  const flow = useAutopayFlow({
    open: visible,
    source,
    userId,
    ...(launcher === undefined ? {} : { launcher }),
    ...(onBookingSaved === undefined ? {} : { onBookingSaved }),
  });
  return (
    <AutopaySheet
      visible={visible}
      state={flow.state}
      summary={summary}
      apps={flow.apps}
      lastUsedId={flow.lastUsedId}
      showAllApps={flow.showAllApps}
      now={flow.now}
      onPick={flow.pick}
      onMoreApps={flow.showMoreApps}
      onClose={onClose}
      onOpenAgain={flow.openAgain}
      onCancel={flow.cancel}
      onTryAgain={flow.tryAgain}
      onChooseAnother={flow.chooseAnother}
      onBackToHome={onBackToHome}
      onViewPlan={() => {
        if (flow.bookingId !== null) onViewPlan(flow.bookingId);
      }}
      onRescan={flow.rescan}
      {...(testID === undefined ? {} : { testID })}
    />
  );
}
