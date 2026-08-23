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
        instant={{ ...DEMO_INSTANT_AVAILABLE, ctaLabel: 'Book NOW • ₹198' }}
        selectedDurationId="dur-30"
        {...actions}
      />,
    );

    expect(screen.getByText('Book NOW • ₹198')).toBeTruthy();
  });

  /**
   * The unpriced state. `1:728` draws a selection, so the frame has an amount; the app opens with
   * none, and until a quote exists the CTA must not state one. The superseded build rendered the
   * fixture's "₹198" to every customer before they had chosen anything.
   */
  it('states no amount before a duration has been priced', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={null}
        {...actions}
      />,
    );

    // Scoped to the CTA: the duration TILES legitimately carry prices, and those are the
    // server's per-option amounts. What must not appear is a total for a selection nobody made.
    expect(screen.getByTestId('instant-sheet-book').props.accessibilityLabel).toBe('Book NOW');
    expect(screen.queryByText(/Book NOW • /)).toBeNull();
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
    expect(screen.getByText('Book NOW', { includeHiddenElements: true })).toBeTruthy();

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

    // `44:5378` — the finalized frame's own copy, and the same yellow CTA the moon state carries.
    expect(screen.getByText('Instant slots are unavailable, but schedule ones are!')).toBeTruthy();
    expect(screen.getByText('Schedule NOW')).toBeTruthy();
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

/**
 * `1:728` draws the sheet with a duration already selected, so the frame never shows the state
 * the app opens in. The CTA must not be live there — the host refuses a booking with no duration,
 * and a control that reacts to touch and does nothing is the defect this closes. `275:4488` draws
 * the same case on Scheduled as a greyed-out "Book Now".
 */
describe('Book NOW is gated on a chosen duration', () => {
  it('is disabled until a duration is selected', () => {
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={null}
        onSelectDuration={jest.fn()}
        onClose={jest.fn()}
        onBook={jest.fn()}
        onSchedule={jest.fn()}
      />,
    );

    expect(screen.getByTestId('instant-sheet-book').props.accessibilityState.disabled).toBe(true);
  });

  it('becomes live once one is', () => {
    const onBook = jest.fn();
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={DEMO_INSTANT_AVAILABLE.durations[0]?.id ?? null}
        onSelectDuration={jest.fn()}
        onClose={jest.fn()}
        onBook={onBook}
        onSchedule={jest.fn()}
      />,
    );

    const cta = screen.getByTestId('instant-sheet-book');
    expect(cta.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(cta);
    expect(onBook).toHaveBeenCalledTimes(1);
  });

  /**
   * A tapped tile is not a bookable booking (task section E). The route answers for the account's
   * address and for the server QUOTE that puts the amount on the bar; until it does, the CTA
   * stays in `275:4690`'s grey - which is also what stops "Book NOW" from ever being live while
   * it carries no price.
   */
  it('stays disabled on a chosen duration the host has no server authority for', () => {
    const onBook = jest.fn();
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={DEMO_INSTANT_AVAILABLE.durations[0]?.id ?? null}
        {...actions}
        onBook={onBook}
        canBook={false}
      />,
    );

    const cta = screen.getByTestId('instant-sheet-book');
    expect(cta.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(cta);
    expect(onBook).not.toHaveBeenCalled();
  });

  it('presses through to nothing while no duration is selected', () => {
    const onBook = jest.fn();
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={null}
        {...actions}
        onBook={onBook}
      />,
    );

    fireEvent.press(screen.getByTestId('instant-sheet-book'));
    expect(onBook).not.toHaveBeenCalled();
  });

  /** One tap, one chargeable booking (task section K). */
  it('refuses a second press while the booking call is in flight', () => {
    const onBook = jest.fn();
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_AVAILABLE}
        selectedDurationId={DEMO_INSTANT_AVAILABLE.durations[0]?.id ?? null}
        {...actions}
        onBook={onBook}
        submitting
      />,
    );

    const cta = screen.getByTestId('instant-sheet-book');
    expect(cta.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(cta);
    fireEvent.press(cta);
    expect(onBook).not.toHaveBeenCalled();
  });

  /** `44:5378` swaps the bar for "Schedule NOW", which is a navigation CTA and stays live. */
  it('leaves the Schedule fallback live while Instant itself is unavailable', () => {
    const onSchedule = jest.fn();
    render(
      <InstantSheet
        visible
        instant={DEMO_INSTANT_NO_SLOTS}
        selectedDurationId={null}
        {...actions}
        onSchedule={onSchedule}
        canBook={false}
      />,
    );

    fireEvent.press(screen.getByTestId('instant-sheet-schedule'));
    expect(onSchedule).toHaveBeenCalledTimes(1);
  });
});
