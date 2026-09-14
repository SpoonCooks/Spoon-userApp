import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';

/**
 * Back navigation, end to end (task §25).
 *
 * ## What is actually being asserted
 *
 * Not "a handler was called" — that proves nothing about whether the customer moves. What these
 * assert is that EVERY drawn back control resolves to a real navigation on BOTH stack shapes:
 *
 *   with a history     -> a pop
 *   with NO history    -> a deterministic fallback route
 *
 * The second shape is not hypothetical. Three entry points reach a screen with an empty stack:
 * the first-run redirect chain (`/` -> Home -> `53:31`, both replaces), a push notification
 * opening `/booking/:id` directly, and any `spoon://` deep link. On all three, the old bare
 * `router.back()` produced React Navigation's "The action 'GO_BACK' was not handled by any
 * navigator" and the chevron did nothing — a dead end on screens the customer cannot leave.
 *
 * The router is mocked because a real navigator would need the whole app mounted; what matters is
 * which router METHOD each control reaches and with what, which is exactly what a mock records.
 */

import AccountRoute from '@/app/(app)/account';
import AddressDetailsRoute from '@/app/(app)/address/details';
import SavedAddressesRoute from '@/app/(app)/address/index';
import AddressLocationRoute from '@/app/(app)/address/location';
import AddressOutOfServiceRoute from '@/app/(app)/address/out-of-service';
import BookingRoute from '@/app/(app)/booking/[id]';
import HistoryRoute from '@/app/(app)/history';
import HomeRoute from '@/app/(app)/home';
import ProfileRoute from '@/app/(app)/profile';
import RefundsRoute from '@/app/(app)/refunds';
import RescheduleRoute from '@/app/(app)/reschedule/[id]';
import ScheduledRoute from '@/app/(app)/scheduled';
import LoginRoute from '@/app/(auth)/login';
import OtpRoute from '@/app/(auth)/otp';
import NotFoundRoute from '@/app/+not-found';
import DeleteAccountOtpRoute from '@/app/(app)/account/delete-otp';
import LegalDocumentRoute from '@/app/legal/[doc]';

import { routeForNotification } from '@features/notifications';
import { BANNER_DESTINATION_PAGE, homeBannerFor } from '@features/home';
import { sessionStore } from '@core/store';

/** Reassigned per test so one test's stack shape cannot leak into the next. */
let mockRouter: {
  push: jest.Mock;
  back: jest.Mock;
  replace: jest.Mock;
  dismissAll: jest.Mock;
  dismissTo: jest.Mock;
  canGoBack: jest.Mock;
  canDismiss: jest.Mock;
};
let mockSearchParams: Record<string, string> = {};
let mockRedirected: string[] = [];

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
  Redirect: ({ href }: { href: string }) => {
    mockRedirected.push(href);
    return null;
  },
  Stack: () => null,
}));

function makeRouter(canGoBack: boolean) {
  return {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: jest.fn(() => canGoBack),
    canDismiss: jest.fn(() => canGoBack),
  };
}

/**
 * The two list reads Profile's children perform. Empty, deliberately: these tests are about
 * NAVIGATION, and an empty list still draws the screen's header — which is where the back control
 * lives. A read that FAILED would render the error state instead, and the chevron would be missing
 * for a reason that has nothing to do with what is being asserted.
 */
const PRICE = {
  amountPaise: 12900,
  durationMinutes: 60,
  serviceAmountPaise: 12900,
  taxRateBps: 500,
  taxAmountPaise: 645,
  totalAmountPaise: 13545,
  currency: 'INR',
  pricingVersion: 'pricing-policy-v0',
};

/** One confirmed booking, enough for the lifecycle host to render its header and its back disc. */
const BOOKING = {
  id: 'bk-1',
  status: 'assigned',
  slotType: 'scheduled',
  scheduledStart: '2026-08-20T07:30:00.000Z',
  durationMinutes: 60,
  price: PRICE,
  holdExpiresAt: null,
  address: {
    label: 'Home',
    latitude: 12.902746,
    longitude: 77.648817,
    flat: 'E102',
    tower: null,
    society: 'Purva Skydale',
    street: 'Silver County Road',
    pincode: '560102',
    city: 'Bengaluru',
    state: 'Karnataka',
    hubName: null,
    receiverName: null,
    receiverPhone: null,
  },
  mealNotes: null,
  referenceUrl: null,
  mealBrief: null,
  cook: null,
  timing: { arrivedAt: null, actualStart: null, expectedEnd: null, actualEnd: null },
  cancellation: null,
  allowedActions: {
    canCancel: true,
    canReschedule: true,
    canExtend: false,
    canRate: false,
    canTip: false,
    canCallCook: false,
  },
};

const NAV_STUBS = {
  ...DEFAULT_API_STUBS,
  'GET /v1/me/bookings': () => ({ bookings: [] }),
  'GET /v1/me/refunds': () => ({ refunds: [] }),
  'GET /v1/me/bookings/active': () => ({ bookings: [] }),
  'GET /v1/bookings/bk-1': () => ({ booking: BOOKING }),
  'GET /v1/bookings/bk-9': () => ({ booking: { ...BOOKING, id: 'bk-9' } }),
};

function render(ui: Parameters<typeof renderWithRuntime>[0]) {
  return renderWithRuntime(ui, {
    runtime: createTestRuntime({ api: createStubApi(NAV_STUBS) }),
  });
}

beforeEach(() => {
  mockRouter = makeRouter(true);
  mockSearchParams = {};
  mockRedirected = [];
  // The session machine starts at `bootstrapping`, where `/` and `+not-found` correctly HOLD on
  // the splash rather than guessing a destination. These tests are about what happens once it has
  // settled, so it is settled here.
  sessionStore.reset();
  sessionStore.dispatch({ type: 'BOOTSTRAP_FOUND_SESSION' });
});

/**
 * Routes whose back control POPS when it can. Used where "the screen underneath" is genuinely the
 * right answer, and the fallback only covers a stack that has nothing to pop.
 *
 * The fallback is the screen the route sits UNDER, never a child: replacing with a child would
 * make back walk forward, and pushing the parent would leave the abandoned screen behind it — a
 * two-screen loop the customer cannot escape.
 */
const POPPING_BACK_ROUTES = [
  // `215:1472` is PUSHED over a live `53:31`, and popping is what returns the customer to the pin
  // they placed rather than to a map that re-acquires the device fix (task §5).
  ['address/out-of-service', AddressOutOfServiceRoute, 'address-header-back', '/address/location'],
  ['scheduled', ScheduledRoute, 'schedule-header-back', '/home'],
  // `275:4321`'s "edit number" IS the back control on OTP — the frame draws no chevron.
  ['otp', OtpRoute, 'otp-screen-edit', '/login'],
  // `68:214` is always pushed directly on top of whichever entry sent it (Home or Profile — see
  // "Saved addresses back target follows its entry point" below), so popping both lands on the
  // right screen AND plays the platform's reverse-of-push closing animation, which a bare
  // `replace` does not. No `?from=` here, so the fallback below is the un-tagged default.
  ['address', SavedAddressesRoute, 'address-header-back', '/profile'],
  // `6:663` is always pushed directly on top of Home (its one push site, `home.tsx`), so the same
  // pop-gets-the-closing-animation reasoning as `address` above applies here too. The `spoon://`
  // deep-link case has no history, which is exactly what the fallback below covers.
  ['profile', ProfileRoute, 'screen-header-back', '/home'],
  // `53:31`'s only push site is `68:214`'s "Add a new address" (the first-run case reaches it by
  // a `<Redirect>` and draws no back control at all), so the same pop-gets-the-closing-animation
  // reasoning applies once more — a right-to-left "opening" animation on the way back out was the
  // exact defect reported here.
  ['address/location', AddressLocationRoute, 'address-header-back', '/address'],
  // `6:227` and `71:615` are each pushed only from Profile's tile grid — their rows draw no
  // secondary navigation of their own — so the same pop-gets-the-closing-animation reasoning
  // applies to both.
  ['history', HistoryRoute, 'screen-header-back', '/profile'],
  ['refunds', RefundsRoute, 'screen-header-back', '/profile'],
  // Account (V9) is reached only from Profile's "Manage account" row — same reasoning as
  // History and Refunds above.
  ['account', AccountRoute, 'screen-header-back', '/profile'],
  // `60:655`'s header back NO LONGER forces `53:31` on an edit (reversed product decision — see
  // "address edit now returns to the list" below): it has two genuinely different predecessors
  // (the map's confirm, or `68:214`'s "Edit" pushing here directly), and a plain pop resolves to
  // whichever is actually true — which is also what fixes the same "opening" animation defect
  // fixed everywhere else in this file. No `?from=` here, so `/address` is the un-tagged default.
  ['address/details', AddressDetailsRoute, 'address-header-back', '/address'],
] as const;

describe('back is always handled', () => {
  it.each(POPPING_BACK_ROUTES)('%s pops when there IS a history', async (_name, Route, backId) => {
    render(<Route />);

    fireEvent.press(await screen.findByTestId(backId));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it.each(POPPING_BACK_ROUTES)(
    '%s falls back to a real route when there is NO history',
    async (_name, Route, backId, fallback) => {
      mockRouter = makeRouter(false);
      render(<Route />);

      fireEvent.press(await screen.findByTestId(backId));

      // The defect this closes: `mockRouter.back()` on an empty stack is unhandled, and the drawn
      // chevron does nothing at all.
      expect(mockRouter.back).not.toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith(fallback);
    },
  );
});

/**
 * `60:655`'s "Change area" is a forward DIGRESSION, not a back control — it belongs in neither
 * table above. It always PUSHES (never replaces) to `53:31`, tagged `resume=1` so the map's own
 * Confirm knows to pop back to this exact screen instead of pushing a second, blank one — see
 * `location.tsx` and "the map pops back to an open Details screen after Change area" below. The
 * old `dismissAll` + `replace` destroyed this screen outright, which is what made both back AND
 * Confirm land somewhere other than "the screen Change area was pressed from" (the reported bug).
 */
describe('address details "Change area" is a push, not a replace', () => {
  it('pushes the map, tagged to resume this exact screen, even on an edit', async () => {
    mockSearchParams = { addressId: 'addr-1' };

    render(<AddressDetailsRoute />);

    fireEvent.press(await screen.findByTestId('address-change-area'));

    expect(mockRouter.push).toHaveBeenCalledWith('/address/location?resume=1&addressId=addr-1');
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
  });
});

/**
 * `68:214` Saved addresses is pushed directly on top of whichever entry sent it — Home's
 * serving-at banner or Profile's "Addresses" tile (`home.tsx`, `profile/index.tsx`) — each tagging
 * its `push('/address')` with `?from=`. With a history to pop, that tag is redundant with the
 * stack (both land in the same place either way); it earns its keep on the no-history fallback,
 * previously a blanket `/profile` that put an extra screen between a Home-initiated trip and Home.
 */
describe('Saved addresses back target follows its entry point', () => {
  it('pops when opened from Home, with a history to pop', async () => {
    mockSearchParams = { from: 'home' };
    render(<SavedAddressesRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('falls back straight to Home when opened from Home with no history', async () => {
    mockRouter = makeRouter(false);
    mockSearchParams = { from: 'home' };
    render(<SavedAddressesRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  it('falls back to Profile when opened from Profile with no history', async () => {
    mockRouter = makeRouter(false);
    mockSearchParams = { from: 'profile' };
    render(<SavedAddressesRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/profile');
  });
});

/**
 * A push notification opens `/booking/:id` DIRECTLY — the app is launched into it — so the
 * booking host is the route most likely to be the only entry on the stack.
 */
describe('booking host — the notification entry point', () => {
  it('backs out to Home when the app was launched straight into a booking', async () => {
    mockRouter = makeRouter(false);
    mockSearchParams = { id: 'bk-1' };

    render(<BookingRoute />);

    fireEvent.press(await screen.findByTestId('booking-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  it('is the route a notification targets, and falls back to Home without an id', () => {
    expect(routeForNotification({ bookingId: 'bk-1', eventType: 'booking.completed' })).toBe(
      '/booking/bk-1',
    );
    // §20 — a payload with no identifier opens a safe root rather than a route built from it.
    expect(routeForNotification({ eventType: 'promo' })).toBe('/home');
    expect(routeForNotification(null)).toBe('/home');
    expect(routeForNotification('nonsense')).toBe('/home');
  });
});

describe('unknown deep links', () => {
  /**
   * §20 — never a black screen and never a dead end. The route used to render a development
   * scaffold reading "FOUNDATION PLACEHOLDER"; it now redirects to a root chosen off the session.
   */
  it('redirect to a safe root instead of a scaffold', () => {
    render(<NotFoundRoute />);

    expect(screen.queryByText('FOUNDATION PLACEHOLDER')).toBeNull();
    expect(mockRedirected).toHaveLength(1);
    expect(['/home', '/login']).toContain(mockRedirected[0]);
  });
});

describe('first-run address flow', () => {
  /**
   * §9 — a customer with no saved address is sent to `53:31`, and the whole flow is told so with
   * `onboarding=1` so it ends at HOME rather than at the saved-address list they never asked for.
   */
  it('sends a customer with no address to the map, carrying the onboarding flag', async () => {
    const api = createStubApi({ ...NAV_STUBS, 'GET /v1/me/addresses': () => [] });
    renderWithRuntime(<HomeRoute />, { runtime: createTestRuntime({ api }) });

    await waitFor(() => {
      expect(mockRedirected).toContain('/address/location?onboarding=1');
    });
  });

  /**
   * V7 founder comment (task §4, §15, §27): a FIRST-TIME customer gets NO back control on
   * `53:31`. They arrive straight out of OTP with no address, both hops that reach the screen
   * replace, and the address gate would bounce any escape straight back — so a chevron there is
   * a control that cannot work. It is absent, not inert.
   */
  it('draws no back control at all for a first-time customer', async () => {
    mockSearchParams = { onboarding: '1' };

    render(<AddressLocationRoute />);
    await screen.findByTestId('address-location-screen');

    expect(screen.queryByTestId('address-header-back')).toBeNull();
  });

  /**
   * The other half of the same rule: a REPEAT customer adding an address reached `53:31` from
   * `68:214` and gets the disc, which goes back to that list. The same route must not render one
   * affordance and perform the other, so both halves are asserted against the same component.
   *
   * This is a POP (see the popping table above), not a replace: `53:31`'s only push site is
   * `68:214` itself, so there is always a history to pop, and popping is what gets the platform's
   * reverse-of-push closing animation rather than the "opening" animation a bare `replace` played.
   */
  it('draws a back control for a repeat customer, and it pops to the saved list', async () => {
    render(<AddressLocationRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  /**
   * With no history to pop — a deep link straight to this route — the `from` tag `68:214` needs
   * for its OWN back control still has to survive the fallback replace, or a trip that started at
   * Home would silently lose it. See "Saved addresses back target follows its entry point".
   */
  it('falls back to the correct list entry point with no history to pop', async () => {
    mockRouter = makeRouter(false);
    mockSearchParams = { from: 'home' };
    render(<AddressLocationRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/address?from=home');
  });
});

describe('address edit now returns to the list', () => {
  /**
   * `60:655` back -> `68:214` directly on an edit (product decision REVERSED — see `goBack`'s
   * comment in `address/details.tsx`). An edit is pushed straight from the list, skipping the
   * map entirely, so a pop lands correctly on the list without any special-casing.
   */
  it('pops an edit straight back to the list', async () => {
    mockSearchParams = { addressId: 'addr-1' };

    render(<AddressDetailsRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('falls back to the correct list entry point with no history to pop', async () => {
    mockRouter = makeRouter(false);
    mockSearchParams = { addressId: 'addr-1', from: 'home' };

    render(<AddressDetailsRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/address?from=home');
  });

  it('opens Edit with the id of the row that was tapped', async () => {
    render(<SavedAddressesRoute />);
    await screen.findByTestId('saved-addresses-screen');

    fireEvent.press(screen.getByTestId('address-row-menu-addr-1'));
    fireEvent.press(await screen.findByTestId('address-edit-action'));

    expect(mockRouter.push).toHaveBeenCalledWith('/address/details?addressId=addr-1');
  });
});

describe('Home is a root', () => {
  /**
   * §2 — Home draws NO back control. Android's hardware back at a root is the platform's to
   * handle (React Navigation lets the activity finish), and drawing a chevron that could only
   * ever be unhandled would invite the press that produces the error.
   */
  it('draws no back control at all', async () => {
    render(<HomeRoute />);
    await screen.findByTestId('home-screen');

    expect(screen.queryByTestId('screen-header-back')).toBeNull();
    expect(screen.queryByTestId('address-header')).toBeNull();
    expect(screen.queryByTestId('booking-back')).toBeNull();
  });

  it('opens the Instant sheet locally, with no navigation', async () => {
    render(<HomeRoute />);

    fireEvent.press(await screen.findByTestId('home-tile-instant'));

    expect(await screen.findByTestId('instant-sheet')).toBeTruthy();
    // §18 — opening a sheet is local state. Nothing navigates and nothing is fetched to do it.
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  /**
   * §2 — a sheet is a native `Modal`, so Android's hardware back reaches `onRequestClose` before
   * the navigator sees it. Closing the sheet must not touch the stack.
   */
  it('closes the Instant sheet without navigating', async () => {
    render(<HomeRoute />);
    fireEvent.press(await screen.findByTestId('home-tile-instant'));
    await screen.findByTestId('instant-sheet');

    fireEvent(screen.getByTestId('instant-sheet-modal'), 'requestClose');

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('routes the Home tiles and the profile control to real destinations', async () => {
    render(<HomeRoute />);

    fireEvent.press(await screen.findByTestId('home-tile-scheduled'));
    expect(mockRouter.push).toHaveBeenCalledWith('/scheduled');

    // Tagged with its entry point, so Saved addresses' back control can send it straight home
    // rather than through Profile — see "Saved addresses back target follows its entry point".
    fireEvent.press(await screen.findByTestId('home-address'));
    expect(mockRouter.push).toHaveBeenCalledWith('/address?from=home');
  });
});

describe('profile children', () => {
  it.each([
    ['orders', '/history'],
    ['addresses', '/address?from=profile'],
    ['refunds', '/refunds'],
  ])('%s opens %s', async (tile, destination) => {
    render(<ProfileRoute />);

    fireEvent.press(await screen.findByTestId(`profile-tile-${tile}`));

    expect(mockRouter.push).toHaveBeenCalledWith(destination);
  });

  /**
   * V9 — the legal footer row is gone from Profile. "Manage account" opens `@features/account`
   * instead, which is the screen that now carries both documents (and Delete Account).
   */
  it('opens Account from Manage account', async () => {
    render(<ProfileRoute />);

    fireEvent.press(await screen.findByTestId('profile-manage-account'));
    expect(mockRouter.push).toHaveBeenCalledWith('/account');
  });
});

describe('account children', () => {
  /**
   * Terms of Service and Privacy Policy open IN THE APP, same as they did from Profile before
   * V9 moved them here — never handed to `Linking`, which would eject the customer into Chrome to
   * read the terms they are being asked to accept.
   */
  it.each([
    ['account-terms', '/legal/terms'],
    ['account-privacy', '/legal/privacy'],
  ])('%s opens %s', async (testId, href) => {
    render(<AccountRoute />);

    fireEvent.press(await screen.findByTestId(testId));
    expect(mockRouter.push).toHaveBeenCalledWith(href);
  });
});

/**
 * Login states "By continuing, I accept the Terms of use & Privacy policy" directly above these
 * two links, and both used to do NOTHING — `LoginScreen` takes the handlers as optional props and
 * the route supplied neither, so each was drawn underlined, looked tappable, and absorbed the
 * press silently.
 *
 * They must work with NO session, which is why `/legal/:doc` lives outside the `(app)` group:
 * gated, the only people who could read the terms would be the people who already agreed to them.
 */
describe('legal documents are reachable before signing in', () => {
  it.each([
    ['Terms of use', '/legal/terms'],
    ['Privacy policy', '/legal/privacy'],
  ])('opens %s from Login', (label, href) => {
    render(<LoginRoute />);

    fireEvent.press(screen.getByText(label));

    expect(mockRouter.push).toHaveBeenCalledWith(href);
  });

  /**
   * Back POPS, so the reader returns to whichever screen opened the document.
   *
   * This used to dismiss the stack and replace it with Profile, which was invisible while Profile
   * was the only way in — origin and destination were the same screen. The Account screen now
   * links here too, and on staging that sent a reader who opened the Terms from Account back to
   * Profile, with the Account screen gone from under them.
   */
  it('returns to whichever screen opened it', () => {
    mockSearchParams = { doc: 'terms' };
    render(<LegalDocumentRoute />);

    fireEvent.press(screen.getByTestId('legal-document-header-back'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
  });

  /** A cold `spoon://legal/:doc` has nothing to pop to, so it still lands somewhere real. */
  it('falls back to Profile when there is no stack behind it', () => {
    mockRouter = makeRouter(false);
    mockSearchParams = { doc: 'privacy' };
    render(<LegalDocumentRoute />);

    fireEvent.press(screen.getByTestId('legal-document-header-back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/profile');
  });
});

/**
 * A booking in a list has to be reachable.
 *
 * `BookingListView` has always taken `onSelect` and `BookingCard` `onPress`, but no screen passed
 * either — so every card was inert and the Cancel control on `/booking/:id` could not be reached
 * from the list at all. Account deletion is what surfaced it: a deletion blocked by an active
 * booking sends the customer to this list to clear it, and the list could not open the booking.
 */
describe('My bookings opens the booking it lists', () => {
  it('pushes the booking the card names', async () => {
    const api = createStubApi({
      ...NAV_STUBS,
      'GET /v1/me/bookings/active': () => ({
        bookings: [
          {
            id: 'bk-live-1',
            status: 'assigned',
            slotType: 'scheduled',
            scheduledStart: '2026-08-20T07:30:00.000Z',
            durationMinutes: 60,
            price: PRICE,
            addressLabel: 'Home',
          },
        ],
      }),
    });
    renderWithRuntime(<HistoryRoute />, { runtime: createTestRuntime({ api }) });

    fireEvent.press(await screen.findByTestId('history-screen-card-bk-live-1'));

    expect(mockRouter.push).toHaveBeenCalledWith('/booking/bk-live-1');
  });
});

/**
 * A blocked deletion must not strand the customer on a spent OTP screen.
 *
 * Observed on staging: the "View my bookings" link PUSHED, so backing out of the bookings list
 * returned to an OTP the customer could no longer use and could not get past. Taking the link
 * abandons the attempt — the blocker has to be cleared first and the code expires long before
 * that — so it replaces, leaving Account behind them, which is where a second attempt begins.
 */
describe('a blocked deletion leaves a way out', () => {
  it('replaces the OTP screen rather than stacking the bookings list on it', async () => {
    const api = createStubApi({
      ...NAV_STUBS,
      'DELETE /v1/me': () => {
        throw {
          kind: 'validation',
          status: 409,
          code: 'ACCOUNT_DELETION_BLOCKED',
          message: 'This account cannot be deleted right now because of an active booking.',
          details: { reason: 'ACTIVE_BOOKING' },
        };
      },
    });
    renderWithRuntime(<DeleteAccountOtpRoute />, { runtime: createTestRuntime({ api }) });

    // The sixth digit IS the submit gesture; these frames draw no CTA.
    fireEvent.changeText(await screen.findByTestId('otp-screen-input'), '123456');

    fireEvent.press(await screen.findByTestId('otp-screen-notice-action'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/history');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/history');
  });
});

describe('reschedule', () => {
  /** §25 — abandoning a reschedule returns to the BOOKING it was about, never to Home. */
  it('backs out to the booking being rescheduled', async () => {
    mockRouter = makeRouter(false);
    mockSearchParams = { id: 'bk-9' };

    render(<RescheduleRoute />);

    fireEvent.press(await screen.findByTestId('schedule-header-back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/booking/bk-9');
  });
});

/**
 * §12 — every lifecycle banner leads to the ONE lifecycle host, which then picks 8a…14a from the
 * server's state. The Figma page is recorded for the audit trail and is deliberately NOT an
 * instruction: letting a stale Home choose the view would let it outvote a fresh booking read.
 */
describe('Home banner destinations', () => {
  it.each([
    // `created` is deliberately absent: an unfinalized payment draws no banner, so it has no
    // destination to lead anywhere. See `homeBannerView`'s note on why it stopped sharing the
    // confirmed card.
    ['confirmed' as const, 'assigned' as const, '8a'],
    ['arriving' as const, 'cook_en_route' as const, '9a/9b'],
    ['arrived' as const, 'cook_arrived' as const, '11'],
    ['live' as const, 'cooking' as const, '12a/12b'],
  ])('%s (%s) leads to the lifecycle host', (variant, status, page) => {
    const banner = homeBannerFor({
      bookingId: 'bk-1',
      status,
      dateLabel: 'Aug 7',
      timeLabel: '1:00 PM',
    });

    expect(banner).not.toBeNull();
    expect(banner?.variant).toBe(variant);
    expect(banner?.destination.route).toBe('/booking/[id]');
    expect(banner?.destination.bookingId).toBe('bk-1');
    expect(banner?.destination.figmaPage).toBe(page);
    expect(BANNER_DESTINATION_PAGE[variant]).toBe(page);
  });

  it('opens the REAL booking id, never a fixture route', async () => {
    const api = createStubApi({
      ...NAV_STUBS,
      // The banner needs the SUMMARY (which booking is active) and then the DETAIL (what state it
      // is in). Both are stubbed so the card renders from a real payload shape.
      'GET /v1/bookings/bk-live-1': () => ({ booking: { ...BOOKING, id: 'bk-live-1' } }),
      'GET /v1/me/bookings/active': () => ({
        bookings: [
          {
            id: 'bk-live-1',
            status: 'assigned',
            slotType: 'scheduled',
            scheduledStart: '2026-08-20T07:30:00.000Z',
            durationMinutes: 60,
            price: PRICE,
            addressLabel: 'Home',
          },
        ],
      }),
    });
    renderWithRuntime(<HomeRoute />, { runtime: createTestRuntime({ api }) });

    // One booking in the stub, so the carousel draws exactly one card, at track position 0.
    const banner = await screen.findByTestId('home-booking-carousel-card-0');
    fireEvent.press(banner);

    expect(mockRouter.push).toHaveBeenCalledWith('/booking/bk-live-1');
  });
});

/**
 * The back control is the shared `63:783` chevron on every screen that draws one, but the testID
 * differs by feature. Resolving it here keeps the table above about ROUTES rather than about which
 * header a screen happens to instance.
 */
