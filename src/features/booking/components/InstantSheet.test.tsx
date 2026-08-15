import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  DEMO_INSTANT_AVAILABLE,
  DEMO_INSTANT_NO_SLOTS,
  DEMO_INSTANT_OUT_OF_SHIFT,
} from '@/demo/fixtures/booking';
import { InstantSheet } from './InstantSheet';

const actions = {
  onSelectDuration: jest.fn(),
  onClose: jest.fn(),
  onBook: jest.fn(),
  onSchedule: jest.fn(),
};

describe('Instant sheet — available (1:728)', () => {
  it('renders the server ETA and every duration option with its prices', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={null}
        {...actions}
      />,
    );

    expect(screen.getByTestId('instant-sheet-eta')).toBeTruthy();
    expect(screen.getByText('18 mins')).toBeTruthy();
    expect(screen.getByText('₹189')).toBeTruthy();
    expect(screen.getByText('₹450')).toBeTruthy();
    expect(screen.getByText('Popular')).toBeTruthy();
  });

  it('renders the CTA label exactly as the server supplied it — no amount is computed', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={null}
        {...actions}
      />,
    );

    expect(screen.getByText('Book Now • ₹198')).toBeTruthy();
  });

  it('selects a duration and books through the callbacks', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId="dur-90"
        {...actions}
      />,
    );

    fireEvent.press(screen.getByTestId('instant-sheet-duration-dur-60'));
    expect(actions.onSelectDuration).toHaveBeenCalledWith('dur-60');

    fireEvent.press(screen.getByTestId('instant-sheet-book'));
    expect(actions.onBook).toHaveBeenCalledTimes(1);
  });

  it('honours a server-disabled option', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={null}
        {...actions}
      />,
    );

    const soldOut = screen.getByTestId('instant-sheet-duration-dur-150');
    expect(soldOut.props.accessibilityState.disabled).toBe(true);
  });
});

describe('Instant sheet — taxes dialog above the sheet (25:1585)', () => {
  it('opens the dialog over the sheet and closes it again', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={null}
        {...actions}
      />,
    );

    expect(screen.queryByText('What is Taxes?')).toBeNull();

    fireEvent.press(screen.getByTestId('instant-sheet-payment-details'));

    expect(screen.getByText('What is Taxes?')).toBeTruthy();
    expect(screen.getByTestId('instant-sheet-dialog-layer')).toBeTruthy();
    // The sheet stays mounted behind it, hidden from assistive tech.
    expect(screen.getByText('Book Now • ₹198', { includeHiddenElements: true })).toBeTruthy();

    fireEvent.press(screen.getByTestId('info-dialog-close'));
    expect(screen.queryByText('What is Taxes?')).toBeNull();
  });
});

describe('Instant sheet — blocked states (25:1327 / 44:5378)', () => {
  it('shows the out-of-shift message and the Schedule fallback', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_OUT_OF_SHIFT}
        selectedDurationId={null}
        {...actions}
      />,
    );

    expect(screen.getByTestId('instant-sheet-unavailable')).toBeTruthy();
    expect(screen.getByText('Slots open at 6 AM today')).toBeTruthy();
    expect(screen.queryByTestId('instant-sheet-book')).toBeNull();

    fireEvent.press(screen.getByTestId('instant-sheet-schedule'));
    expect(actions.onSchedule).toHaveBeenCalledTimes(1);
  });

  it('shows the sold-out message', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_NO_SLOTS}
        selectedDurationId={null}
        {...actions}
      />,
    );

    expect(screen.getByText('Sorry, all sold out!')).toBeTruthy();
  });

  it('makes the duration grid inert and hides it from assistive tech while blocked', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_NO_SLOTS}
        selectedDurationId={null}
        {...actions}
      />,
    );

    // The whole content block — lead line and grid — is hidden behind the `44:5632` scrim.
    const content = screen.getByTestId('instant-sheet-content', { includeHiddenElements: true });
    expect(content.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(screen.getByTestId('instant-sheet-grid', { includeHiddenElements: true })).toBeTruthy();

    const tile = screen.getByTestId('instant-sheet-duration-dur-60', {
      includeHiddenElements: true,
    });
    fireEvent.press(tile);
    expect(actions.onSelectDuration).not.toHaveBeenCalled();
  });

  it('does not offer the taxes dialog while blocked', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_OUT_OF_SHIFT}
        selectedDurationId={null}
        {...actions}
      />,
    );

    expect(screen.queryByTestId('instant-sheet-payment-details')).toBeNull();
  });
});
