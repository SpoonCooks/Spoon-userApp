import { fireEvent, render, screen } from '@testing-library/react-native';

import { refundTrackerFrom } from '../adapters';
import type { RefundTrackerDto } from '../api';
import { refundFixture } from '../fixtures';
import { RefundTracker } from './RefundTracker';

const AT = {
  initiated: '2026-10-12T17:51:00.000Z',
  processed: '2026-10-12T18:31:00.000Z',
};

/** The three steps, each done (`at`) or not (`null`). */
function steps(processed: string | null, completed: string | null) {
  return [
    { key: 'initiated' as const, at: AT.initiated },
    { key: 'processed' as const, at: processed },
    { key: 'completed' as const, at: completed },
  ];
}

function renderRefund(tracker: Partial<RefundTrackerDto>, onContactSupport = jest.fn()) {
  render(
    <RefundTracker
      refund={refundTrackerFrom(refundFixture({ tracker }), { timeZone: 'Asia/Kolkata' })}
      onContactSupport={onContactSupport}
    />,
  );
  return onContactSupport;
}

const PROGRESS = 'refund-tracker-progress';

/** Figma `Refund tracker` (`2303:4231`) — its four states, inside the refund card. */
describe('RefundTracker', () => {
  it('Initiated (2303:4070): "In progress", step 1 ticked with its time, the rest muted', () => {
    renderRefund({ status: 'in_progress', steps: steps(null, null) });
    expect(screen.getByText('Booking refund ₹54.34')).toBeTruthy();
    expect(screen.getByText('To: Original source')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    // Only a step that happened shows a time.
    expect(screen.getAllByText(/^12 Oct, 11:21/i)).toHaveLength(1);
    expect(screen.getByText('Refund processed')).toBeTruthy();
    expect(screen.queryByTestId(`${PROGRESS}-support`)).toBeNull();
  });

  it('Processed (2303:4107): still "In progress", steps 1–2 ticked', () => {
    renderRefund({ status: 'in_progress', steps: steps(AT.processed, null) });
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getAllByText(/^1[23] Oct, /)).toHaveLength(2);
  });

  it('Completed (2303:4147): "Refunded", all ticked, the RRN under the last step', () => {
    renderRefund({
      status: 'completed',
      steps: steps(AT.processed, AT.processed),
      reference: { type: 'RRN', number: '664320396937' },
    });
    expect(screen.getByText('Refunded')).toBeTruthy();
    expect(screen.getAllByText(/^1[23] Oct, /)).toHaveLength(3);
    expect(screen.getByText('RRN: 664320396937')).toBeTruthy();
    expect(screen.queryByTestId(`${PROGRESS}-support`)).toBeNull();
  });

  it('Failed (2303:4191): "Refund failed", step 2 is the ✕ line, and Contact support', () => {
    const onContactSupport = renderRefund({ status: 'failed', steps: steps(null, null) });
    expect(screen.getByText('Refund failed')).toBeTruthy();
    expect(screen.getByTestId(`${PROGRESS}-step-failed`)).toBeTruthy();
    expect(screen.getByText('Refund didn’t go through')).toBeTruthy();
    expect(screen.queryByText('Refund processed')).toBeNull();
    // Why it failed is for Ops, never the customer.
    expect(screen.queryByText(/Our team/)).toBeNull();
    fireEvent.press(screen.getByTestId(`${PROGRESS}-support`));
    expect(onContactSupport).toHaveBeenCalledWith(
      expect.stringContaining('booking bk_1, refund rf_1'),
    );
  });

  it('opens on the steps and folds them from the status pill, the RRN with them', () => {
    renderRefund({
      status: 'completed',
      steps: steps(AT.processed, AT.processed),
      reference: { type: 'ARN', number: '74332' },
    });
    expect(screen.getByTestId(`${PROGRESS}-steps`)).toBeTruthy();
    fireEvent.press(screen.getByTestId(`${PROGRESS}-status`));
    expect(screen.queryByTestId(`${PROGRESS}-steps`)).toBeNull();
    expect(screen.queryByText('ARN: 74332')).toBeNull();
    fireEvent.press(screen.getByTestId(`${PROGRESS}-status`));
    expect(screen.getByText('ARN: 74332')).toBeTruthy();
  });
});
