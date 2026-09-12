import { fireEvent, render, screen } from '@testing-library/react-native';

import { DeleteAccountSheet } from './DeleteAccountSheet';

const actions = {
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DeleteAccountSheet', () => {
  it('renders the prompt and the No/Yes pair', () => {
    render(<DeleteAccountSheet visible {...actions} />);

    expect(screen.getByTestId('delete-account-sheet')).toBeTruthy();
    expect(screen.getByText('Are you sure you want to delete?')).toBeTruthy();
    expect(screen.getByTestId('delete-account-no')).toBeTruthy();
    expect(screen.getByTestId('delete-account-yes')).toBeTruthy();
  });

  it('closes on No and on the header back control, never confirming', () => {
    render(<DeleteAccountSheet visible {...actions} />);

    fireEvent.press(screen.getByTestId('delete-account-no'));
    expect(actions.onClose).toHaveBeenCalledTimes(1);
    expect(actions.onConfirm).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('delete-account-sheet-back'));
    expect(actions.onClose).toHaveBeenCalledTimes(2);
  });

  it('confirms on Yes', () => {
    render(<DeleteAccountSheet visible {...actions} />);

    fireEvent.press(screen.getByTestId('delete-account-yes'));
    expect(actions.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while the code is being requested', () => {
    render(<DeleteAccountSheet visible {...actions} confirming />);

    expect(screen.getByTestId('delete-account-no').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('delete-account-yes').props.accessibilityState.disabled).toBe(true);
  });

  /**
   * A code that never went out stops the flow HERE.
   *
   * The OTP screen's own copy says a code has been sent, so opening it on a failed send would
   * make the screen state something untrue and leave the customer waiting for a message that is
   * not coming. Login stops the same failure on the same screen, for the same reason.
   */
  it('shows a failed send without dismissing, so the OTP screen never opens', () => {
    render(
      <DeleteAccountSheet
        visible
        {...actions}
        errorMessage="Too many attempts. Please wait a moment and try again."
      />,
    );

    expect(screen.getByTestId('delete-account-sheet')).toBeTruthy();
    expect(screen.getByText('Too many attempts. Please wait a moment and try again.')).toBeTruthy();
  });
});
