import { screen } from '@testing-library/react-native';

import { renderWithDefaultRuntime as render } from '@/test/renderWithRuntime';
import { useWindowDimensions } from 'react-native';

import { ready } from '@core/data';
import { DEMO_HOME_ACTIVE_BOOKING } from '@/demo/fixtures/home';
import {
  DEMO_BOOKING_ARRIVED,
  DEMO_BOOKING_AUTO_CANCELLED,
  DEMO_BOOKING_COMPLETION,
  DEMO_BOOKING_CONFIRMATION,
  DEMO_BOOKING_EN_ROUTE,
  DEMO_BOOKING_REASSIGNED,
  DEMO_SCHEDULE_BOOK,
} from '@/demo/fixtures/booking';
import {
  DEMO_ADDRESS_DETAILS,
  DEMO_ADDRESS_LIST,
  DEMO_ADDRESS_LOCATION,
  DEMO_ADDRESS_OUT_OF_SERVICE,
  DEMO_BOOKING_HISTORY,
  DEMO_LOGIN,
  DEMO_OTP,
  DEMO_PROFILE,
  DEMO_REFUND_HISTORY,
} from '@/demo/fixtures/screens';
import { DEMO_COOK_PROFILES } from '@/demo/fixtures/cooks';
import { HomeView } from '@features/home';
import { BookingDetailView } from '@features/booking';
import {
  AddressDetailsView,
  AddressLocationView,
  AddressOutOfServiceView,
  SavedAddressesView,
} from '@features/address';
import { LoginScreen, OtpScreen } from '@features/auth';
import { BookingListView } from '@features/history';
import { ProfileDetailsView, ProfileView } from '@features/profile';
import { ScheduleView } from '@features/scheduled';
import { ConfirmationLoading, SplashLoading } from '@features/loading';
import { CookCard } from '@ui';

/**
 * Responsive sweep across every V0 surface — task §23.
 *
 * ## The grid
 *
 * Five widths (320 narrow, 360, 393 reference-class, 411, 430) crossed with a SHORT and a TALL
 * viewport. The heights matter as much as the widths and were the half this sweep used to be
 * missing: the founder's Login report — "cropped from the top, and a lot of white space at the
 * bottom" (task §8) — is a HEIGHT defect, and a 640-only sweep could not have seen it.
 *
 *   568  the shortest phone still shipping. Every designed stack overruns it, so this is where a
 *        screen either yields something deliberately or pushes its CTA off the bottom.
 *   932  a current large handset. This is where a top-aligned `flexGrow` layout leaves the gap
 *        under the footer that §8 is about.
 *
 * They are driven through `useWindowDimensions`, which is the ONLY place any of these screens
 * reads the viewport: everything else is flex, intrinsic sizing, or a fixed Figma value that is
 * fixed in the frame too.
 *
 * ## What this can and cannot prove
 *
 * It proves every surface LAYS OUT at each size without throwing, and that the elements which
 * must survive a squeeze — the CTA, the footer, the resolved address row — are still mounted.
 * It cannot prove how the result LOOKS; that is the device pass, and it is not substituted for.
 */

jest.mock('react-native/Libraries/Utilities/useWindowDimensions');

const WIDTHS = [320, 360, 393, 411, 430] as const;
const HEIGHTS = [
  ['short', 568],
  ['tall', 932],
] as const;

const mockedDimensions = useWindowDimensions as unknown as jest.Mock;

function atSize(width: number, height: number) {
  mockedDimensions.mockReturnValue({ width, height, scale: 3, fontScale: 1 });
}

const homeActions = {
  onPressInstant: jest.fn(),
  onPressSchedule: jest.fn(),
  onPressAddress: jest.fn(),
  onPressProfile: jest.fn(),
  onOpenActiveBooking: jest.fn(),
};

const noop = jest.fn();

describe.each(HEIGHTS)('on a %s viewport', (_label, height) => {
  describe.each(WIDTHS)('at %ddp', (width) => {
    beforeEach(() => atSize(width, height));

    /* ------------------------------------------------------------------ auth */

    it('renders the Login loading page', () => {
      render(<SplashLoading />);
      expect(screen.getByTestId('splash-loading')).toBeTruthy();
    });

    /**
     * `250:2383`. The CTA and the legal footer are what a short viewport threatens, and they are
     * the two things the hero yields height FOR, so both are asserted rather than just the screen.
     */
    it('renders Login with its field, CTA and legal footer intact', () => {
      render(<LoginScreen login={DEMO_LOGIN} onRequestOtp={noop} />);

      expect(screen.getByTestId('login-screen')).toBeTruthy();
      expect(screen.getByTestId('login-screen-phone')).toBeTruthy();
      expect(screen.getByTestId('login-screen-cta')).toBeTruthy();
      expect(screen.getByText(DEMO_LOGIN.legalTerms)).toBeTruthy();
      expect(screen.getByText(DEMO_LOGIN.legalPrivacy)).toBeTruthy();
    });

    it('renders the OTP screen with every digit box', () => {
      render(<OtpScreen otp={DEMO_OTP} onVerify={noop} onResend={noop} onEditNumber={noop} />);

      expect(screen.getByTestId('otp-screen')).toBeTruthy();
      expect(screen.getByTestId('otp-screen-edit')).toBeTruthy();
    });

    /* ------------------------------------------------------------------ home */

    it('renders Home with every section', () => {
      render(<HomeView state={ready(DEMO_HOME_ACTIVE_BOOKING)} {...homeActions} />);

      for (const id of [
        'home-header',
        'home-promo',
        'home-tiles',
        'home-upcoming-booking',
        'home-cuisines',
        'home-reasons',
        'home-duration-guide',
        'home-exclusions',
        'home-promise',
      ]) {
        expect(screen.getByTestId(id)).toBeTruthy();
      }
    });

    /* --------------------------------------------------------------- address */

    /**
     * `53:31` is the screen with the least slack: a header, a search bar, a map that must stay
     * usable, a resolved-address row and a CTA. The map is the block that absorbs the squeeze, so
     * the row and the CTA both have to survive it.
     */
    it('renders the map step with its resolved row and Confirm', () => {
      render(
        <AddressLocationView
          state={ready(DEMO_ADDRESS_LOCATION)}
          onRetry={noop}
          onBack={noop}
          onConfirm={noop}
        />,
      );

      expect(screen.getByTestId('address-location-screen')).toBeTruthy();
      expect(screen.getByTestId('address-helper')).toBeTruthy();
      expect(screen.getByTestId('address-confirm')).toBeTruthy();
    });

    it('renders the address form with its pinned Confirm', () => {
      render(
        <AddressDetailsView
          state={ready(DEMO_ADDRESS_DETAILS)}
          onRetry={noop}
          onBack={noop}
          onChangeArea={noop}
          onSave={noop}
          locationReady
          submitting={false}
        />,
      );

      expect(screen.getByTestId('address-details-screen')).toBeTruthy();
      expect(screen.getByTestId('address-save')).toBeTruthy();
    });

    /**
     * The state a first-time customer actually opens `60:655` in: nothing filled, so `275:4485`
     * is drawn in `275:4690`'s grey. It is the same 34pt bar in the same place — a disabled CTA
     * must not be a differently-sized control that reflows the footer at 320.
     */
    it('keeps the DISABLED Confirm bar mounted and inert on an empty form', () => {
      render(
        <AddressDetailsView
          state={ready(DEMO_ADDRESS_DETAILS)}
          onRetry={noop}
          onBack={noop}
          onChangeArea={noop}
          onSave={noop}
          locationReady={false}
          submitting={false}
        />,
      );

      const cta = screen.getByTestId('address-save');
      expect(cta).toBeTruthy();
      expect(cta.props.accessibilityState.disabled).toBe(true);
    });

    it('renders the saved-address list', () => {
      render(
        <SavedAddressesView
          state={ready(DEMO_ADDRESS_LIST)}
          onRetry={noop}
          onBack={noop}
          onAdd={noop}
          onSelect={noop}
          onOpenActions={noop}
        />,
      );

      expect(screen.getByTestId('saved-addresses-screen')).toBeTruthy();
      expect(screen.getByTestId('address-add')).toBeTruthy();
    });

    it('renders the out-of-service screen', () => {
      render(
        <AddressOutOfServiceView
          state={ready(DEMO_ADDRESS_OUT_OF_SERVICE)}
          onRetry={noop}
          onBack={noop}
        />,
      );

      expect(screen.getByText(DEMO_ADDRESS_OUT_OF_SERVICE.title)).toBeTruthy();
    });

    /* --------------------------------------------------------------- profile */

    /** `6:663`'s legal/logout panel is PINNED to the foot, so it must survive both extremes. */
    it('renders Profile with its pinned footer', () => {
      render(
        <ProfileView
          state={ready(DEMO_PROFILE)}
          onRetry={noop}
          onBack={noop}
          onSelectTile={noop}
          onOpenProfileDetails={noop}
          onOpenLink={noop}
          onLogout={noop}
        />,
      );

      expect(screen.getByTestId('profile-screen')).toBeTruthy();
      expect(screen.getByTestId('profile-identity')).toBeTruthy();
      expect(screen.getByTestId('profile-footer')).toBeTruthy();
      expect(screen.getByTestId('profile-logout')).toBeTruthy();
    });

    /** `222:1570` / `456:3467` — the completion card, in both states, at every size. */
    it.each([
      ['incomplete', false, 'profile-incomplete'],
      ['completed', true, 'profile-complete'],
    ] as const)('renders the %s completion card on Profile', (_name, complete, testID) => {
      render(
        <ProfileView
          state={ready({ ...DEMO_PROFILE, profileComplete: complete })}
          onRetry={noop}
          onBack={noop}
          onSelectTile={noop}
          onOpenProfileDetails={noop}
          onOpenLink={noop}
          onLogout={noop}
        />,
      );

      expect(screen.getByTestId(testID)).toBeTruthy();
      expect(screen.getByTestId(`${testID}-cta`)).toBeTruthy();
    });

    /**
     * `338:4508` — the form-heavy page (task §24).
     *
     * It is 1025pt of content against a 568pt viewport at the short end, so EVERYTHING here
     * depends on the CTA scrolling with the body rather than being pinned: a pinned bar would
     * cover the Gender chips, which are the last thing above it. What is asserted is that the
     * first field, the last chip group and the CTA are all mounted at every size — a chip grid
     * that overflowed its column, or a CTA that fell out of the tree, fails here.
     */
    it('renders the profile-details form with its first field, last chips and CTA', () => {
      render(<ProfileDetailsView onSubmit={noop} onBack={noop} />);

      expect(screen.getByTestId('profile-details-screen')).toBeTruthy();
      expect(screen.getByTestId('profile-name')).toBeTruthy();
      expect(screen.getByTestId('profile-grown-up-entry')).toBeTruthy();
      // The 3-up groups are the ones a 320dp column threatens.
      expect(screen.getByTestId('profile-region-north-indian')).toBeTruthy();
      expect(screen.getByTestId('profile-gender-either')).toBeTruthy();
      expect(screen.getByTestId('profile-details-submit')).toBeTruthy();
    });

    /**
     * The longest labels in the file, at the narrowest width.
     *
     * "Office meals + food delivery" is 130pt of type in a chip that is ~135pt wide at 320dp. The
     * chip wraps rather than ellipsizing (the label carries no `numberOfLines`), so the text is
     * still THERE — which is what this asserts. A one-line clamp would render "Office meals + food
     * deliv…" and this would still pass on testID alone, so the TEXT is what is queried.
     */
    it('keeps the longest chip labels intact', () => {
      render(<ProfileDetailsView onSubmit={noop} onBack={noop} />);

      expect(screen.getByText('Office meals + food delivery')).toBeTruthy();
      expect(screen.getByText('Daily cook with 2x visits')).toBeTruthy();
      expect(
        screen.getByText('What is the most pressing issue with your meals today?'),
      ).toBeTruthy();
    });

    it.each([
      ['history', DEMO_BOOKING_HISTORY, 'history'],
      ['refunds', DEMO_REFUND_HISTORY, 'refund'],
    ] as const)('renders the %s list', (_name, list, variant) => {
      render(
        <BookingListView state={ready(list)} onRetry={noop} onBack={noop} variant={variant} />,
      );

      expect(screen.getByTestId('booking-list-screen')).toBeTruthy();
    });

    /* -------------------------------------------------------------- booking */

    it('renders the scheduled flow with its footer CTA', () => {
      render(
        <ScheduleView
          state={ready(DEMO_SCHEDULE_BOOK)}
          onRetry={noop}
          onBack={noop}
          onSelectionChange={noop}
          onSubmit={noop}
        />,
      );

      expect(screen.getByTestId('schedule-screen')).toBeTruthy();
    });

    it('renders Page 21 confirmation loading', () => {
      render(<ConfirmationLoading />);
      expect(screen.getByTestId('confirmation-loading')).toBeTruthy();
    });

    it('renders all eight cook profiles', () => {
      for (const profile of DEMO_COOK_PROFILES) {
        const { unmount } = render(
          <CookCard cook={profile.cook} variant={profile.variant} onCallCook={jest.fn()} />,
        );
        expect(screen.getByTestId('cook-card-specialties')).toBeTruthy();
        unmount();
      }
    });

    /**
     * Every service state the lifecycle host draws. These are the tallest frames in the file —
     * `292:1197` is 1263pt against a 568pt viewport — so they are the surfaces most dependent on
     * the scroll actually working.
     */
    it.each([
      ['confirmation', DEMO_BOOKING_CONFIRMATION, 'confirmation-body'],
      ['reassigned', DEMO_BOOKING_REASSIGNED, 'tracking-body'],
      ['en route', DEMO_BOOKING_EN_ROUTE, 'tracking-body'],
      ['arrived', DEMO_BOOKING_ARRIVED, 'tracking-body'],
      ['auto-cancelled', DEMO_BOOKING_AUTO_CANCELLED, 'auto-cancelled-body'],
      ['completion', DEMO_BOOKING_COMPLETION, 'completion-body'],
    ])('renders the %s service state', (_name, booking, marker) => {
      render(
        <BookingDetailView
          state={ready(booking)}
          onRetry={jest.fn()}
          onBack={jest.fn()}
          onCallCook={jest.fn()}
          onHelp={jest.fn()}
        />,
      );
      expect(screen.getByTestId(marker)).toBeTruthy();
    });
  });
});
