import { Keyboard } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

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

/**
 * The camera call the screen makes through the map's ref. Exposed by the `react-native-maps` mock
 * in `jest.setup.ts`; `clearMocks` empties it between tests.
 */
const { __animateToRegion: animateToRegion } = jest.requireMock('react-native-maps') as {
  __animateToRegion: jest.Mock;
};

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

  const mapProps = {
    onSettle: jest.fn(),
    query: '',
    suggestions: [],
    searchState: 'idle' as const,
    onSearch: jest.fn(),
    onChooseSuggestion: jest.fn(),
    onDismissSuggestions: jest.fn(),
  };

  const POINT = { latitude: 12.97, longitude: 77.64 } as const;

  /** A region as the SDK reports one: a centre plus the span around it. */
  const regionAt = (latitude: number, longitude: number) => ({
    latitude,
    longitude,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  });

  /** The map coming to rest, as `react-native-maps` raises it. */
  const settle = (
    latitude: number,
    longitude: number,
    details: { isGesture?: boolean } = { isGesture: true },
  ) =>
    fireEvent(
      screen.getByTestId('address-map-canvas'),
      'regionChangeComplete',
      regionAt(latitude, longitude),
      details,
    );

  it('renders the pin helper and the resolved address', () => {
    render(<AddressLocationView state={ready(DEMO_ADDRESS_LOCATION)} {...props} />);

    expect(screen.getByText('Move pin to help the cook reach accurately')).toBeTruthy();
    expect(screen.getByText('Area 124, subarea 2 xyz, city efg')).toBeTruthy();
  });

  /**
   * `53:63` — the field has to state the place the pin is on.
   *
   * It was seed-once local state remounted by a `key`, and on the live map that key is a constant,
   * so it never remounted. Choosing "Laxmi Nagar" therefore moved the pin and rewrote the hook's
   * `query` while the box went on showing the abandoned "Laxmi naga" the customer had typed — the
   * field disagreeing with the pin directly beneath it.
   */
  it('shows the chosen place in full once the query is rewritten', () => {
    const { rerender } = render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: POINT, query: 'Laxmi naga' }}
      />,
    );

    expect(screen.getByTestId('address-search').props.value).toBe('Laxmi naga');

    // What `chooseSuggestion` does: the whole place, primary AND locality.
    rerender(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: POINT, query: 'Laxmi Nagar, Delhi' }}
      />,
    );

    expect(screen.getByTestId('address-search').props.value).toBe('Laxmi Nagar, Delhi');
  });

  /** Typing still wins: an echo of the customer's own keystrokes must not fight them. */
  it('keeps what is being typed rather than snapping back to the last value', () => {
    const onSearch = jest.fn();
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: POINT, query: '', onSearch }}
      />,
    );

    fireEvent.changeText(screen.getByTestId('address-search'), 'Indira');

    expect(onSearch).toHaveBeenCalledWith('Indira');
    expect(screen.getByTestId('address-search').props.value).toBe('Indira');
  });

  /**
   * Clearing a long address should not be twenty taps on backspace.
   *
   * FIGMA_PENDING: `53:64` draws the field with a leading search glyph and nothing trailing, so
   * the control appears only when there is something to clear and an empty field stays as drawn.
   */
  describe('the search field can be cleared in one tap', () => {
    it('shows no clear control while the field is empty', () => {
      render(
        <AddressLocationView
          state={ready(DEMO_ADDRESS_LOCATION)}
          {...props}
          map={{ ...mapProps, coordinates: POINT, query: '' }}
        />,
      );

      expect(screen.queryByTestId('address-search-clear')).toBeNull();
    });

    it('empties the field and tells the parent, so the predictions go with it', () => {
      const onSearch = jest.fn();
      render(
        <AddressLocationView
          state={ready(DEMO_ADDRESS_LOCATION)}
          {...props}
          map={{ ...mapProps, coordinates: POINT, query: 'Indiranagar 100ft Road', onSearch }}
        />,
      );

      fireEvent.press(screen.getByTestId('address-search-clear'));

      expect(screen.getByTestId('address-search').props.value).toBe('');
      // Not just the input: an empty field over the last query's results is the worse state.
      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('appears as soon as something is typed, and goes once it is gone', () => {
      render(
        <AddressLocationView
          state={ready(DEMO_ADDRESS_LOCATION)}
          {...props}
          map={{ ...mapProps, coordinates: POINT, query: '' }}
        />,
      );

      fireEvent.changeText(screen.getByTestId('address-search'), 'Indira');
      expect(screen.getByTestId('address-search-clear')).toBeTruthy();

      fireEvent.press(screen.getByTestId('address-search-clear'));
      expect(screen.queryByTestId('address-search-clear')).toBeNull();
    });
  });

  it('draws NO map until a point exists — a map has to be centred on something real', () => {
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: null }}
      />,
    );

    expect(screen.getByTestId('address-map-empty')).toBeTruthy();
    expect(screen.queryByTestId('address-map-canvas')).toBeNull();
  });

  it('draws the map and its pin once a point exists', () => {
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: POINT }}
      />,
    );

    expect(screen.getByTestId('address-map-canvas')).toBeTruthy();
    expect(screen.getByTestId('address-map-pin')).toBeTruthy();
    expect(screen.queryByTestId('address-map-empty')).toBeNull();
  });

  /* ------------------------------------------------- the pin is fixed, the map moves */

  it('keeps the pin OUT of the map — it is an overlay, never a marker the SDK can own', () => {
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: POINT }}
      />,
    );

    const canvas = screen.getByTestId('address-map-canvas');
    const pin = screen.getByTestId('address-map-pin');

    // Nothing is rendered inside the map surface at all: a `Marker` would be a child of it.
    expect(canvas.props.children).toBeFalsy();
    // And the pin is not underneath it in the tree either.
    expect(within(canvas).queryByTestId('address-map-pin')).toBeNull();
    // The overlay covers the whole canvas, so it MUST be transparent to touches or every pan
    // that began in the middle of the map — where the customer aims — would be swallowed.
    expect(pin.props.pointerEvents).toBe('none');
  });

  it('has no map onPress at all — a tap must never teleport the pin', () => {
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: POINT }}
      />,
    );

    expect(screen.getByTestId('address-map-canvas').props.onPress).toBeUndefined();
  });

  it('leaves pan and zoom on, and rotation and tilt off so the centre stays the pin', () => {
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: POINT }}
      />,
    );

    const canvas = screen.getByTestId('address-map-canvas');
    expect(canvas.props.scrollEnabled).toBe(true);
    expect(canvas.props.zoomEnabled).toBe(true);
    expect(canvas.props.rotateEnabled).toBe(false);
    expect(canvas.props.pitchEnabled).toBe(false);
  });

  it('takes the coordinate from where the map SETTLED, not from any gesture frame', () => {
    const onSettle = jest.fn();
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: POINT }}
      />,
    );

    fireEvent(
      screen.getByTestId('address-map-canvas'),
      'regionChangeStart',
      regionAt(12.965, 77.641),
      {
        isGesture: true,
      },
    );
    // Every frame of the pan. NOTHING may be selected from these.
    fireEvent(screen.getByTestId('address-map-canvas'), 'regionChange', regionAt(12.965, 77.641), {
      isGesture: true,
    });
    expect(onSettle).not.toHaveBeenCalled();

    settle(12.9611, 77.6387);

    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledWith({ latitude: 12.9611, longitude: 77.6387 });
  });

  it('ignores a settle that lands back on the point already selected', () => {
    const onSettle = jest.fn();
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: POINT }}
      />,
    );

    // The idle every map raises once it has finished loading, at the centre it was handed.
    settle(POINT.latitude, POINT.longitude);

    expect(onSettle).not.toHaveBeenCalled();
  });

  it('does not re-select a point when its OWN recentre lands on it', () => {
    const onSettle = jest.fn();
    const view = (
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: POINT }}
      />
    );
    const { rerender } = render(view);

    // A chosen Places result: the point arrives from OUTSIDE the map, so the camera flies to it.
    rerender(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: { latitude: 13.01, longitude: 77.58 } }}
      />,
    );

    // The animation ends the same way a pan does — and reports a centre a hair off the request.
    settle(13.010000001, 77.579999998, { isGesture: false });

    // Committing that would discard the address Places gave us and pay for another geocode.
    expect(onSettle).not.toHaveBeenCalled();
  });

  it('lets a gesture that interrupts a recentre win', () => {
    const onSettle = jest.fn();
    const { rerender } = render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: POINT }}
      />,
    );

    rerender(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: { latitude: 13.01, longitude: 77.58 } }}
      />,
    );

    // The customer grabbed the map while it was flying and put it somewhere else.
    settle(12.9, 77.5, { isGesture: true });

    expect(onSettle).toHaveBeenCalledWith({ latitude: 12.9, longitude: 77.5 });
  });

  /**
   * The camera moves for a point that came from SOMEWHERE ELSE — the device fix, a chosen Places
   * result, a recentre — and stays put for a point the map itself just produced. Animating back to
   * where the customer already is, is the map fighting the gesture.
   */
  it('flies to a point from off the map, and not to one the map just settled on', () => {
    const onSettle = jest.fn();
    const { rerender } = render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: POINT }}
      />,
    );

    // Mounting frames the first point through `initialRegion`; nothing is animated.
    expect(animateToRegion).not.toHaveBeenCalled();

    // The customer pans. The point comes back down as a prop — and must NOT be flown to.
    settle(12.9611, 77.6387);
    rerender(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: { latitude: 12.9611, longitude: 77.6387 } }}
      />,
    );
    expect(animateToRegion).not.toHaveBeenCalled();

    // A chosen Places result. This one the map has never seen, so the camera travels to it.
    rerender(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onSettle, coordinates: { latitude: 13.01, longitude: 77.58 } }}
      />,
    );
    expect(animateToRegion).toHaveBeenCalledTimes(1);
    expect(animateToRegion.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ latitude: 13.01, longitude: 77.58 }),
    );
  });

  it('closes the prediction list when a gesture takes hold of the map', () => {
    const onDismissSuggestions = jest.fn();
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, onDismissSuggestions, coordinates: POINT }}
      />,
    );

    fireEvent(
      screen.getByTestId('address-map-canvas'),
      'regionChangeStart',
      regionAt(12.97, 77.64),
      {
        isGesture: true,
      },
    );
    expect(onDismissSuggestions).toHaveBeenCalledTimes(1);

    // Our own recentre starting is not the customer touching anything.
    fireEvent(
      screen.getByTestId('address-map-canvas'),
      'regionChangeStart',
      regionAt(12.97, 77.64),
      {
        isGesture: false,
      },
    );
    expect(onDismissSuggestions).toHaveBeenCalledTimes(1);
  });

  it('hands a chosen Places suggestion back by id', () => {
    const onChooseSuggestion = jest.fn();
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{
          ...mapProps,
          onChooseSuggestion,
          coordinates: null,
          searchState: 'results',
          suggestions: [{ placeId: 'place-1', primary: 'Indiranagar', secondary: 'Bengaluru' }],
        }}
      />,
    );

    fireEvent.press(screen.getByTestId('address-suggestion-place-1'));

    expect(onChooseSuggestion).toHaveBeenCalledWith('place-1');
  });

  it('says WHY there are no suggestions, rather than showing an empty list', () => {
    const { rerender } = render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: null, searchState: 'empty' }}
      />,
    );
    expect(screen.getByText(/No matching places/)).toBeTruthy();

    rerender(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: null, searchState: 'error' }}
      />,
    );
    expect(screen.getByText(/Couldn’t reach search/)).toBeTruthy();

    rerender(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: null, searchState: 'unconfigured' }}
      />,
    );
    expect(screen.getByText(/Search is unavailable in this build/)).toBeTruthy();
  });

  it('confirms a serviceable location', () => {
    render(<AddressLocationView state={ready(DEMO_ADDRESS_LOCATION)} {...props} />);

    expect(screen.getByTestId('address-confirm').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByTestId('address-confirm'));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  /**
   * The VIEW shows the server's refusal inline and LEAVES CONFIRM LIVE (task §8).
   *
   * The refusal describes the point that was last confirmed. Disabling the CTA on the strength of
   * it — which is what this screen used to do — stranded the customer the first time they pinned
   * somewhere Spoon does not reach: the message stayed, the button stayed dead, and the only exit
   * was to leave the flow. Moving the pin clears the message, so the two can never contradict.
   *
   * Which SCREEN an `outside_service_area` verdict leads to is the route's decision (`215:1472`),
   * not this component's.
   */
  it('surfaces the server refusal inline and keeps Confirm usable for the next point', () => {
    render(<AddressLocationView state={ready(DEMO_ADDRESS_LOCATION_UNSERVICEABLE)} {...props} />);

    expect(screen.getByTestId('address-serviceability')).toBeTruthy();
    expect(screen.getByTestId('address-confirm').props.accessibilityState.disabled).toBe(false);
  });

  /** §7 — the CTA is closed by the ABSENCE OF A POINT, which is the only thing it needs. */
  it('closes Confirm while there is no coordinate to confirm', () => {
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        canConfirm={false}
        map={{ ...mapProps, coordinates: null }}
      />,
    );

    expect(screen.getByTestId('address-confirm').props.accessibilityState.disabled).toBe(true);
  });

  /**
   * §7 — the pending state is the BUTTON's. The map, the pin and the resolved row are what is
   * being confirmed, so blanking them for the round trip would throw away the thing in question.
   */
  it('shows the serviceability check on the CTA alone, leaving the map in place', () => {
    render(
      <AddressLocationView
        state={ready(DEMO_ADDRESS_LOCATION)}
        {...props}
        map={{ ...mapProps, coordinates: { latitude: 12.9, longitude: 77.6 } }}
        confirming
      />,
    );

    const confirm = screen.getByTestId('address-confirm');
    expect(confirm.props.accessibilityState.busy).toBe(true);
    // Prevents the double submission §7 asks for.
    expect(confirm.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('address-map')).toBeTruthy();
  });
});

describe('Add address details (60:655)', () => {
  const props = {
    onRetry: jest.fn(),
    onBack: jest.fn(),
    onChangeArea: jest.fn(),
    onSave: jest.fn(),
    /** The map step's confirmed, server-approved point. Its absence is exercised on its own below. */
    locationReady: true,
    submitting: false,
  };

  /** Fills everything `60:655` requires, so a test can then take ONE thing away. */
  const completeTheForm = (label = 'address-label-home') => {
    fireEvent.changeText(screen.getByTestId('address-flat'), 'B-402');
    fireEvent.changeText(screen.getByTestId('address-building'), 'Green Meadows');
    fireEvent.press(screen.getByTestId(label));
  };

  const saveDisabled = () =>
    screen.getByTestId('address-save').props.accessibilityState.disabled === true;

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
        // The chip's DRAWN word, which is what `68:214` lists. Sending the id put a lowercase
        // "friends" on the saved-address list.
        labelText: 'Friends',
        saveAs: '',
        receiverName: 'Ravi Kumar',
        receiverPhone: '90000 11111',
      });
    });

    it('draws the (Optional) receiver qualifier (60:655)', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} />);

      expect(screen.getByText('(Optional)')).toBeTruthy();
    });
  });

  /**
   * V7 founder comment, task §6.
   *
   * `60:655` draws "Save as" permanently, because a Figma frame draws ONE state and the one it
   * chose has Parents selected with the field visible. The comment is the product decision: the
   * field belongs to **Others** and to nothing else. Home, Parents and Friends already name the
   * address; Others is the branch that has no name yet, so there the field appears and is
   * REQUIRED.
   */
  describe('"Save as" belongs to Others', () => {
    it('is hidden while a named chip is selected', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} />);

      // The fixture opens on Parents.
      expect(screen.getByTestId('address-label-parents').props.accessibilityState.selected).toBe(
        true,
      );
      expect(screen.queryByTestId('address-save-as')).toBeNull();

      fireEvent.press(screen.getByTestId('address-label-home'));
      expect(screen.queryByTestId('address-save-as')).toBeNull();

      fireEvent.press(screen.getByTestId('address-label-friends'));
      expect(screen.queryByTestId('address-save-as')).toBeNull();
    });

    it('appears when Others is selected, and carries the name to save', () => {
      const onSave = jest.fn();
      render(
        <AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} onSave={onSave} />,
      );

      fireEvent.press(screen.getByTestId('address-label-others'));

      fireEvent.changeText(screen.getByTestId('address-save-as'), "Simran's pg");
      fireEvent.press(screen.getByTestId('address-save'));

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ saveAs: "Simran's pg" }));
    });

    /** Saving an address labelled the literal word "others" is what the field exists to stop. */
    it('refuses to save Others with no name', () => {
      const onSave = jest.fn();
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} onSave={onSave} />);

      completeTheForm('address-label-others');
      expect(saveDisabled()).toBe(true);

      fireEvent.press(screen.getByTestId('address-save'));
      expect(onSave).not.toHaveBeenCalled();
    });

    /** A name typed under Others must not survive a switch to a chip that has its own. */
    it('discards the custom name when the customer leaves Others', () => {
      const onSave = jest.fn();
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} onSave={onSave} />);

      completeTheForm('address-label-others');
      fireEvent.changeText(screen.getByTestId('address-save-as'), 'Studio');
      fireEvent.press(screen.getByTestId('address-label-home'));
      fireEvent.press(screen.getByTestId('address-save'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ saveAs: '', labelText: 'Home' }),
      );
    });
  });

  /**
   * The founder's rule for `60:655` (task section B): Confirm is GREY and inert until every
   * required field is filled, and it may not call, navigate or create anything while it is.
   *
   * REQUIRED    Flat - Building/Plot - Label as - (Save as, but only under Others)
   * OPTIONAL    Receiver's name - Receiver's phone; `64:6` marks the block "(Optional)"
   * CONTEXT     a confirmed, server-approved point from `53:31`
   */
  describe('Confirm stays disabled until the address is complete', () => {
    it('opens disabled on an empty form', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      expect(saveDisabled()).toBe(true);
    });

    it('stays disabled with only the flat filled in', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      fireEvent.changeText(screen.getByTestId('address-flat'), 'B-402');
      expect(saveDisabled()).toBe(true);
    });

    it('stays disabled while the building/plot field is empty', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      fireEvent.changeText(screen.getByTestId('address-flat'), 'B-402');
      fireEvent.press(screen.getByTestId('address-label-home'));
      expect(saveDisabled()).toBe(true);
    });

    it('stays disabled while no label is selected', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      fireEvent.changeText(screen.getByTestId('address-flat'), 'B-402');
      fireEvent.changeText(screen.getByTestId('address-building'), 'Green Meadows');
      expect(saveDisabled()).toBe(true);
    });

    it('enables once flat, building and a named label are all present', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      completeTheForm();
      expect(saveDisabled()).toBe(false);
    });

    it('re-disables the moment a required field is cleared again', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      completeTheForm();
      fireEvent.changeText(screen.getByTestId('address-flat'), '');
      expect(saveDisabled()).toBe(true);
    });

    /** A run of spaces is not a flat number. Trimmed for validation AND for submission. */
    it.each([
      ['address-flat', 'address-building'],
      ['address-building', 'address-flat'],
    ])('refuses whitespace-only %s', (blank, filled) => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      fireEvent.changeText(screen.getByTestId(filled), 'Green Meadows');
      fireEvent.changeText(screen.getByTestId(blank), '     ');
      fireEvent.press(screen.getByTestId('address-label-home'));

      expect(saveDisabled()).toBe(true);
    });

    it('trims what it submits, so a padded field cannot be saved padded', () => {
      const onSave = jest.fn();
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} onSave={onSave} />);

      fireEvent.changeText(screen.getByTestId('address-flat'), '  B-402  ');
      fireEvent.changeText(screen.getByTestId('address-building'), ' Green Meadows ');
      fireEvent.press(screen.getByTestId('address-label-home'));
      fireEvent.press(screen.getByTestId('address-save'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ flat: 'B-402', building: 'Green Meadows' }),
      );
    });

    it('keeps the receiver details OPTIONAL - `64:6` says so on the frame', () => {
      const onSave = jest.fn();
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} onSave={onSave} />);

      completeTheForm();
      expect(saveDisabled()).toBe(false);

      fireEvent.press(screen.getByTestId('address-save'));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ receiverName: '', receiverPhone: '' }),
      );
    });

    it('holds Others disabled until Save as has a name, then enables', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      completeTheForm('address-label-others');
      expect(saveDisabled()).toBe(true);

      fireEvent.changeText(screen.getByTestId('address-save-as'), 'Simran pg');
      expect(saveDisabled()).toBe(false);

      // Clearing it takes the CTA straight back - the requirement is live, not checked once.
      fireEvent.changeText(screen.getByTestId('address-save-as'), '  ');
      expect(saveDisabled()).toBe(true);
    });

    it('drops the Save-as requirement when the customer switches back to Home', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      completeTheForm('address-label-others');
      expect(saveDisabled()).toBe(true);

      fireEvent.press(screen.getByTestId('address-label-home'));
      expect(screen.queryByTestId('address-save-as')).toBeNull();
      expect(saveDisabled()).toBe(false);
    });

    /** An edit opens on a complete record, so `275:4485` is live on arrival. */
    it('opens ENABLED on a valid prefilled edit, and disables when a field is cleared', () => {
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} />);

      expect(saveDisabled()).toBe(false);

      fireEvent.changeText(screen.getByTestId('address-building'), '');
      expect(saveDisabled()).toBe(true);
    });

    /** A form with no confirmed point behind it saves an address to nowhere. */
    it('stays disabled without a confirmed, serviceability-checked location', () => {
      const onSave = jest.fn();
      render(
        <AddressDetailsView
          state={ready(DEMO_ADDRESS_DETAILS_EDIT)}
          {...props}
          onSave={onSave}
          locationReady={false}
        />,
      );

      expect(saveDisabled()).toBe(true);
      fireEvent.press(screen.getByTestId('address-save'));
      expect(onSave).not.toHaveBeenCalled();
    });

    /** One tap, one address (task section K). */
    it('holds the CTA while the write is in flight', () => {
      const onSave = jest.fn();
      render(
        <AddressDetailsView
          state={ready(DEMO_ADDRESS_DETAILS_EDIT)}
          {...props}
          onSave={onSave}
          submitting
        />,
      );

      expect(saveDisabled()).toBe(true);
      fireEvent.press(screen.getByTestId('address-save'));
      fireEvent.press(screen.getByTestId('address-save'));
      expect(onSave).not.toHaveBeenCalled();
    });

    /** The visual state is not the only guard: the handler refuses on its own too. */
    it('fires onSave once for one press of an enabled CTA', () => {
      const onSave = jest.fn();
      render(
        <AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS_EDIT)} {...props} onSave={onSave} />,
      );

      fireEvent.press(screen.getByTestId('address-save'));
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * The keyboard (task section I).
   *
   * `KeyboardAvoidingView behavior="padding"` used to hold this form. It derives its overlap from
   * an `onLayout` frame measured against its PARENT, and this form nests it two levels down, so
   * the padding came out short by the status-bar inset - and on Android 15's edge-to-edge window,
   * where `adjustResize` no longer shrinks anything, that left `275:4485` under the IME.
   *
   * The block is now shrunk by the height the IME actually reports, and it goes back to exactly
   * zero on hide, which is the other half of the complaint: no blank strip left behind.
   */
  describe('the form yields to the keyboard and takes the space back', () => {
    /** Captures the listeners the form registers, so the test can raise the IME itself. */
    const keyboardListeners = () => {
      const handlers: Record<string, (event: unknown) => void> = {};
      jest
        .spyOn(Keyboard, 'addListener')
        .mockImplementation((event: string, handler: (payload: never) => void) => {
          handlers[event] = handler as (payload: unknown) => void;
          return { remove: jest.fn() } as never;
        });
      return handlers;
    };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('lifts the whole block clear of the IME and restores it exactly', () => {
      const handlers = keyboardListeners();
      render(<AddressDetailsView state={ready(DEMO_ADDRESS_DETAILS)} {...props} />);

      const inset = () => {
        const style = screen.getByTestId('address-form-body').props.style as unknown;
        return JSON.stringify(style);
      };

      expect(inset()).not.toContain('marginBottom');

      act(() => handlers['keyboardDidShow']?.({ endCoordinates: { height: 312 } }));
      expect(inset()).toContain('"marginBottom":312');
      // The CTA and every field are still mounted - the form did not scroll away from itself.
      expect(screen.getByTestId('address-save')).toBeTruthy();
      expect(screen.getByTestId('address-receiver-phone')).toBeTruthy();
      // The gesture-strip allowance is dropped while the keys cover the strip, so no band of
      // empty white opens between `275:4485` and the keyboard.
      expect(JSON.stringify(screen.getByTestId('address-form-footer').props.style)).toContain(
        '"paddingBottom":16',
      );

      act(() => handlers['keyboardDidHide']?.(undefined));
      expect(inset()).not.toContain('marginBottom');
    });
  });
});
