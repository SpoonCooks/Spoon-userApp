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

  it('opens with the front tile selected and the CTA live', () => {
    const a = actions();
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...a} />);
    // "1 hr" opens at the front, and the front tile is the selection.
    expect(tile(/^1 hour/).props.accessibilityState).toMatchObject({ checked: true });
    expect(a.onDurationSelected).toHaveBeenCalledWith(
      expect.objectContaining({ durationMin: 60, source: 'focus' }),
    );
    expect(screen.getByRole('button', { name: /^Book Now · / })).toBeEnabled();
    expect(screen.getByText('Check payment details')).toBeTruthy();
  });

  it('labels the CTA as Figma does: "Book Now  ·  1 hr · ₹total", "Book for later" on Later', () => {
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...actions()} />);
    // `1222:23640` — the selected SKU, then the GST-inclusive total. (The accessible name collapses
    // the label's double spaces; the drawn text keeps them.)
    expect(screen.getByRole('button', { name: 'Book Now · 1 hr · ₹75' })).toBeEnabled();
    expect(screen.getByText('Select a duration to book')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Later' }));
    // `1222:24666` — no SKU, no payment link.
    expect(screen.getByRole('button', { name: 'Book for later' })).toBeEnabled();
    expect(screen.queryByText('Check payment details')).toBeNull();
  });

  it('moves to Later when Instant turns out to be unavailable, until the customer picks a tab', () => {
    const { rerender } = render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...actions()} />);
    expect(screen.getByRole('radio', { name: 'Now' }).props.accessibilityState).toMatchObject({
      checked: true,
    });

    // Instant's read lands after Home opened, and says no.
    const unavailable = {
      ...DEMO_HOME_FIRST_TIME,
      instant: { available: false, etaMins: null },
    };
    rerender(<HomeRedesignView model={unavailable} {...actions()} />);
    expect(screen.getByRole('radio', { name: 'Later' }).props.accessibilityState).toMatchObject({
      checked: true,
    });

    // `1303:1333` — choosing Now anyway: Instant · Unavailable, same SKUs, "Book for later".
    fireEvent.press(screen.getByRole('radio', { name: 'Now' }));
    expect(screen.getByRole('radio', { name: 'Now' }).props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByText('Instant · Unavailable')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Book for later' })).toBeEnabled();
  });

  it('selects whichever tile comes to the front', () => {
    const a = actions();
    render(<HomeRedesignView model={DEMO_HOME_FIRST_TIME} {...a} />);

    fireEvent.press(screen.getByRole('button', { name: 'Show 1.5 hours' }));

    expect(tile(/^1.5 hours/).props.accessibilityState).toMatchObject({ checked: true });
    expect(tile(/^1 hour/).props.accessibilityState).toMatchObject({ checked: false });
    expect(a.onDurationSelected).toHaveBeenLastCalledWith(
      expect.objectContaining({ durationMin: 90, source: 'focus' }),
    );
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
    fireEvent.press(screen.getByRole('button', { name: /^Book Now · / }));
    expect(a.onBookNow).toHaveBeenCalledWith(
      expect.objectContaining({ duration: expect.objectContaining({ minutes: 90 }) }),
    );
  });

  it('announces an unavailable tile, refuses it and shows a toast', () => {
    const a = actions();
    render(<HomeRedesignView model={DEMO_HOME_SOME_UNAVAILABLE} {...a} />);
    const twoHours = tile(/^2 hours/);
    expect(twoHours.props.accessibilityLabel).toMatch(/unavailable$/);
    // Opening selected the front tile; only the tap on the unavailable one is under test.
    (a.onDurationSelected as jest.Mock).mockClear();
    fireEvent.press(twoHours);
    expect(a.onDurationSelected).not.toHaveBeenCalled();
    expect(screen.getByText('2 hrs isn’t available right now.')).toBeTruthy();
    act(() => jest.advanceTimersByTime(3000));
  });

  it('moves the selection to the nearest bookable tile when Later cannot book it', () => {
    render(<HomeRedesignView model={DEMO_HOME_SOME_UNAVAILABLE} {...actions()} />);
    fireEvent.press(tile(/^30 minutes/));
    fireEvent.press(screen.getByRole('radio', { name: 'Later' }));
    expect(screen.getByText('30 mins is no longer available.')).toBeTruthy();
    expect(tile(/^30 minutes/).props.accessibilityState).toMatchObject({ checked: false });
    // The front moved to the nearest bookable tile, which is now the selection.
    expect(screen.getByRole('button', { name: 'Book for later' })).toBeEnabled();
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
    expect(screen.getByRole('button', { name: /^Book Now · / })).toBeEnabled();
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
