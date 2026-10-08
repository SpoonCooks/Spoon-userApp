import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking, Text } from 'react-native';

import { AppUpdateGate } from './AppUpdateGate';
import { useAppUpdate } from './useAppUpdate';

jest.mock('./useAppUpdate');
jest.mock('@core/config', () => ({
  getConfig: () => ({ androidPackage: 'com.spoonhelp.customer', iosAppStoreId: '123456' }),
}));

const mockedUseAppUpdate = jest.mocked(useAppUpdate);

function show(requirement: 'none' | 'optional' | 'required', message: string | null = null) {
  const dismiss = jest.fn();
  mockedUseAppUpdate.mockReturnValue({ requirement, message, dismiss });
  render(
    <AppUpdateGate>
      <Text testID="app">the app</Text>
    </AppUpdateGate>,
  );
  return dismiss;
}

describe('AppUpdateGate', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  it('shows nothing over the app when no update is needed', () => {
    show('none');
    expect(screen.getByTestId('app')).toBeTruthy();
    expect(screen.queryByTestId('app-update-required')).toBeNull();
    expect(screen.queryByTestId('app-update-optional')).toBeNull();
  });

  it('blocks with no way to close it when the update is mandatory', () => {
    show('required');
    expect(screen.getByText('Update required')).toBeTruthy();
    expect(screen.queryByText('Not now')).toBeNull();
    // Android back must do nothing: the modal's close handler is inert.
    expect(screen.getByTestId('app-update-modal').props.onRequestClose()).toBeUndefined();
  });

  it('keeps the app mounted underneath the mandatory screen', () => {
    show('required');
    expect(screen.getByTestId('app')).toBeTruthy();
  });

  it('shows the console message on the mandatory screen when one is set', () => {
    show('required', 'Please update — we fixed your payments.');
    expect(screen.getByText('Please update — we fixed your payments.')).toBeTruthy();
  });

  it('lets an optional update be dismissed', () => {
    const dismiss = show('optional');
    fireEvent.press(screen.getByTestId('app-update-optional-dismiss'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('sends the Update button to the store', () => {
    show('required');
    fireEvent.press(screen.getByTestId('app-update-required-action'));
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
  });
});
