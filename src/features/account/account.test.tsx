import { fireEvent, render, screen } from '@testing-library/react-native';

import { AccountView } from './screens/AccountScreen';

/**
 * Account — reached from Profile's "Manage account" row. No Figma frame id for this pass; see
 * `screens/AccountScreen.tsx`.
 */

const actions = {
  onBack: jest.fn(),
  onOpenTerms: jest.fn(),
  onOpenPrivacy: jest.fn(),
  onOpenDeleteSheet: jest.fn(),
  onCloseDeleteSheet: jest.fn(),
  onConfirmDelete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Account screen', () => {
  it('draws the three rows', () => {
    render(<AccountView {...actions} deleteSheetVisible={false} />);

    expect(screen.getByTestId('account-screen')).toBeTruthy();
    expect(screen.getByText('Terms of Service')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Delete Account')).toBeTruthy();
  });

  it('routes Terms and Privacy to their own controls', () => {
    render(<AccountView {...actions} deleteSheetVisible={false} />);

    fireEvent.press(screen.getByTestId('account-terms'));
    expect(actions.onOpenTerms).toHaveBeenCalledTimes(1);
    expect(actions.onOpenPrivacy).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('account-privacy'));
    expect(actions.onOpenPrivacy).toHaveBeenCalledTimes(1);
  });

  it('opens the delete-confirmation sheet from the Delete Account row, not a direct delete', () => {
    render(<AccountView {...actions} deleteSheetVisible={false} />);

    fireEvent.press(screen.getByTestId('account-delete'));
    expect(actions.onOpenDeleteSheet).toHaveBeenCalledTimes(1);
    expect(actions.onConfirmDelete).not.toHaveBeenCalled();
  });

  it('renders the sheet visible once opened, and wires its Yes to onConfirmDelete', () => {
    render(<AccountView {...actions} deleteSheetVisible />);

    expect(screen.getByTestId('delete-account-sheet')).toBeTruthy();

    fireEvent.press(screen.getByTestId('delete-account-yes'));
    expect(actions.onConfirmDelete).toHaveBeenCalledTimes(1);
  });

  /**
   * "Yes" requests the code from here, so a send that fails has to be reported here — the OTP
   * screen is only reached once a code is genuinely on its way.
   */
  it('surfaces a failed code request in the sheet', () => {
    render(
      <AccountView
        {...actions}
        deleteSheetVisible
        requestDeleteOtpErrorMessage="Too many attempts. Please wait a moment and try again."
      />,
    );

    expect(screen.getByTestId('delete-account-sheet')).toBeTruthy();
    expect(screen.getByText('Too many attempts. Please wait a moment and try again.')).toBeTruthy();
  });

  it('shows the request as in flight rather than letting it be fired twice', () => {
    render(<AccountView {...actions} deleteSheetVisible requestingDeleteOtp />);

    expect(screen.getByTestId('delete-account-yes').props.accessibilityState.disabled).toBe(true);
  });
});
