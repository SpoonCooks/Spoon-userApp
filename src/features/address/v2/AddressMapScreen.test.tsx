import { Keyboard } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { AddressMapScreen } from './AddressMapScreen';
import type { AddressMapScreenProps } from './AddressMapScreen';

/**
 * The camera call the screen makes through the map's ref. Exposed by the `react-native-maps` mock
 * in `jest.setup.ts`; `clearMocks` empties it between tests.
 */
const { __animateToRegion: animateToRegion } = jest.requireMock('react-native-maps') as {
  __animateToRegion: jest.Mock;
};

const POINT = { latitude: 12.97, longitude: 77.64 } as const;

function props(overrides: Partial<AddressMapScreenProps> = {}): AddressMapScreenProps {
  return {
    coordinates: POINT,
    place: { title: '100 Feet Road', line: 'Indiranagar, Bengaluru' },
    locating: false,
    resolving: false,
    message: undefined,
    canConfirm: true,
    confirming: false,
    onBack: jest.fn(),
    onSettle: jest.fn(),
    onLocate: jest.fn(),
    onConfirm: jest.fn(),
    search: {
      open: false,
      onOpen: jest.fn(),
      onClose: jest.fn(),
      query: '',
      suggestions: [],
      state: 'idle',
      onQuery: jest.fn(),
      onChoose: jest.fn(),
      onUseCurrentLocation: jest.fn(),
    },
    ...overrides,
  };
}

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

const disabled = (testID: string) =>
  screen.getByTestId(testID).props.accessibilityState.disabled as boolean;

describe('Map location (1870:2379)', () => {
  it('draws the frame: search, pin tooltip, current-location pill, hint, place and Confirm', () => {
    render(<AddressMapScreen {...props()} />);

    expect(screen.getByText('Search area, street or landmark')).toBeTruthy();
    expect(screen.getByText('Your cook will come here')).toBeTruthy();
    expect(screen.getByText('Use current location')).toBeTruthy();
    expect(screen.getByText('Place the pin at exact service location')).toBeTruthy();
    expect(screen.getByText('100 Feet Road')).toBeTruthy();
    expect(screen.getByText('Indiranagar, Bengaluru')).toBeTruthy();
    expect(screen.getByText('Confirm location')).toBeTruthy();
  });

  it('draws no back control when there is nothing behind the screen', () => {
    render(<AddressMapScreen {...props({ onBack: undefined })} />);

    expect(screen.queryByTestId('address-map-screen-back')).toBeNull();
  });

  it('draws NO map until a point exists, but keeps the pin where it will be', () => {
    render(<AddressMapScreen {...props({ coordinates: null, place: null })} />);

    expect(screen.queryByTestId('address-map-canvas')).toBeNull();
    expect(screen.getByTestId('address-map-pin')).toBeTruthy();
  });

  /** Dev note: "drag hint disappears after first drag". */
  it('drops the drag hint after the first drag', () => {
    render(<AddressMapScreen {...props()} />);
    expect(screen.getByTestId('address-hint')).toBeTruthy();

    fireEvent(screen.getByTestId('address-map-canvas'), 'regionChangeStart', regionAt(12.9, 77.6), {
      isGesture: true,
    });

    expect(screen.queryByTestId('address-hint')).toBeNull();
  });

  it('keeps a message in the hint row even after a drag', () => {
    render(<AddressMapScreen {...props({ message: 'Couldn’t check just now — try again' })} />);
    fireEvent(screen.getByTestId('address-map-canvas'), 'regionChangeStart', regionAt(12.9, 77.6), {
      isGesture: true,
    });

    expect(screen.getByTestId('address-message')).toBeTruthy();
    expect(screen.getByText('Couldn’t check just now — try again')).toBeTruthy();
  });

  /** Dev note: "Confirm disabled until address resolves" (skeleton while loading). */
  it('holds Confirm, and shows a skeleton, while the address under the pin resolves', () => {
    render(<AddressMapScreen {...props({ resolving: true, place: null })} />);

    expect(screen.getByTestId('address-place-loading')).toBeTruthy();
    expect(disabled('address-confirm')).toBe(true);
  });

  /** A geocoder with nothing to say must not strand the customer: the coordinate is what's saved. */
  it('enables Confirm once resolving ends, even when the geocoder named nothing', () => {
    render(<AddressMapScreen {...props({ place: null })} />);

    expect(screen.getByText('Selected location')).toBeTruthy();
    expect(disabled('address-confirm')).toBe(false);
  });

  it('confirms, re-centres and opens search through its callbacks', () => {
    const p = props();
    render(<AddressMapScreen {...p} />);

    fireEvent.press(screen.getByTestId('address-confirm'));
    fireEvent.press(screen.getByTestId('address-map-screen-locate'));
    fireEvent.press(screen.getByTestId('address-map-screen-search'));

    expect(p.onConfirm).toHaveBeenCalledTimes(1);
    expect(p.onLocate).toHaveBeenCalledTimes(1);
    expect(p.search.onOpen).toHaveBeenCalledTimes(1);
  });

  /** The pending state is the BUTTON's; the map and pin are what is being confirmed. */
  it('shows the serviceability check on the CTA alone, leaving the map in place', () => {
    render(<AddressMapScreen {...props({ confirming: true })} />);

    const confirm = screen.getByTestId('address-confirm');
    expect(confirm.props.accessibilityState.busy).toBe(true);
    expect(confirm.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('address-map-canvas')).toBeTruthy();
  });

  /* ------------------------------------------------- the pin is fixed, the map moves */

  it('keeps the pin OUT of the map — it is an overlay, never a marker the SDK can own', () => {
    render(<AddressMapScreen {...props()} />);

    const canvas = screen.getByTestId('address-map-canvas');
    expect(canvas.props.children).toBeFalsy();
    expect(within(canvas).queryByTestId('address-map-pin')).toBeNull();
    // Transparent to touches, or every pan that began on the pin would be swallowed.
    expect(screen.getByTestId('address-map-pin').props.pointerEvents).toBe('none');
  });

  it('has no map onPress at all — a tap must never teleport the pin', () => {
    render(<AddressMapScreen {...props()} />);

    expect(screen.getByTestId('address-map-canvas').props.onPress).toBeUndefined();
  });

  it('leaves pan and zoom on, and rotation and tilt off so the centre stays the pin', () => {
    render(<AddressMapScreen {...props()} />);

    const canvas = screen.getByTestId('address-map-canvas');
    expect(canvas.props.scrollEnabled).toBe(true);
    expect(canvas.props.zoomEnabled).toBe(true);
    expect(canvas.props.rotateEnabled).toBe(false);
    expect(canvas.props.pitchEnabled).toBe(false);
  });

  it('takes the coordinate from where the map SETTLED, not from any gesture frame', () => {
    const p = props();
    render(<AddressMapScreen {...p} />);

    fireEvent(screen.getByTestId('address-map-canvas'), 'regionChange', regionAt(12.965, 77.641), {
      isGesture: true,
    });
    expect(p.onSettle).not.toHaveBeenCalled();

    settle(12.9611, 77.6387);

    expect(p.onSettle).toHaveBeenCalledTimes(1);
    expect(p.onSettle).toHaveBeenCalledWith({ latitude: 12.9611, longitude: 77.6387 });
  });

  it('ignores a settle that lands back on the point already selected', () => {
    const p = props();
    render(<AddressMapScreen {...p} />);

    settle(POINT.latitude, POINT.longitude);

    expect(p.onSettle).not.toHaveBeenCalled();
  });

  it('does not re-select a point when its OWN recentre lands on it', () => {
    const p = props();
    const { rerender } = render(<AddressMapScreen {...p} />);

    rerender(<AddressMapScreen {...p} coordinates={{ latitude: 13.01, longitude: 77.58 }} />);
    settle(13.010000001, 77.579999998, { isGesture: false });

    expect(p.onSettle).not.toHaveBeenCalled();
  });

  it('lets a gesture that interrupts a recentre win', () => {
    const p = props();
    const { rerender } = render(<AddressMapScreen {...p} />);

    rerender(<AddressMapScreen {...p} coordinates={{ latitude: 13.01, longitude: 77.58 }} />);
    settle(12.9, 77.5, { isGesture: true });

    expect(p.onSettle).toHaveBeenCalledWith({ latitude: 12.9, longitude: 77.5 });
  });

  it('flies to a point from off the map, and not to one the map just settled on', () => {
    const p = props();
    const { rerender } = render(<AddressMapScreen {...p} />);
    expect(animateToRegion).not.toHaveBeenCalled();

    settle(12.9611, 77.6387);
    rerender(<AddressMapScreen {...p} coordinates={{ latitude: 12.9611, longitude: 77.6387 }} />);
    expect(animateToRegion).not.toHaveBeenCalled();

    rerender(<AddressMapScreen {...p} coordinates={{ latitude: 13.01, longitude: 77.58 }} />);
    expect(animateToRegion).toHaveBeenCalledTimes(1);
    expect(animateToRegion.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ latitude: 13.01, longitude: 77.58 }),
    );
  });
});

describe('Search location (1870:2436)', () => {
  const SUGGESTION = { placeId: 'place-1', primary: 'Indiranagar Metro', secondary: 'Bengaluru' };

  function open(search: Partial<AddressMapScreenProps['search']> = {}) {
    const p = props();
    const merged = { ...p, search: { ...p.search, open: true, ...search } };
    render(<AddressMapScreen {...merged} />);
    return merged.search;
  }

  it('is drawn only while open', () => {
    render(<AddressMapScreen {...props()} />);
    expect(screen.queryByTestId('address-map-screen-search-layer')).toBeNull();
  });

  it('offers the current location first, and results under a "Results for" heading', () => {
    const search = open({
      query: 'Indiranagar',
      state: 'results',
      suggestions: [SUGGESTION],
    });

    expect(screen.getByText('Use my current location')).toBeTruthy();
    expect(screen.getByText('Results for “Indiranagar”')).toBeTruthy();
    fireEvent.press(screen.getByTestId('address-map-screen-search-layer-current'));
    expect(search.onUseCurrentLocation).toHaveBeenCalledTimes(1);
  });

  it('types into the field and closes from its back chevron', () => {
    const search = open();

    fireEvent.changeText(screen.getByTestId('address-map-screen-search-layer-input'), 'Kora');
    fireEvent.press(screen.getByTestId('address-map-screen-search-layer-back'));

    expect(search.onQuery).toHaveBeenCalledWith('Kora');
    expect(search.onClose).toHaveBeenCalledTimes(1);
  });

  it('hands a chosen suggestion back by id and dismisses the keyboard', () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    const search = open({ query: 'Indira', state: 'results', suggestions: [SUGGESTION] });

    fireEvent.press(screen.getByTestId('address-suggestion-place-1'));

    expect(dismiss).toHaveBeenCalled();
    expect(search.onChoose).toHaveBeenCalledWith('place-1');
    dismiss.mockRestore();
  });

  it('says WHY there are no suggestions, rather than showing an empty list', () => {
    open({ query: 'zzz', state: 'empty' });
    expect(screen.getByText(/No matching places/)).toBeTruthy();
  });

  it('says when search cannot be reached, or is not configured', () => {
    const { rerender } = render(
      <AddressMapScreen {...props()} search={{ ...props().search, open: true, state: 'error' }} />,
    );
    expect(screen.getByText(/Couldn’t reach search/)).toBeTruthy();

    rerender(
      <AddressMapScreen
        {...props()}
        search={{ ...props().search, open: true, state: 'unconfigured' }}
      />,
    );
    expect(screen.getByText(/Search is unavailable in this build/)).toBeTruthy();
  });
});
