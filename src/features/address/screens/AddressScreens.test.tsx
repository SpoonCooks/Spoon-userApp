import { fireEvent, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';

import {
  DEMO_ADDRESS_DETAILS,
  DEMO_ADDRESS_DETAILS_EDIT,
  DEMO_ADDRESS_LIST,
  DEMO_ADDRESS_LIST_EMPTY,
  DEMO_ADDRESS_LOCATION,
  DEMO_ADDRESS_LOCATION_UNSERVICEABLE,
} from '@/demo/fixtures/screens';
import { AddressDetailsView, AddressLocationView, SavedAddressesView } from './AddressScreens';

describe('Saved addresses (68:214)', () => {
  const props = {
    onRetry: jest.fn(),
    onBack: jest.fn(),
    onAdd: jest.fn(),
    onSelect: jest.fn(),
    onOpenActions: jest.fn(),
  };

  it('renders the list and the add CTA', () => {
    render(<SavedAddressesView state={ready(DEMO_ADDRESS_LIST)} {...props} />);

    expect(screen.getByText('Saved addresses')).toBeTruthy();
    expect(screen.getByTestId('address-row-addr-1')).toBeTruthy();
    fireEvent.press(screen.getByTestId('address-add'));
    expect(props.onAdd).toHaveBeenCalled();
  });

  it('gives every row the NEW kebab that raises the edit sheet (68:214)', () => {
    render(<SavedAddressesView state={ready(DEMO_ADDRESS_LIST)} {...props} />);

    fireEvent.press(screen.getByTestId('address-row-menu-addr-1'));
    expect(props.onOpenActions).toHaveBeenCalledWith('addr-1');
  });

  it('renders an empty state — the state every new user hits first', () => {
    render(<SavedAddressesView state={ready(DEMO_ADDRESS_LIST_EMPTY)} {...props} />);

    expect(screen.getByTestId('address-empty')).toBeTruthy();
    expect(screen.queryByTestId('address-list')).toBeNull();
  });
});

describe('Select service location (53:31)', () => {
  const props = { onRetry: jest.fn(), onBack: jest.fn(), onConfirm: jest.fn() };

  it('renders the pin helper and the resolved address', () => {
    render(<AddressLocationView state={ready(DEMO_ADDRESS_LOCATION)} {...props} />);

    expect(screen.getByTestId('address-map')).toBeTruthy();
    expect(screen.getByText('Move pin to help the cook reach accurately')).toBeTruthy();
    expect(screen.getByText('Area 124, subarea 2 xyz, city efg')).toBeTruthy();
  });

  it('confirms a serviceable location', () => {
    render(<AddressLocationView state={ready(DEMO_ADDRESS_LOCATION)} {...props} />);

    expect(screen.getByTestId('address-confirm').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByTestId('address-confirm'));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it('surfaces an out-of-area result here, with no separate rejection flow (R-4)', () => {
    render(<AddressLocationView state={ready(DEMO_ADDRESS_LOCATION_UNSERVICEABLE)} {...props} />);

    expect(screen.getByTestId('address-serviceability')).toBeTruthy();
    expect(screen.getByTestId('address-confirm').props.accessibilityState.disabled).toBe(true);
  });
});

describe('Add address details (60:655)', () => {
  const props = {
    onRetry: jest.fn(),
    onBack: jest.fn(),
    onChangeArea: jest.fn(),
    onSave: jest.fn(),
  };

  it('renders the confirmed field schema including receiver details', () => {
    render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

    expect(screen.getByTestId('address-flat')).toBeTruthy();
    expect(screen.getByTestId('address-building')).toBeTruthy();
    expect(screen.getByTestId('address-receiver-name')).toBeTruthy();
    expect(screen.getByTestId('address-receiver-phone')).toBeTruthy();
  });

  it('offers the four label chips the design specifies', () => {
    render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

    expect(screen.getByTestId('address-label-home')).toBeTruthy();
    expect(screen.getByTestId('address-label-parents')).toBeTruthy();
    expect(screen.getByTestId('address-label-friends')).toBeTruthy();
    expect(screen.getByTestId('address-label-others')).toBeTruthy();
  });

  it('returns to the map from Change', () => {
    render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

    fireEvent.press(screen.getByTestId('address-change-area'));
    expect(props.onChangeArea).toHaveBeenCalled();
  });

  describe("receiver's details are stored with the address (B-13)", () => {
    it('starts empty when adding a new address', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      expect(screen.getByTestId('address-receiver-name').props.value).toBe('');
      expect(screen.getByTestId('address-receiver-phone').props.value).toBe('');
    });

    it('PREFILLS from the saved record when editing', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} />);

      expect(screen.getByTestId('address-flat').props.value).toBe('B-402');
      expect(screen.getByTestId('address-receiver-name').props.value).toBe('Anita Sharma');
      expect(screen.getByTestId('address-receiver-phone').props.value).toBe('98765 43210');
      expect(screen.getByTestId('address-label-parents').props.accessibilityState.selected).toBe(
        true,
      );
    });

    it('stays editable and hands the edited receiver back on save', () => {
      const onSave = jest.fn();
      render(
        <AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} onSave={onSave} />,
      );

      fireEvent.changeText(screen.getByTestId('address-receiver-name'), 'Ravi Kumar');
      fireEvent.changeText(screen.getByTestId('address-receiver-phone'), '90000 11111');
      fireEvent.press(screen.getByTestId('address-label-friends'));
      fireEvent.press(screen.getByTestId('address-save'));

      expect(onSave).toHaveBeenCalledWith({
        flat: 'B-402',
        building: 'Green Meadows',
        labelId: 'friends',
        saveAs: '',
        receiverName: 'Ravi Kumar',
        receiverPhone: '90000 11111',
      });
    });

    it('carries the NEW "Save as" field and the (Optional) receiver qualifier (60:655)', () => {
      const onSave = jest.fn();
      render(
        <AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} onSave={onSave} />,
      );

      expect(screen.getByText('(Optional)')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('address-save-as'), "Simran's pg");
      fireEvent.press(screen.getByTestId('address-save'));

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ saveAs: "Simran's pg" }));
    });
  });
});
