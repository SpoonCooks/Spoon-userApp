import { fireEvent, render, screen } from '@testing-library/react-native';

/**
 * Route smoke tests — every implemented route mounts and renders its screen.
 *
 * expo-router's navigation hooks are mocked so each route can be rendered in isolation; the
 * routes themselves are thin wrappers that wire data hooks to a feature screen.
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
import RefundsRoute from '@/app/(app)/refunds';
import RescheduleRoute from '@/app/(app)/reschedule/[id]';
import ScheduledRoute from '@/app/(app)/scheduled';
import LoginRoute from '@/app/(auth)/login';
import OtpRoute from '@/app/(auth)/otp';
import NotFoundRoute from '@/app/+not-found';

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    dismissTo: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'enRoute' }),
  Redirect: () => null,
  Stack: () => null,
}));

describe('routes render', () => {
  it.each([
    ['home', HomeRoute, 'home-screen'],
    ['scheduled', ScheduledRoute, 'schedule-screen'],
    ['reschedule/[id]', RescheduleRoute, 'schedule-screen'],
    ['meal-brief', MealBriefRoute, 'meal-brief-screen'],
    ['booking/[id]', BookingRoute, 'booking-detail-screen'],
    ['profile', ProfileRoute, 'profile-screen'],
    ['history', HistoryRoute, 'history-screen'],
    ['refunds', RefundsRoute, 'refunds-screen'],
    ['address', SavedAddressesRoute, 'saved-addresses-screen'],
    ['address/location', AddressLocationRoute, 'address-location-screen'],
    ['address/details', AddressDetailsRoute, 'address-details-screen'],
  ])('%s', (_name, Route, testID) => {
    render(<Route />);
    expect(screen.getByTestId(testID)).toBeTruthy();
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

  it('renders the NEW OTP screen (227:1649) — B-7 is obsolete', () => {
    render(<OtpRoute />);

    expect(screen.getByTestId('otp-screen')).toBeTruthy();
    expect(screen.getByText('OTP verification')).toBeTruthy();
    // `227:1681` draws SIX boxes, and the count is read from the payload, never assumed.
    const boxes = screen.getByTestId('otp-screen-digits').props.children as unknown[];
    expect(boxes[0]).toHaveLength(6);
    // Nothing is design-pending here any more.
    expect(screen.queryByText('DESIGN PENDING')).toBeNull();
  });

  it('keeps the OTP CTA inert until every digit is present, and never verifies locally', () => {
    render(<OtpRoute />);

    expect(screen.getByTestId('otp-screen-cta').props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId('otp-screen-input'), '333333');
    expect(screen.getByTestId('otp-screen-cta').props.accessibilityState.disabled).toBe(false);
    // The screen renders the supplied resend copy; it runs no timer of its own.
    expect(screen.getByText('Resend OTP in 26s')).toBeTruthy();
  });

  it('renders the not-found route', () => {
    render(<NotFoundRoute />);
    expect(screen.getByTestId('route-scaffold-Not found')).toBeTruthy();
  });
});
