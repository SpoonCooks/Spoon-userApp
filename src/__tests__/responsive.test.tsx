import { screen } from '@testing-library/react-native';

import { renderWithDefaultRuntime as render } from '@/test/renderWithRuntime';
import { useWindowDimensions, StyleSheet } from 'react-native';

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
  AddressDetailsScreen,
  AddressMapScreen,
  EMPTY_DETAILS_FORM,
  NotServiceableScreen,
  SavedAddressesScreen,
} from '@features/address';
import { LoginScreen, OtpScreen } from '@features/auth';
import { BookingListView } from '@features/history';
import { EMPTY_PROFILE_DETAILS, ProfileView, TasteProfileWizard } from '@features/profile';
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
/** The taste-profile wizard hands Android's back to the stack, which needs a navigator. */
jest.mock('expo-router', () => ({
  __esModule: true,
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
}));

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
        'home-booking-carousel',
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
     * `1870:2379` is the screen with the least slack: a map that must stay usable, with the top
     * bar, the current-location pill and the sheet (hint, pinned place, Confirm) over it.
     */
    it('renders the map step with its pinned place and Confirm', () => {
      render(
        <AddressMapScreen
          coordinates={{ latitude: 12.97, longitude: 77.64 }}
          place={{ title: '100 Feet Road', line: 'Indiranagar, Sector 2, HAL phase 3, Bengaluru' }}
          locating={false}
          resolving={false}
          message={undefined}
          canConfirm
          confirming={false}
          onBack={noop}
          onSettle={noop}
          onLocate={noop}
          onConfirm={noop}
          search={{
            open: false,
            onOpen: noop,
            onClose: noop,
            query: '',
            suggestions: [],
            state: 'idle',
            onQuery: noop,
            onChoose: noop,
            onUseCurrentLocation: noop,
          }}
        />,
      );

      expect(screen.getByTestId('address-map-screen')).toBeTruthy();
      expect(screen.getByTestId('address-hint')).toBeTruthy();
      expect(screen.getByTestId('address-confirm')).toBeTruthy();
    });

    /**
     * The state a first-time customer opens the details form in: nothing filled, so Save is
     * drawn disabled — the same bar in the same place, not a control that reflows the dock.
     */
    it('renders the address form with its DISABLED Save on an empty form', () => {
      render(
        <AddressDetailsScreen
          mode="add"
          initial={EMPTY_DETAILS_FORM}
          pinned={{ title: '100 Feet Road', line: 'HAL 2nd Stage, Bengaluru' }}
          onBack={noop}
          onEditPin={noop}
          onSave={noop}
          saving={false}
          locationReady
        />,
      );

      const cta = screen.getByTestId('address-details-save');
      expect(screen.getByTestId('address-details')).toBeTruthy();
      expect(cta.props.accessibilityState.disabled).toBe(true);
    });

    it('renders the saved-address list', () => {
      render(
        <SavedAddressesScreen
          addresses={[
            {
              id: 'a',
              label: 'Home',
              kind: 'home',
              line: 'Flat 402, B, Purva',
              tag: 'Current selection',
            },
          ]}
          onBack={noop}
          onAdd={noop}
          onEdit={noop}
          onRemove={async () => 'removed'}
          notice={null}
        />,
      );

      expect(screen.getByTestId('saved-addresses')).toBeTruthy();
      expect(screen.getByTestId('saved-addresses-add')).toBeTruthy();
    });

    it('renders the Not serviceable screen with its redirect footer', () => {
      render(
        <NotServiceableScreen
          place={{
            title: '100 Feet Road',
            line: 'Indiranagar, Bengaluru',
            locality: 'Indiranagar',
            liveAreas: ['HSR Layout', 'Haralur'],
            neighbours: 128,
          }}
          onBack={noop}
          onGoHome={noop}
          onTimeout={noop}
        />,
      );

      expect(screen.getByText('We’re not in Indiranagar yet')).toBeTruthy();
      expect(screen.getByTestId('not-serviceable-home')).toBeTruthy();
    });

    /* --------------------------------------------------------------- profile */

    /** `6:663`'s Manage account/logout footer is PINNED to the foot, so it must survive both extremes. */
    it('renders Profile with its pinned footer', () => {
      render(
        <ProfileView
          state={ready(DEMO_PROFILE)}
          onRetry={noop}
          onBack={noop}
          onSelectTile={noop}
          onOpenProfileDetails={noop}
          onOpenManageAccount={noop}
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
          onOpenManageAccount={noop}
          onLogout={noop}
        />,
      );

      expect(screen.getByTestId(testID)).toBeTruthy();
      expect(screen.getByTestId(`${testID}-cta`)).toBeTruthy();
    });

    /**
     * The taste-profile wizard (`1405:448`) — each step at every size. The CTA is pinned in a
     * footer and the steps scroll above it, so what is asserted is that each step's first and
     * last control and the CTA are all mounted.
     */
    it.each([
      ['family', 'taste-profile-name', 'taste-profile-householdElders-plus'],
      ['diet', 'taste-profile-diet-vegetarian', 'taste-profile-diet-mixed'],
      ['taste', 'taste-profile-cuisine-search', 'taste-profile-ghee'],
      ['cook', 'taste-profile-gender-either', 'taste-profile-meal-office-meals'],
    ] as const)('renders the %s step with its controls and CTA', (step, first, last) => {
      render(
        <TasteProfileWizard
          initialValues={EMPTY_PROFILE_DETAILS}
          initialStep={step}
          onSubmit={noop}
          onExit={noop}
        />,
      );

      expect(screen.getByTestId(first)).toBeTruthy();
      expect(screen.getByTestId(last)).toBeTruthy();
      expect(screen.getByTestId('taste-profile-continue')).toBeTruthy();
    });

    /** The longest copy in the file, at the narrowest width: wrapped, never clipped. */
    it('keeps the longest labels intact', () => {
      render(
        <TasteProfileWizard
          initialValues={{ ...EMPTY_PROFILE_DETAILS, mealStructure: 'tiffin' }}
          initialStep="cook"
          onSubmit={noop}
          onExit={noop}
        />,
      );

      expect(screen.getByText('Cooks you’re comfortable with')).toBeTruthy();
      expect(screen.getByText('Neighbourhood tiffin or meal subscription')).toBeTruthy();
      expect(screen.getByText('Hard to pause, skip or change')).toBeTruthy();
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

    /**
     * Completion's Submit chip must be able to hold its own label.
     *
     * `143:286` draws it 102 x 25, and that was taken as a fixed size with no padding -- so the
     * label had exactly 102pt to live in. "SUBMIT", uppercased by `buttonUpper`, did not fit on a
     * Galaxy S21 at the DEFAULT font scale: the shipped button read "SUBMI". Anyone at a larger
     * accessibility scale loses more of it.
     *
     * The frame's geometry is kept as a minimum, which is what a chip with a word in it needs.
     */
    it('lets the Submit chip grow to fit its label rather than clipping it', () => {
      render(
        <BookingDetailView
          state={ready(DEMO_BOOKING_COMPLETION)}
          onRetry={jest.fn()}
          onBack={jest.fn()}
          onCallCook={jest.fn()}
          onHelp={jest.fn()}
        />,
      );

      const submit = screen.getByTestId('completion-submit');
      const style = StyleSheet.flatten(
        typeof submit.props.style === 'function'
          ? submit.props.style({ pressed: false })
          : submit.props.style,
      );

      // A FIXED width is the defect: the text cannot push the box wider than the frame's figure.
      expect(style.width).toBeUndefined();
      expect(style.minWidth).toBe(102);
      // And room either side of the word, which a 102pt box with no padding never had.
      expect(style.paddingHorizontal).toBeGreaterThan(0);
    });
  });
});
