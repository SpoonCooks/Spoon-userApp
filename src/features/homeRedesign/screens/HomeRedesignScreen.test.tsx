import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  DEMO_HOME_FIRST_TIME,
  DEMO_HOME_PRICING_ERROR,
  DEMO_HOME_PRICING_LOADING,
  DEMO_HOME_SOME_UNAVAILABLE,
} from '@/demo/fixtures/homeRedesign';
import { HomeRedesignView } from './HomeRedesignScreen';
import type { HomeRedesignActions } from './HomeRedesignScreen';

function actions(): HomeRedesignActions {
  return {
    onPressAddress: jest.fn(),
    onPressProfile: jest.fn(),
    onBookNow: jest.fn(),
    onPickSlot: jest.fn(),
    onPressRecurring: jest.fn(),
    onPressCookPool: jest.fn(),
    onPressPoolCook: jest.fn(),
    onJoinWaitlist: jest.fn().mockResolvedValue(undefined),
    onDurationSelected: jest.fn(),
    onRefreshAvailability: jest.fn(),
  };
}

const tile = (label: RegExp) => screen.getByRole('radio', { name: label });

describe('Duration carousel', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('opens with nothing selected and the CTA off', () => {
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...actions()} />);
    expect(tile(/^1 hour/).props.accessibilityState).toMatchObject({ checked: false });
    // `1255:3181` — just "Book Now", greyed, with no payment link until a duration is chosen.
    expect(screen.getByRole('button', { name: 'Book Now' })).toBeDisabled();
    expect(screen.queryByText('Check payment details')).toBeNull();
  });

  it('selects on tap, raises duration_selected and books the payable total', () => {
    const a = actions();
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...a} />);
    fireEvent.press(tile(/^1.5 hours/));
    expect(a.onDurationSelected).toHaveBeenCalledWith({
      durationMin: 90,
      pricePaise: 6900,
      source: 'tile',
    });
    fireEvent.press(screen.getByRole('button', { name: /Book now/ }));
    expect(a.onBookNow).toHaveBeenCalledWith(
      expect.objectContaining({ duration: expect.objectContaining({ minutes: 90 }) }),
    );
  });

  it('announces an unavailable tile, refuses it and shows a toast', () => {
    const a = actions();
    render(<HomeRedesignView model={DEMO_HOME_SOME_UNAVAILABLE} {...a} />);
    const twoHours = tile(/^2 hours/);
    expect(twoHours.props.accessibilityLabel).toMatch(/unavailable$/);
    fireEvent.press(twoHours);
    expect(a.onDurationSelected).not.toHaveBeenCalled();
    expect(screen.getByText('2 hrs isn’t available right now.')).toBeTruthy();
    act(() => jest.advanceTimersByTime(3000));
  });

  it('clears a selection that Later cannot book, with a toast', () => {
    render(<HomeRedesignView model={DEMO_HOME_SOME_UNAVAILABLE} {...actions()} />);
    fireEvent.press(tile(/^30 minutes/));
    fireEvent.press(screen.getByRole('radio', { name: 'Later' }));
    expect(screen.getByText('30 mins is no longer available. Pick another duration.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled();
    act(() => jest.advanceTimersByTime(3000));
  });

  it('opens the dial on Complex, as `1625:11215` draws it', () => {
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...actions()} />);
    expect(
      screen.getByRole('button', { name: 'Complex (biryani, kofta)' }).props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it('takes the recommended duration from the dial’s Select duration button', () => {
    const a = actions();
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...a} />);

    fireEvent.press(screen.getByRole('button', { name: 'Select duration' }));

    expect(a.onDurationSelected).toHaveBeenCalledWith(expect.objectContaining({ source: 'dial' }));
    expect(screen.getByRole('button', { name: /^Book now/ })).toBeEnabled();
    expect(screen.getByText('Check payment details')).toBeTruthy();
  });

  it('shows six skeleton tiles while pricing loads', () => {
    render(<HomeRedesignView model={DEMO_HOME_PRICING_LOADING} {...actions()} />);
    expect(screen.getAllByTestId('duration-skeleton')).toHaveLength(6);
    expect(screen.getByRole('button', { name: /Book now/i })).toBeDisabled();
  });

  it('offers a retry when pricing fails', () => {
    const a = actions();
    render(<HomeRedesignView model={DEMO_HOME_PRICING_ERROR} {...a} />);
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(a.onRefreshAvailability).toHaveBeenCalled();
  });
});

describe('Header', () => {
  it('shows the address label over its building and flat (`1625:11065`)', () => {
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...actions()} />);
    expect(screen.getByText('Label')).toBeTruthy();
    expect(screen.getByText('Building_name · Flat/House #')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Delivery address Label, Building_name · Flat/House #' }),
    ).toBeTruthy();
  });

  it('leaves the second line out when the address has no building or flat', () => {
    render(
      <HomeRedesignView
        model={{
          ...DEMO_HOME_FIRST_TIME,
          address: { ...DEMO_HOME_FIRST_TIME.address, detail: null },
        }}
        {...actions()}
      />,
    );
    expect(screen.queryByText('Building_name · Flat/House #')).toBeNull();
  });
});
