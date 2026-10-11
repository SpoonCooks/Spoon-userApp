import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  NOT_SERVICEABLE_REDIRECT_MS,
  NotServiceableScreen,
  joinAreas,
} from './NotServiceableScreen';
import type { NotServiceablePlace } from './notServiceableStore';

const PLACE: NotServiceablePlace = {
  title: '100 Feet Road',
  line: 'Indiranagar, Bengaluru',
  locality: 'Indiranagar',
  liveAreas: ['HSR Layout', 'Haralur'],
  neighbours: 128,
};

function renderScreen(place: NotServiceablePlace = PLACE) {
  const props = { onBack: jest.fn(), onGoHome: jest.fn(), onTimeout: jest.fn() };
  render(<NotServiceableScreen place={place} {...props} />);
  return props;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('Not serviceable (2214:4260)', () => {
  it('names the locality, the live areas, the pinned place and the waiting neighbours', () => {
    renderScreen();

    expect(screen.getByText('LOCATION NOT SERVICEABLE')).toBeTruthy();
    expect(screen.getByText('We’re not in Indiranagar yet')).toBeTruthy();
    expect(
      screen.getByText(
        'Spoon is live in HSR Layout & Haralur right now. Your location is saved and counts towards where we launch next.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('HSR Layout · Live')).toBeTruthy();
    expect(screen.getByText('Haralur · Live')).toBeTruthy();
    expect(screen.getByText('You · Indiranagar')).toBeTruthy();
    expect(screen.getByText('100 Feet Road')).toBeTruthy();
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('You + 128 neighbours want Spoon in Indiranagar')).toBeTruthy();
  });

  it('reads sensibly with no locality, no live areas and no neighbours', () => {
    renderScreen({ ...PLACE, locality: null, liveAreas: [], neighbours: 0 });

    expect(screen.getByText('We’re not in your area yet')).toBeTruthy();
    expect(screen.getByText('You’re the first to ask for Spoon in your area')).toBeTruthy();
  });

  /** Dev note 2214:4364: "Auto-redirect … after 3s". */
  it('redirects after 3s, counting down', () => {
    const props = renderScreen();
    expect(screen.getByText('Taking you to Spoon home in 3s…')).toBeTruthy();

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('Taking you to Spoon home in 2s…')).toBeTruthy();
    expect(props.onTimeout).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(NOT_SERVICEABLE_REDIRECT_MS - 1000));
    expect(props.onTimeout).toHaveBeenCalledTimes(1);
  });

  it('goes home now, and back to the map from back or "Try a different location"', () => {
    const props = renderScreen();

    fireEvent.press(screen.getByTestId('not-serviceable-home'));
    fireEvent.press(screen.getByTestId('not-serviceable-retry'));
    fireEvent.press(screen.getByTestId('not-serviceable-back'));

    expect(props.onGoHome).toHaveBeenCalledTimes(1);
    expect(props.onBack).toHaveBeenCalledTimes(2);
  });
});

describe('joinAreas', () => {
  it('joins as the frame does', () => {
    expect(joinAreas(['HSR Layout'])).toBe('HSR Layout');
    expect(joinAreas(['HSR Layout', 'Haralur'])).toBe('HSR Layout & Haralur');
    expect(joinAreas(['A', 'B', 'C'])).toBe('A, B & C');
  });
});
