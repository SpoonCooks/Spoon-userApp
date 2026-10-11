import { fireEvent, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';

import { DEMO_ADDRESS_OUT_OF_SERVICE } from '@/demo/fixtures/screens';
import { AddressOutOfServiceView } from './AddressScreens';

/**
 * The saved list, map, search and details form moved to the redesign in `../v2` and are tested
 * there (`AddressMapScreen.test.tsx`, `model.test.ts`) and through their routes. What remains in
 * this file is the out-of-service screen, unchanged by the redesign.
 */
describe('Address out of service (215:1472)', () => {
  it('draws the header, the headline and the message', () => {
    render(
      <AddressOutOfServiceView
        state={ready(DEMO_ADDRESS_OUT_OF_SERVICE)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('address-out-of-service-screen')).toBeTruthy();
    expect(screen.getByText('Choose another location')).toBeTruthy();
    expect(screen.getByText(DEMO_ADDRESS_OUT_OF_SERVICE.title)).toBeTruthy();
    expect(screen.getByText(DEMO_ADDRESS_OUT_OF_SERVICE.message)).toBeTruthy();
  });

  it('goes back from its header', () => {
    const onBack = jest.fn();
    render(
      <AddressOutOfServiceView
        state={ready(DEMO_ADDRESS_OUT_OF_SERVICE)}
        onRetry={jest.fn()}
        onBack={onBack}
      />,
    );

    fireEvent.press(screen.getByTestId('address-header-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
