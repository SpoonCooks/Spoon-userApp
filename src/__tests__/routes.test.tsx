import { fireEvent, screen } from '@testing-library/react-native';

import {
  DEFAULT_API_STUBS as ROUTE_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';

/**
 * Route smoke tests — every implemented route mounts and renders its screen.
 *
 * expo-router's navigation hooks are mocked so each route can be rendered in isolation; the
 * routes themselves are thin wrappers that wire data hooks to a feature screen.
 *
 * Rendering goes through `renderWithRuntime`, which supplies the query client and the
 * composition root every route now reaches. Its stub API rejects unhandled calls, so these stay
 * MOUNT tests: they prove a route renders its designed screen, and no route is allowed to reach
 * a real endpoint to do it.
 *
 * NOTE: this file lives outside `src/app/` on purpose — expo-router's `require.context` would
 * otherwise pull it, and its test-only imports, into the production bundle.
 */

import AddressDetailsRoute from '@/app/(app)/address/details';
import SavedAddressesRoute from '@/app/(app)/address/index';
import AddressLocationRoute from '@/app/(app)/address/location';
import BookingRoute from '@/app/(app)/booking/[id]';
import HistoryRoute from '@/app/(app)/history';
import HomeRoute from '@/app/(app)/home';
import MealBriefRoute from '@/app/(app)/meal-brief';
import ProfileRoute from '@/app/(app)/profile';
import ProfileDetailsRoute from '@/app/(app)/profile/details';
import RefundsRoute from '@/app/(app)/refunds';
import RescheduleRoute from '@/app/(app)/reschedule/[id]';
import ScheduledRoute from '@/app/(app)/scheduled';
import LoginRoute from '@/app/(auth)/login';
import OtpRoute from '@/app/(auth)/otp';
import NotFoundRoute from '@/app/+not-found';

/**
 * Mutable so a test can drive a route's params. Reset in `beforeEach` so one test's params
 * cannot leak into the next.
 */
let mockSearchParams: Record<string, string> = { id: 'enRoute' };

/**
 * The router every route now reaches.
 *
 * `canGoBack` and `canDismiss` are part of it because back is no longer a bare `router.back()`:
 * `useSafeBack` asks whether there is a history before popping, and falls back to a deterministic
 * route when there is not. A mock without them would throw on the first back control.
 */
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    dismissTo: jest.fn(),
    dismissAll: jest.fn(),
    canGoBack: jest.fn(() => true),
    canDismiss: jest.fn(() => true),
  }),
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (effect: () => void | (() => void)) => {
    // The real hook runs the effect while the screen is focused. Every route in these tests is
    // rendered in isolation and therefore focused, so running it once is the faithful behaviour —
    // and it is what exercises the `BackHandler` subscriptions the routes now register.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
  Redirect: () => null,
  Stack: () => null,
}));

/**
 * The reads the wired routes perform on mount.
 *
 * Supplying them keeps these as READY-state tests: a route that renders its designed screen only
 * once data arrives is proved to reach that state, not merely to survive an error. Anything a
 * route asks for that is NOT listed here still fails loudly through the stub.
 */
function render(ui: Parameters<typeof renderWithRuntime>[0]) {
  return renderWithRuntime(ui, {
    runtime: createTestRuntime({ api: createStubApi(ROUTE_STUBS) }),
  });
}

describe('routes render', () => {
  beforeEach(() => {
    mockSearchParams = { id: 'enRoute' };
  });

  it.each([
    ['home', HomeRoute, 'home-screen'],
    ['scheduled', ScheduledRoute, 'schedule-screen'],
    ['reschedule/[id]', RescheduleRoute, 'schedule-screen'],
    ['meal-brief', MealBriefRoute, 'meal-brief-screen'],
    ['booking/[id]', BookingRoute, 'booking-detail-screen'],
    ['profile', ProfileRoute, 'profile-screen'],
    // `338:4508`, V8. Mounted in the EDIT context; the first-run context is covered end to end in
    // `features/profile/profileOnboarding.test.tsx`.
    ['profile/details', ProfileDetailsRoute, 'profile-details-screen'],
    ['history', HistoryRoute, 'history-screen'],
    ['refunds', RefundsRoute, 'refunds-screen'],
    ['address', SavedAddressesRoute, 'saved-addresses-screen'],
    ['address/location', AddressLocationRoute, 'address-location-screen'],
    ['address/details', AddressDetailsRoute, 'address-details-screen'],
  ])('%s', async (_name, Route, testID) => {
    render(<Route />);
    // `find*` rather than `get*`: the wired routes resolve their reads asynchronously, so the
    // designed screen appears on the next tick rather than in the first synchronous render.
    expect(await screen.findByTestId(testID)).toBeTruthy();
  });

  it('renders the NEW Login (53:174) — hero, tagline, pill field and legal footer', () => {
    render(<LoginRoute />);

    expect(screen.getByTestId('login-screen')).toBeTruthy();
    expect(screen.getByTestId('login-screen-phone')).toBeTruthy();
    expect(screen.getByTestId('login-screen-cta')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText('Enter your phone number to proceed')).toBeTruthy();
    // The new frame DOES carry a legal footer; ruling R-6 predated it.
    expect(screen.getByText('Terms of use')).toBeTruthy();
    expect(screen.getByText('Privacy policy')).toBeTruthy();
    // `53:235`'s prototype toggle is still absent (B-20).
    expect(screen.queryByText('User Type:')).toBeNull();
    expect(screen.queryByText('Returning User')).toBeNull();
  });

  it('does not embed the development menu inside Login', () => {
    // Regression guard. The menu is content-sized; as a sibling of the `flex: 1` login screen it
    // collapsed the frame to a few pixels, so `spoon://login` rendered the menu, not the design.
    // It now lives at `spoon://menu`; only a zero-footprint dev tap target remains here.
    render(<LoginRoute />);

    expect(screen.queryByTestId('dev-route-menu')).toBeNull();
    expect(screen.getByTestId('login-dev-menu-handle')).toBeTruthy();
  });

  it('keeps the Login CTA inert until the full number is entered', () => {
    render(<LoginRoute />);

    const cta = screen.getByTestId('login-screen-cta');
    expect(cta.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId('login-screen-phone'), '9876543210');
    expect(screen.getByTestId('login-screen-cta').props.accessibilityState.disabled).toBe(false);
  });

  it('renders the NEW OTP screen (275:4289) — B-7 is obsolete', () => {
    render(<OtpRoute />);

    expect(screen.getByTestId('otp-screen')).toBeTruthy();
    expect(screen.getByText('OTP verification')).toBeTruthy();
    // `275:4321` draws SIX boxes, and the count is read from the payload, never assumed.
    expect(screen.getAllByTestId(/^otp-screen-digit-\d+$/)).toHaveLength(6);
    // Nothing is design-pending here any more.
    expect(screen.queryByText('DESIGN PENDING')).toBeNull();
  });

  it('has no submit CTA — the finalized frames draw none (275:4289 / 250:2439 / 275:4349)', () => {
    render(<OtpRoute />);

    expect(screen.queryByTestId('otp-screen-cta')).toBeNull();
    expect(screen.queryByText('Verify & Proceed')).toBeNull();
  });

  it('shows the resend link when no server cooldown was carried in (250:2439)', () => {
    // `useLocalSearchParams` is mocked without `retryAfter`, which is the "cooldown already
    // elapsed" case. The offered state is the single-run label the frame draws.
    render(<OtpRoute />);

    expect(screen.getByText('Resend OTP via SMS')).toBeTruthy();
  });

  it("counts down from the SERVER's cooldown, not a client constant (275:4289)", () => {
    mockSearchParams = { phone: '+919876543210', retryAfter: '26' };
    render(<OtpRoute />);

    // 26 is `otp/send`'s `retryAfterSeconds`. The frame's own sample copy said 26s too, but the
    // point is that this value arrived from the server rather than being authored here.
    expect(screen.getByText(/Resend OTP in/)).toBeTruthy();
    expect(screen.getByText('26s')).toBeTruthy();
    expect(screen.getByText('OTP has been sent to +91 9876543210')).toBeTruthy();
  });

  /**
   * Task §20 — an unknown `spoon://` link must never dead-end. It used to render a development
   * scaffold ("FOUNDATION PLACEHOLDER · Not found") with no control on it; it now redirects to a
   * safe root chosen off the session machine, which the mocked `Redirect` renders as nothing.
   */
  it('redirects an unknown deep link instead of rendering a dead scaffold', () => {
    render(<NotFoundRoute />);

    expect(screen.queryByTestId('route-scaffold-Not found')).toBeNull();
    expect(screen.queryByText('FOUNDATION PLACEHOLDER')).toBeNull();
  });
});
