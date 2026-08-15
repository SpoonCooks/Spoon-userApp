import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { DEMO_CANCELLATION } from '@/demo/fixtures/screens';
import { CancelBookingSheet } from './CancelBookingSheet';
import type { CancellationStep } from './CancelBookingSheet';

/**
 * The sheet is implemented visually but NOT wired to any screen (blocker B-11), so these tests
 * are its only consumer for now.
 */
function Harness({ initial = 'policy' as CancellationStep }) {
  const [step, setStep] = useState<CancellationStep>(initial);

  return (
    <CancelBookingSheet
      visible
      cancellation={DEMO_CANCELLATION}
      step={step}
      onStepChange={setStep}
      onClose={jest.fn()}
      onReschedule={jest.fn()}
      onConfirmCancel={jest.fn()}
      onBookAgain={jest.fn()}
    />
  );
}

describe('Cancellation sheet (6:2 → 104:2260 → 104:2336 → 115:2703)', () => {
  it('is one sheet with four steps, not four screens (C-4)', () => {
    render(<Harness />);

    expect(screen.getByTestId('cancel-sheet')).toBeTruthy();
    expect(screen.getByTestId('cancel-step-policy')).toBeTruthy();

    fireEvent.press(screen.getByTestId('cancel-continue-policy'));
    expect(screen.getByTestId('cancel-step-reason')).toBeTruthy();

    fireEvent.press(screen.getByTestId('cancel-reason-mistake'));
    fireEvent.press(screen.getByTestId('cancel-continue-reason'));
    expect(screen.getByTestId('cancel-step-refund')).toBeTruthy();

    fireEvent.press(screen.getByTestId('cancel-confirm'));
    expect(screen.getByTestId('cancel-step-confirmed')).toBeTruthy();
  });

  it('renders the fee schedule as content, never evaluating a tier', () => {
    render(<Harness />);

    expect(screen.getByText('More than 3 hrs to start time')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('displays all three refund figures without computing the subtraction', () => {
    render(<Harness initial="refund" />);

    expect(screen.getByText('Original Booking Paid')).toBeTruthy();
    expect(screen.getByText('Cancellation Processing Fee')).toBeTruthy();
    expect(screen.getByText('Refund Amount')).toBeTruthy();
    expect(screen.getAllByText('₹135')).toHaveLength(2);
  });

  it('requires a reason before continuing', () => {
    render(<Harness initial="reason" />);

    expect(screen.getByTestId('cancel-continue-reason').props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it('shows the reschedule block only when the server allows it (R-3)', () => {
    const { unmount } = render(<Harness />);
    expect(screen.getByTestId('cancel-reschedule-block')).toBeTruthy();
    unmount();

    render(
      <CancelBookingSheet
        visible
        cancellation={{ ...DEMO_CANCELLATION, rescheduleAllowed: false }}
        step="policy"
        onStepChange={jest.fn()}
        onClose={jest.fn()}
        onReschedule={jest.fn()}
        onConfirmCancel={jest.fn()}
        onBookAgain={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('cancel-reschedule-block')).toBeNull();
  });

  describe('reason "Others" (B-19, confirmed product rule)', () => {
    it('reveals a free-text field only for the reason that requires it', () => {
      render(<Harness initial="reason" />);

      fireEvent.press(screen.getByTestId('cancel-reason-mistake'));
      expect(screen.queryByTestId('cancel-reason-detail')).toBeNull();

      fireEvent.press(screen.getByTestId('cancel-reason-others'));
      expect(screen.getByTestId('cancel-reason-detail')).toBeTruthy();
    });

    it('keeps Continue disabled until the free text has content', () => {
      render(<Harness initial="reason" />);

      fireEvent.press(screen.getByTestId('cancel-reason-others'));
      expect(screen.getByTestId('cancel-continue-reason').props.accessibilityState.disabled).toBe(
        true,
      );

      // Whitespace is not content.
      fireEvent.changeText(screen.getByTestId('cancel-reason-detail'), '   ');
      expect(screen.getByTestId('cancel-continue-reason').props.accessibilityState.disabled).toBe(
        true,
      );

      fireEvent.changeText(screen.getByTestId('cancel-reason-detail'), 'Cook never called');
      expect(screen.getByTestId('cancel-continue-reason').props.accessibilityState.disabled).toBe(
        false,
      );
    });

    it('hands the reason id AND the free text to the confirm callback', () => {
      const onConfirmCancel = jest.fn();
      function DetailHarness() {
        const [step, setStep] = useState<CancellationStep>('reason');
        return (
          <CancelBookingSheet
            visible
            cancellation={DEMO_CANCELLATION}
            step={step}
            onStepChange={setStep}
            onClose={jest.fn()}
            onConfirmCancel={onConfirmCancel}
            onBookAgain={jest.fn()}
          />
        );
      }

      render(<DetailHarness />);
      fireEvent.press(screen.getByTestId('cancel-reason-others'));
      fireEvent.changeText(screen.getByTestId('cancel-reason-detail'), 'Cook never called');
      fireEvent.press(screen.getByTestId('cancel-continue-reason'));
      fireEvent.press(screen.getByTestId('cancel-confirm'));

      expect(onConfirmCancel).toHaveBeenCalledWith('others', 'Cook never called');
    });
  });

  it('renders a refund that disagrees with paid − fee, exactly as supplied', () => {
    render(
      <CancelBookingSheet
        visible
        cancellation={{
          ...DEMO_CANCELLATION,
          refundRows: [
            { label: 'Original Booking Paid', value: '₹135' },
            { label: 'Cancellation Processing Fee', value: '₹34' },
            // Deliberately NOT 135 − 34. A computing client could not produce this.
            { label: 'Refund Amount', value: '₹95', emphasis: 'total' },
          ],
        }}
        step="refund"
        onStepChange={jest.fn()}
        onClose={jest.fn()}
        onConfirmCancel={jest.fn()}
        onBookAgain={jest.fn()}
      />,
    );

    expect(screen.getByText('₹135')).toBeTruthy();
    expect(screen.getByText('₹34')).toBeTruthy();
    expect(screen.getByText('₹95')).toBeTruthy();
    expect(screen.queryByText('₹101')).toBeNull();
  });

  it('steps back within the sheet rather than closing it', () => {
    render(<Harness initial="reason" />);

    fireEvent.press(screen.getByTestId('cancel-sheet-back'));
    expect(screen.getByTestId('cancel-step-policy')).toBeTruthy();
  });
});
