import { act, render, screen } from '@testing-library/react-native';

import { useSessionStore } from '@core/store';

import AppLayout from '@/app/(app)/_layout';

/**
 * The authenticated shell's session gate (task §D).
 *
 * Two regressions live here, and both were reachable on a real handset:
 *
 *  1. A session that DIES while the customer is inside the app left them on a live-looking Home
 *     whose every read 401s. `/` had already decided where the launch landed and was no longer
 *     mounted, so nothing was watching. The shell now asks the same question continuously.
 *
 *  2. A refresh IN FLIGHT must not evict anyone. `canAccessApp` covers `refreshing` precisely so
 *     the single-flight token refresh the transport performs on a 401 is invisible — a gate that
 *     redirected on `refreshing` would throw the customer to `/login` every time a token aged out
 *     and then throw them back.
 *
 * The layout is rendered directly rather than through a navigator: what is under test is the
 * decision, not expo-router's stack.
 */

jest.mock('expo-router', () => {
  // Required INSIDE the factory: jest hoists `jest.mock` above the imports, so a module-scope
  // binding would still be uninitialised when this runs.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createElement } = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');

  return {
    __esModule: true,
    // Rendered as a marker so the assertion is on WHERE the shell sends the customer, not merely
    // that it declined to render the stack.
    Redirect: ({ href }: { href: string }) =>
      createElement(Text, { testID: 'redirect' }, String(href)),
    Stack: () => createElement(Text, { testID: 'app-stack' }, 'stack'),
  };
});

// Push registration reaches `expo-notifications` and the API; neither is what this file is about.
jest.mock('@features/notifications', () => ({
  __esModule: true,
  usePushNotifications: () => undefined,
}));

describe('authenticated shell — session gate', () => {
  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it('renders the stack for an authenticated session', () => {
    useSessionStore.setState({ status: 'authenticated' });
    render(<AppLayout />);

    expect(screen.getByTestId('app-stack')).toBeTruthy();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  it('keeps the stack mounted while a token refresh is in flight', () => {
    useSessionStore.setState({ status: 'refreshing' });
    render(<AppLayout />);

    expect(screen.getByTestId('app-stack')).toBeTruthy();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  it('holds during bootstrap rather than bouncing a cold start out of a deep link', () => {
    useSessionStore.setState({ status: 'bootstrapping' });
    render(<AppLayout />);

    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  it('routes an EXPIRED session to login instead of leaving a stale authenticated screen', () => {
    useSessionStore.setState({ status: 'expired' });
    render(<AppLayout />);

    expect(screen.getByTestId('redirect').props.children).toBe('/login');
    expect(screen.queryByTestId('app-stack')).toBeNull();
  });

  it('routes a signed-out session to login', () => {
    useSessionStore.setState({ status: 'unauthenticated' });
    render(<AppLayout />);

    expect(screen.getByTestId('redirect').props.children).toBe('/login');
  });

  /**
   * The loop this cannot become.
   *
   * `/login` lives in the `(auth)` group, OUTSIDE this layout, so the redirect cannot re-enter
   * the shell that issued it. Asserting the destination is the guard: a target inside `(app)`
   * would redirect to itself forever.
   */
  it('sends the customer somewhere this layout does not own', () => {
    useSessionStore.setState({ status: 'expired' });
    render(<AppLayout />);

    expect(String(screen.getByTestId('redirect').props.children).startsWith('/login')).toBe(true);
  });

  /**
   * The recovery path, end to end through the store the shell subscribes to.
   *
   * Signing in again dispatches `SIGNED_IN`, which now moves `expired` back to `authenticated`,
   * and the shell re-renders into the stack — no restart, and no bounce back to `/login`.
   */
  it('re-enters the app once the customer signs in again', () => {
    useSessionStore.setState({ status: 'expired' });
    render(<AppLayout />);
    expect(screen.getByTestId('redirect')).toBeTruthy();

    act(() => useSessionStore.getState().dispatch({ type: 'SIGNED_IN' }));

    expect(screen.getByTestId('app-stack')).toBeTruthy();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });
});
