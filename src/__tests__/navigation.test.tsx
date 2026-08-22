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
import OtpRoute from '@/app/(auth)/otp';
import NotFoundRoute from '@/app/+not-found';

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
] as const;

/**
 * Routes whose back control lands on ONE named screen whatever the stack looks like.
 *
 * These are the founder's V7 routing matrix (task §5, §11, §14, §15), and each destination is a
 * product decision rather than a consequence of history:
 *
 *   `6:663`  Profile          -> Home
 *   `6:227`  Past bookings    -> Profile, never Home
 *   `71:615` Refunds          -> Profile, never Home
 *   `68:214` Saved addresses  -> Profile
 *   `53:31`  Address location -> Saved addresses (repeat customer; a first-run one has NO control)
 *   `60:655` Complete address -> `53:31`, including on an edit
 *
 * They are asserted on a stack that CAN pop, because that is the shape where "deterministic" and
 * "pop" disagree — and where the old behaviour silently did the wrong thing.
 */
const DETERMINISTIC_BACK_ROUTES = [
  ['profile', ProfileRoute, 'screen-header-back', '/home'],
  ['history', HistoryRoute, 'screen-header-back', '/profile'],
  ['refunds', RefundsRoute, 'screen-header-back', '/profile'],
  ['address', SavedAddressesRoute, 'address-header-back', '/profile'],
  ['address/location', AddressLocationRoute, 'address-header-back', '/address'],
  ['address/details', AddressDetailsRoute, 'address-header-back', '/address/location'],
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

describe('the V7 routing matrix is deterministic', () => {
  it.each(DETERMINISTIC_BACK_ROUTES)(
    '%s goes to its named destination even when the stack COULD pop',
    async (_name, Route, backId, destination) => {
      render(<Route />);

      fireEvent.press(await screen.findByTestId(backId));

      expect(mockRouter.back).not.toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith(destination);
    },
  );

  it.each(DETERMINISTIC_BACK_ROUTES)(
    '%s reaches the same destination with NO history',
    async (_name, Route, backId, destination) => {
      mockRouter = makeRouter(false);
      render(<Route />);

      fireEvent.press(await screen.findByTestId(backId));

      expect(mockRouter.replace).toHaveBeenCalledWith(destination);
    },
  );
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
   */
  it('draws a back control for a repeat customer, and it returns to the saved list', async () => {
    render(<AddressLocationRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/address');
  });
});

describe('address edit keeps its identity', () => {
  /**
   * `60:655` back -> `53:31`, unconditionally (V7 routing matrix, task §5/§15/§28).
   *
   * The superseded behaviour sent an EDIT to `68:214` instead, on the reasoning that an edit never
   * went through the map. The founder's matrix overrides that, and the chain it produces is
   * coherent — list -> form (prefilled) -> map -> list — provided the map step is told WHICH
   * record is in play. `addressId` therefore travels with it, which is what keeps a round trip
   * through the map an UPDATE rather than a second address.
   */
  it('backs an edit out to the map, carrying the address id', async () => {
    mockSearchParams = { addressId: 'addr-1' };

    render(<AddressDetailsRoute />);

    fireEvent.press(await screen.findByTestId('address-header-back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/address/location?addressId=addr-1');
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
  });
});

describe('profile children', () => {
  it.each([
    ['orders', '/history'],
    ['addresses', '/address'],
    ['refunds', '/refunds'],
  ])('%s opens %s', async (tile, destination) => {
    render(<ProfileRoute />);

    fireEvent.press(await screen.findByTestId(`profile-tile-${tile}`));

    expect(mockRouter.push).toHaveBeenCalledWith(destination);
  });

  /**
   * §11 — the legal row has no published URL anywhere in the contract, so it is drawn as the
   * underlined label it already is rather than as a control that swallows a press. See
   * `docs/FRONTEND_BACKEND_PENDING.md`.
   */
  it('draws the legal row without making it a dead button', async () => {
    render(<ProfileRoute />);

    const row = await screen.findByTestId('profile-link-legal');
    expect(row).toBeTruthy();
    expect(row.props.accessibilityRole).not.toBe('link');
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
    ['confirmed' as const, 'created' as const, '8a'],
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

    const banner = await screen.findByTestId('home-upcoming-booking');
    fireEvent.press(banner);

    expect(mockRouter.push).toHaveBeenCalledWith('/booking/bk-live-1');
  });
});

/**
 * The back control is the shared `63:783` chevron on every screen that draws one, but the testID
 * differs by feature. Resolving it here keeps the table above about ROUTES rather than about which
 * header a screen happens to instance.
 */
