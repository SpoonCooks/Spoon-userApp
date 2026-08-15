import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { ready } from '@core/data';

import { DEMO_HOME_ACTIVE_BOOKING, DEMO_HOME_PRE_BOOKING } from '@/demo/fixtures/home';
import { HomeView } from './HomeScreen';

/** Collects `testID`s in render order so section ORDER can be asserted without a snapshot. */
function testIdOrder(node: unknown, found: string[] = []): string[] {
  if (node === null || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    for (const child of node) testIdOrder(child, found);
    return found;
  }
  const element = node as { props?: Record<string, unknown>; children?: unknown };
  const testID = element.props?.['testID'];
  if (typeof testID === 'string') found.push(testID);
  testIdOrder(element.children, found);
  return found;
}

const actions = {
  onPressInstant: jest.fn(),
  onPressSchedule: jest.fn(),
  onPressAddress: jest.fn(),
  onPressProfile: jest.fn(),
  onOpenActiveBooking: jest.fn(),
};

describe('Home — pre-booking variant (Page 3a, 1:455)', () => {
  it('renders every Page 3a section in frame order', () => {
    render(<HomeView state={ready(DEMO_HOME_PRE_BOOKING)} {...actions} />);

    for (const id of [
      'home-header',
      'home-promo',
      'home-tile-instant',
      'home-tile-scheduled',
      'home-marketing',
      'home-cuisines',
      'home-reasons',
      'home-duration-guide',
      'home-exclusions',
      'home-promise',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it('renders the Instant subtitle as two runs — `1:585` is one paragraph in two styles', () => {
    render(<HomeView state={ready(DEMO_HOME_PRE_BOOKING)} {...actions} />);

    // One paragraph, so the tree flattens to the joined string...
    expect(screen.getByText('Get a cook in 18 mins')).toBeTruthy();
    // ...but the emphasised run is its own node, carrying its own (larger, bolder) type style.
    const emphasis = screen.getByTestId('home-tile-instant-emphasis');
    expect(emphasis.props.children).toBe(' 18 mins');
  });

  it('shows no active-booking card', () => {
    render(<HomeView state={ready(DEMO_HOME_PRE_BOOKING)} {...actions} />);

    expect(screen.queryByTestId('home-upcoming-booking')).toBeNull();
  });
});

describe('Home — upcoming-booking variant (Page 3b, 209:1207)', () => {
  it('renders the upcoming-booking card with the server date and duration', () => {
    render(<HomeView state={ready(DEMO_HOME_ACTIVE_BOOKING)} {...actions} />);

    expect(screen.getByTestId('home-upcoming-booking')).toBeTruthy();
    expect(screen.getByText('Upcoming booking')).toBeTruthy();
    expect(screen.getByText('Tomorrow, Aug 5')).toBeTruthy();
    // "60 mins" also appears as a duration-matrix row, so scope to the card.
    expect(within(screen.getByTestId('home-upcoming-booking')).getByText('60 mins')).toBeTruthy();
  });

  it('KEEPS every Page 3a section — Page 3b is Page 3a PLUS the card, never instead of it', () => {
    render(<HomeView state={ready(DEMO_HOME_ACTIVE_BOOKING)} {...actions} />);

    // The ruling: inserting the card must not remove any normal Home content.
    for (const id of [
      'home-header',
      'home-promo',
      'home-tile-instant',
      'home-tile-scheduled',
      'home-marketing',
      'home-cuisines',
      'home-reasons',
      'home-duration-guide',
      'home-exclusions',
      'home-promise',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it('inserts the card BETWEEN the promo carousel and the booking tiles', () => {
    const tree = render(<HomeView state={ready(DEMO_HOME_ACTIVE_BOOKING)} {...actions} />);

    // `209:1226` orders the body: promo (y 22) → upcoming (y 287) → tiles (y 431.59).
    const order = testIdOrder(tree.toJSON());
    expect(order.indexOf('home-promo')).toBeLessThan(order.indexOf('home-upcoming-booking'));
    expect(order.indexOf('home-upcoming-booking')).toBeLessThan(order.indexOf('home-tiles'));
    expect(order.indexOf('home-tiles')).toBeLessThan(order.indexOf('home-cuisines'));
  });

  it('opens the active booking by pressing the card itself', () => {
    render(<HomeView state={ready(DEMO_HOME_ACTIVE_BOOKING)} {...actions} />);

    fireEvent.press(screen.getByTestId('home-upcoming-booking'));
    expect(actions.onOpenActiveBooking).toHaveBeenCalledTimes(1);
  });

  it('selects the variant from the payload alone, never from a client guess', () => {
    const { rerender } = render(<HomeView state={ready(DEMO_HOME_ACTIVE_BOOKING)} {...actions} />);
    expect(screen.getByTestId('home-upcoming-booking')).toBeTruthy();

    rerender(<HomeView state={ready(DEMO_HOME_PRE_BOOKING)} {...actions} />);
    expect(screen.queryByTestId('home-upcoming-booking')).toBeNull();
  });
});

describe('Home — navigation and states', () => {
  it('routes from both booking tiles', () => {
    render(<HomeView state={ready(DEMO_HOME_PRE_BOOKING)} {...actions} />);

    fireEvent.press(screen.getByTestId('home-tile-instant'));
    fireEvent.press(screen.getByTestId('home-tile-scheduled'));

    expect(actions.onPressInstant).toHaveBeenCalledTimes(1);
    expect(actions.onPressSchedule).toHaveBeenCalledTimes(1);
  });

  it('renders a loading surface before data arrives', () => {
    render(<HomeView state={{ status: 'loading' }} {...actions} />);

    expect(screen.queryByTestId('home-header')).toBeNull();
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('renders an error surface with retry', () => {
    const onRetry = jest.fn();
    render(
      <HomeView
        state={{ status: 'error', error: { kind: 'network', message: 'offline' } }}
        onRetry={onRetry}
        {...actions}
      />,
    );

    fireEvent.press(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
