import { fireEvent, render, screen } from '@testing-library/react-native';

import { PaymentFailedBody } from './PaymentFailedBody';

const actions = {
  onRetry: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PaymentFailedBody', () => {
  it('renders the retry amount from the price snapshot, never a computed figure', () => {
    render(
      <PaymentFailedBody
        amountPaise={13545}
        retrying={false}
        cancelAllowed
        cancelling={false}
        {...actions}
      />,
    );

    expect(screen.getByText('Retry payment • ₹135.45')).toBeTruthy();
  });

  it('calls onRetry when the retry CTA is pressed', () => {
    render(
      <PaymentFailedBody
        amountPaise={13545}
        retrying={false}
        cancelAllowed
        cancelling={false}
        {...actions}
      />,
    );

    fireEvent.press(screen.getByTestId('payment-failed-retry'));
    expect(actions.onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides Cancel booking when the server has not authorised it', () => {
    render(
      <PaymentFailedBody
        amountPaise={13545}
        retrying={false}
        cancelAllowed={false}
        cancelling={false}
        {...actions}
      />,
    );

    expect(screen.queryByTestId('payment-failed-cancel')).toBeNull();
  });

  it('calls onCancel when Cancel booking is pressed', () => {
    render(
      <PaymentFailedBody
        amountPaise={13545}
        retrying={false}
        cancelAllowed
        cancelling={false}
        {...actions}
      />,
    );

    fireEvent.press(screen.getByTestId('payment-failed-cancel'));
    expect(actions.onCancel).toHaveBeenCalledTimes(1);
  });
});
