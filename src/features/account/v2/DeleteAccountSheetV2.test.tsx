import { fireEvent, render, screen } from '@testing-library/react-native';

import { DeleteAccountSheetV2 } from './DeleteAccountSheetV2';

const ALL = { cookPool: true, foodProfile: true, visitHistory: true, addresses: true };

function renderSheet(overrides: Partial<Parameters<typeof DeleteAccountSheetV2>[0]> = {}) {
  const props = {
    visible: true,
    losses: ALL,
    onKeep: jest.fn(),
    onDelete: jest.fn(),
    onLogout: jest.fn(),
    ...overrides,
  };
  render(<DeleteAccountSheetV2 {...props} />);
  return props;
}

describe('Delete account — confirm (1517:10413, dev note 2084:2786)', () => {
  it('asks for the deletion code from "Delete permanently" straight away', () => {
    const props = renderSheet();
    fireEvent.press(screen.getByTestId('delete-account-yes'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('lists only what the customer has', () => {
    renderSheet({ losses: { ...ALL, cookPool: false, addresses: false } });
    expect(screen.queryByTestId('delete-account-loss-cookPool')).toBeNull();
    expect(screen.getByTestId('delete-account-loss-foodProfile')).toBeTruthy();
    expect(screen.getByTestId('delete-account-loss-visitHistory')).toBeTruthy();
    expect(screen.queryByTestId('delete-account-loss-addresses')).toBeNull();
  });

  it('draws no list when there is nothing to lose', () => {
    renderSheet({
      losses: { cookPool: false, foodProfile: false, visitHistory: false, addresses: false },
    });
    expect(screen.queryByTestId('delete-account-losses')).toBeNull();
  });

  it('keeps the account, or logs out instead', () => {
    const props = renderSheet();
    fireEvent.press(screen.getByTestId('delete-account-no'));
    expect(props.onKeep).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId('delete-account-logout'));
    expect(props.onLogout).toHaveBeenCalledTimes(1);
  });

  it('shows why the code could not be sent', () => {
    renderSheet({ errorMessage: 'A code was just sent.' });
    expect(screen.getByTestId('delete-account-error')).toBeTruthy();
  });
});
