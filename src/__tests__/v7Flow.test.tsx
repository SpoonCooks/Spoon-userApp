import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';

/**
 * The V7 founder comments, as behaviour (task §22, §32).
 *
 * Everything asserted here is a PRODUCT DECISION written on the final Figma rather than something
 * a frame draws, which is exactly why it needs tests: a screenshot comparison cannot see any of
 * it. Each block names the comment it defends.
 *
 * The router is mocked. What matters is which router method each control reaches and with what —
 * mounting a real navigator would need the whole app and would assert less.
 */

import SavedAddressesRoute from '@/app/(app)/address/index';
import BookingConfirmingRoute from '@/app/(app)/booking/confirming';
import BookingRoute from '@/app/(app)/booking/[id]';
import HomeRoute from '@/app/(app)/home';

import { HOME_USECASE_SLIDES } from '@features/home/assets';
import { sessionStore } from '@core/store';

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

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
  Redirect: () => null,
  Stack: () => null,
}));

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

const ADDRESS = {
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
};

/** A booking in whatever lifecycle state a test needs. */
function bookingWith(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bk-1',
    status: 'assigned',
    slotType: 'instant',
    scheduledStart: null,
    durationMinutes: 60,
    price: PRICE,
    holdExpiresAt: null,
    address: ADDRESS,
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
    ...overrides,
  };
}

beforeEach(() => {
  mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: jest.fn(() => true),
    canDismiss: jest.fn(() => true),
  };
  mockSearchParams = {};
  sessionStore.reset();
  sessionStore.dispatch({ type: 'BOOTSTRAP_FOUND_SESSION' });
});

/* ------------------------------------------------------------------ Page 18d */

describe('`228:1801` Address edit — back returns to the list (task §5, §15)', () => {
  function renderList() {
    return renderWithRuntime(<SavedAddressesRoute />, {
      runtime: createTestRuntime({
        api: createStubApi({ ...DEFAULT_API_STUBS, 'GET /v1/me/bookings/active': () => [] }),
      }),
    });
  }

  /**
   * `18d` is a SHEET over `68:214`, not a screen of its own — the frame draws it over a dimmed
   * list. "Back arrow -> Page 18 Saved addresses" is therefore satisfied by dismissing it, and
   * what has to be true is that nothing NAVIGATES: a router call here would take the customer off
   * the list the sheet is sitting on.
   */
  it('closes the sheet and stays on Page 18', async () => {
    renderList();
    await screen.findByTestId('saved-addresses-screen');

    fireEvent.press(screen.getByTestId('address-row-menu-addr-1'));
    expect(await screen.findByTestId('address-edit-action')).toBeTruthy();

    fireEvent.press(screen.getByTestId('address-edit-sheet-back'));

    await waitFor(() => expect(screen.queryByTestId('address-edit-action')).toBeNull());
    expect(screen.getByTestId('saved-addresses-screen')).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------ payment -> Page 21 -> Home */

describe('`433:2290` Page 21 — payment, then the SERVER (task §9, §10)', () => {
  /**
   * Razorpay returning is not a booking. A verified payment goes to Page 21, which waits on the
   * backend; anything else has no confirmation to wait for and goes to the booking screen, where
   * the hold is visible and still payable.
   */
  function renderConfirming(status: string) {
    mockSearchParams = { id: 'bk-1' };
    return renderWithRuntime(<BookingConfirmingRoute />, {
      runtime: createTestRuntime({
        api: createStubApi({
          ...DEFAULT_API_STUBS,
          'GET /v1/bookings/bk-1': () => ({ booking: bookingWith({ status }) }),
        }),
      }),
    });
  }

  it('holds while the booking is still `created`', async () => {
    renderConfirming('created');

    expect(await screen.findByTestId('confirmation-loading')).toBeTruthy();

    // Give the poll several turns. The screen must NOT leave on its own.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('goes to Home once the server has moved the booking on', async () => {
    renderConfirming('assigned');

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
    // The stack is collapsed first, so back from Home is a root and not the sheet booked from.
    expect(mockRouter.dismissAll).toHaveBeenCalled();
  });

  /**
   * A booking the server CANCELLED is an answer too, and Home is entitled to show it. Holding a
   * spinner over a cancellation would be the app refusing to report bad news.
   */
  it('goes to Home on a cancellation rather than waiting forever', async () => {
    renderConfirming('cancelled');

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
  });

  /** A read that failed is not a reason to hold a customer on a screen with no controls. */
  it('goes to Home when the booking cannot be read at all', async () => {
    mockSearchParams = { id: 'bk-1' };
    renderWithRuntime(<BookingConfirmingRoute />, {
      runtime: createTestRuntime({
        api: createStubApi({
          ...DEFAULT_API_STUBS,
          'GET /v1/bookings/bk-1': () => {
            throw new Error('offline');
          },
        }),
      }),
    });

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
  });
});

/* --------------------------------------------------- service back buttons -> Home */

describe('service lifecycle — every back button goes Home (task §11)', () => {
  /**
   * "all these back buttons take the user to the home page".
   *
   * One route renders every lifecycle state, so the states are driven by the SERVER payload and
   * the same assertion is made against each: Home, deterministically, on a stack that could pop.
   * Popping is specifically wrong here — the booking advances underneath the customer, so a stack
   * entry can describe a state the booking has already left.
   */
  const STATES = [
    ['confirmed', { status: 'assigned' }],
    ['reassigned', { status: 'assigned', reassigned: true }],
    ['arriving', { status: 'cook_en_route' }],
    ['arrived', { status: 'cook_arrived' }],
    ['in service', { status: 'cooking' }],
    ['auto-cancelled', { status: 'cancelled', cancelledBy: 'system' }],
  ] as const;

  it.each(STATES)('%s backs out to Home', async (_name, overrides) => {
    mockSearchParams = { id: 'bk-1' };
    renderWithRuntime(<BookingRoute />, {
      runtime: createTestRuntime({
        api: createStubApi({
          ...DEFAULT_API_STUBS,
          'GET /v1/bookings/bk-1': () => ({ booking: bookingWith(overrides) }),
          'GET /v1/bookings/bk-1/tracking': () => ({
            status: 'ok',
            etaMinutes: 12,
            refreshAfterSeconds: 30,
          }),
        }),
      }),
    });

    fireEvent.press(await screen.findByTestId('booking-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });
});

/* ------------------------------------------------------------- Page 4a Instant */

describe('`1:728` Page 4a Instant — the arrow returns to Home (task §13)', () => {
  /**
   * `4a` is drawn as a full frame but presented as a SHEET over Home, which is what the design
   * shows and what makes "the arrow goes to Home" true by construction: closing the sheet reveals
   * the screen underneath, and that screen is Home. What must be true is that nothing navigates —
   * a router call would take the customer somewhere Home is not.
   */
  it('closes back onto Home without navigating', async () => {
    renderWithRuntime(<HomeRoute />, {
      runtime: createTestRuntime({
        api: createStubApi({ ...DEFAULT_API_STUBS, 'GET /v1/me/bookings/active': () => [] }),
      }),
    });

    fireEvent.press(await screen.findByTestId('home-tile-instant'));
    fireEvent.press(await screen.findByTestId('instant-sheet-back'));

    /**
     * The sheet plays an exit animation before it unmounts, so what is asserted is the thing the
     * comment is actually about: NOTHING NAVIGATED. Home is still the screen, so the arrow has
     * already arrived where the founder says it should — there is nowhere else to go.
     */
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------- carousel */

describe('`378:189` + `406:1325` — the carousel is nine cards in the founder order (task §16)', () => {
  /**
   * V7 adds `406:1325` "assist", which sits OUTSIDE the `378:189` grid and was missing entirely.
   *
   * The order is the founder's, resolved card-by-card against the ARTWORK rather than the frame
   * names — "roti" is the card that reads "You deserve to eat it hot!", "mealprep" is "Sorted for
   * days!". The ids are asserted rather than the labels so a copy fix does not fail this, but the
   * labels are checked to be present so an id cannot silently point at the wrong picture.
   */
  it('is exactly the nine cards, in order', () => {
    expect(HOME_USECASE_SLIDES.map((slide) => slide.id)).toEqual([
      'snacks',
      'absent',
      'tiffin',
      'assist',
      'guests',
      'drysnacks',
      'breakfast',
      'roti',
      'mealprep',
    ]);
  });

  it('carries the artwork transcription each id promises', () => {
    const byId = new Map(HOME_USECASE_SLIDES.map((slide) => [slide.id, slide.label]));

    expect(byId.get('snacks')).toContain('Crave guilt free');
    expect(byId.get('absent')).toContain('Cook absent');
    expect(byId.get('tiffin')).toContain('Sleep for longer');
    expect(byId.get('assist')).toContain("don't have to do it all");
    expect(byId.get('guests')).toContain('Tension free gatherings');
    expect(byId.get('drysnacks')).toContain('Munch as much as you want');
    expect(byId.get('breakfast')).toContain('Breakfast only when required');
    expect(byId.get('roti')).toContain('You deserve to eat it hot');
    expect(byId.get('mealprep')).toContain('Sorted for days');
  });

  it('gives every card a distinct artwork', () => {
    const sources = HOME_USECASE_SLIDES.map((slide) => slide.source);
    expect(new Set(sources).size).toBe(HOME_USECASE_SLIDES.length);
  });
});
