import { fireEvent, render, screen } from '@testing-library/react-native';

import { refundTrackerFrom } from '../adapters';
import { refundFixture } from '../fixtures';
import { RefundTracker } from './RefundTracker';

describe('RefundTracker', () => {
  it('opens on the stepper and collapses it from the status row', () => {
    render(
      <RefundTracker refund={refundTrackerFrom(refundFixture())} onContactSupport={jest.fn()} />,
    );
    expect(screen.getByTestId('refund-tracker-steps')).toBeTruthy();
    expect(screen.getByText('Refund in progress')).toBeTruthy();
    fireEvent.press(screen.getByTestId('refund-tracker-toggle'));
    expect(screen.queryByTestId('refund-tracker-steps')).toBeNull();
  });

  it('shows the reference on a completed refund and no support', () => {
    render(
      <RefundTracker
        refund={refundTrackerFrom(
          refundFixture({
            tracker: { status: 'completed', reference: { type: 'ARN', number: '74332' } },
          }),
        )}
        onContactSupport={jest.fn()}
      />,
    );
    expect(screen.getByText('ARN: 74332')).toBeTruthy();
    expect(screen.queryByTestId('refund-tracker-failed')).toBeNull();
  });

  it('sends a failed refund to support with its references', () => {
    const onContactSupport = jest.fn();
    render(
      <RefundTracker
        refund={refundTrackerFrom(refundFixture({ tracker: { status: 'failed' } }))}
        onContactSupport={onContactSupport}
      />,
    );
    expect(screen.getByText("Refund didn't go through")).toBeTruthy();
    fireEvent.press(screen.getByTestId('refund-tracker-support'));
    expect(onContactSupport).toHaveBeenCalledWith(
      expect.stringContaining('booking bk_1, refund rf_1'),
    );
  });
});
