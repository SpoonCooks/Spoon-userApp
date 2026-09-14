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

/**
 * App-store compliance. Apple and Google both reject deletion flows that fail to say the action
 * is immediate and irreversible, or that overstate what is erased.
 *
 * These assert the SUBSTANCE rather than the sentences — the wording is the product's to change,
 * but a release that drops any of these claims is a release that gets rejected, and that should
 * fail here rather than in review.
 */
describe('what the sheet has to disclose', () => {
  it('says the deletion is immediate and cannot be reversed', () => {
    render(<DeleteAccountSheet visible {...actions} />);

    expect(screen.getByText(/immediately and cannot be undone/i)).toBeTruthy();
  });

  it('names what is erased, and that it ends every session', () => {
    render(<DeleteAccountSheet visible {...actions} />);

    const erased = screen.getByText(/permanently deleted/i);
    expect(erased).toHaveTextContent(/name/i);
    expect(erased).toHaveTextContent(/phone number/i);
    expect(erased).toHaveTextContent(/addresses/i);
    expect(erased).toHaveTextContent(/signed out everywhere/i);
  });

  /**
   * The one that would actually fail review. Bookings, payments and refunds SURVIVE a deletion —
   * eight years of them — so a sheet that implies otherwise is making a false claim about the
   * customer's data on the screen where they consent to losing it.
   */
  it('admits that financial records are kept, and for how long', () => {
    render(<DeleteAccountSheet visible {...actions} />);

    const retained = screen.getByText(/8 years/i);
    expect(retained).toHaveTextContent(/Payment and invoice records/i);
    expect(retained).toHaveTextContent(/name and number removed/i);
  });

  it('never claims everything is deleted', () => {
    render(<DeleteAccountSheet visible {...actions} />);

    expect(screen.getByTestId('delete-account-disclosure')).not.toHaveTextContent(
      /all (of )?your data/i,
    );
  });
});
