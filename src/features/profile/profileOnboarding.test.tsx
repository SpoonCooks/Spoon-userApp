import { BackHandler } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';

import BootGate from '@/app/index';
import ProfileDetailsRoute from '@/app/(app)/profile/details';
import { sessionStore } from '@core/store';

/**
 * V8 profile onboarding — `338:4508` "Page 17- profile" and the flow around it.
 *
 * The founder's first-run sequence is Login -> OTP -> **Profile details** -> Address -> Home, and
 * the page is NON-SKIPPABLE. Both halves of that are load-bearing and neither is visible from a
 * screenshot, so they are asserted here: the order the boot gate produces, and the fact that
 * nothing on the screen or on the device lets a first-run customer past it without saving.
 *
 * The router is mocked for the same reason `navigation.test.tsx` mocks it — a real navigator needs
 * the whole app mounted, and what matters is which router METHOD each path reaches and with what.
 */

let mockRouter: {
  push: jest.Mock;
  back: jest.Mock;
  replace: jest.Mock;
  dismissAll: jest.Mock;
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

const ME_INCOMPLETE = {
  id: 'user-1',
  role: 'user',
  status: 'active',
  phone: '+919876543210',
  name: null,
  householdStructure: null,
  mealStructure: null,
  pressingIssue: null,
  dietaryPreference: null,
  grownUpEating: null,
  regionPreference: null,
  genderPreference: null,
  profileComplete: false,
};

const ME_COMPLETE = { ...ME_INCOMPLETE, name: 'Aarav Mehta', profileComplete: true };

beforeEach(() => {
  mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
    canGoBack: jest.fn(() => true),
    canDismiss: jest.fn(() => true),
  };
  mockSearchParams = {};
  mockRedirected = [];
  jest.clearAllMocks();
});

function runtimeWith(handlers: Record<string, (body: unknown) => unknown>) {
  return createTestRuntime({ api: createStubApi({ ...DEFAULT_API_STUBS, ...handlers }) });
}

/** Fills the three starred fields, which is the whole of what the CTA gate asks for. */
/**
 * What `PUT /v1/me/profile` answers with: the committed projection, not an echo of the request.
 *
 * Every stub goes through this rather than returning `{ name }`, because the response schema is
 * the same `ProfileData` `GET /v1/me` embeds — a partial reply would fail to parse, which is
 * exactly the regression this helper keeps a test honest about.
 */
function savedProfile(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Aarav Mehta',
    householdStructure: null,
    mealStructure: 'daily-cook-1x',
    pressingIssue: null,
    dietaryPreference: 'vegetarian',
    grownUpEating: [],
    regionPreference: null,
    genderPreference: null,
    profileComplete: true,
    ...overrides,
  };
}

/**
 * The body `completeMandatoryFields` produces.
 *
 * All eight keys, every time. The five untouched optionals travel as the `null` / `''` / `[]`
 * the prefill put in them, which is what makes "submitting everything" safe: an answer nobody
 * edited round-trips its own value instead of being omitted and hoped for.
 */
const MANDATORY_ONLY_PAYLOAD = {
  name: 'Aarav Mehta',
  householdStructure: null,
  mealStructure: 'daily-cook-1x',
  pressingIssue: null,
  dietaryPreference: 'vegetarian',
  grownUpEating: [],
  regionPreference: null,
  genderPreference: null,
};

async function completeMandatoryFields() {
  fireEvent.changeText(screen.getByTestId('profile-name'), 'Aarav Mehta');
  fireEvent.press(screen.getByTestId('profile-meal-structure-daily-cook-1x'));
  fireEvent.press(screen.getByTestId('profile-dietary-vegetarian'));
}

/* ------------------------------------------------------------------ 1, 15: the boot order */

describe('the boot gate (task §14)', () => {
  /**
   * The session machine starts at `bootstrapping`, where the gate correctly HOLDS on the splash
   * rather than guessing. These tests are about what it does once the session has SETTLED, so it
   * is settled here — the same setup `navigation.test.tsx` uses.
   */
  beforeEach(() => {
    sessionStore.reset();
    sessionStore.dispatch({ type: 'BOOTSTRAP_FOUND_SESSION' });
  });

  afterEach(() => {
    sessionStore.reset();
  });

  /** Test 1 — a new authenticated customer reaches Profile details BEFORE the address flow. */
  it('sends an authenticated customer with an incomplete profile to Profile details, not Address', async () => {
    renderWithRuntime(<BootGate />, {
      runtime: runtimeWith({
        'GET /v1/me': () => ME_INCOMPLETE,
        'GET /v1/me/addresses': () => [],
      }),
    });

    await waitFor(() => expect(mockRedirected.length).toBeGreaterThan(0));

    expect(mockRedirected[mockRedirected.length - 1]).toBe('/profile/details?context=onboarding');
    // The address step is NOT reached first, even though this account has no address either.
    expect(mockRedirected).not.toContain('/address/location?onboarding=1');
  });

  /** The next step in the sequence, once the profile is answered. */
  it('sends a complete profile with no address to the address flow', async () => {
    renderWithRuntime(<BootGate />, {
      runtime: runtimeWith({
        'GET /v1/me': () => ME_COMPLETE,
        'GET /v1/me/addresses': () => [],
      }),
    });

    await waitFor(() => expect(mockRedirected).toContain('/address/location?onboarding=1'));
    expect(mockRedirected).not.toContain('/profile/details?context=onboarding');
  });

  /** And the settled case. */
  it('sends a complete profile with a saved address to Home', async () => {
    renderWithRuntime(<BootGate />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_COMPLETE }),
    });

    await waitFor(() => expect(mockRedirected).toContain('/home'));
  });

  /**
   * NO FLICKER (task §14).
   *
   * While either gate is resolving the boot screen holds the splash and redirects NOWHERE. That is
   * the whole anti-flicker mechanism: if it redirected to Home first and corrected itself later,
   * the customer would see Home's carousel for the length of a round trip before it was replaced.
   */
  it('redirects nowhere at all while the gates are still resolving', () => {
    renderWithRuntime(<BootGate />, {
      runtime: runtimeWith({
        'GET /v1/me': () => ME_INCOMPLETE,
        'GET /v1/me/addresses': () => [],
      }),
    });

    expect(mockRedirected).toEqual([]);
    expect(screen.getByTestId('splash-loading')).toBeTruthy();
  });
});

/* ---------------------------------------------------- 2, 3, 4, 5, 6, 16: the page itself */

describe('the profile-details page (338:4508)', () => {
  /** Test 2 + 16 — non-skippable: no drawn escape, and no hardware one either. */
  it('draws no back control in the first-run context', async () => {
    mockSearchParams = { context: 'onboarding' };

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE }),
    });

    await screen.findByTestId('profile-details-header');
    expect(screen.queryByTestId('profile-details-header-back')).toBeNull();
  });

  it('draws a back control in the edit context', async () => {
    mockSearchParams = {};

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_COMPLETE }),
    });

    expect(await screen.findByTestId('profile-details-header-back')).toBeTruthy();
  });

  /**
   * Test 16 — Android's hardware back cannot bypass first-run onboarding.
   *
   * The handler returning `true` means "handled": the navigator never sees the press, so the stack
   * is not popped and the OS does not finish the activity. In the EDIT context it returns `false`
   * and back behaves exactly as it does everywhere else.
   */
  it('swallows Android back during onboarding and lets it through when editing', async () => {
    const spy = jest.spyOn(BackHandler, 'addEventListener');

    mockSearchParams = { context: 'onboarding' };
    const onboarding = renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE }),
    });
    await screen.findByTestId('profile-details-header');

    const onboardingHandler = spy.mock.calls.at(-1)?.[1] as () => boolean;
    expect(onboardingHandler()).toBe(true);

    onboarding.unmount();
    spy.mockClear();

    mockSearchParams = {};
    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_COMPLETE }),
    });
    await screen.findByTestId('profile-details-header');

    const editHandler = spy.mock.calls.at(-1)?.[1] as () => boolean;
    expect(editHandler()).toBe(false);

    spy.mockRestore();
  });

  /** Test 3 — a missing REQUIRED field holds Confirm, visually and functionally. */
  it('keeps Confirm disabled until every starred field is answered', async () => {
    mockSearchParams = { context: 'onboarding' };
    const put = jest.fn(() => savedProfile());

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE, 'PUT /v1/me/profile': put }),
    });

    const cta = await screen.findByTestId('profile-details-submit');
    expect(cta.props.accessibilityState.disabled).toBe(true);

    // A press on the disabled bar must reach NOTHING — no write, no navigation.
    fireEvent.press(cta);
    expect(put).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    // Two of three is still not three.
    fireEvent.changeText(screen.getByTestId('profile-name'), 'Aarav Mehta');
    fireEvent.press(screen.getByTestId('profile-meal-structure-daily-cook-1x'));
    expect(screen.getByTestId('profile-details-submit').props.accessibilityState.disabled).toBe(
      true,
    );

    fireEvent.press(screen.getByTestId('profile-dietary-vegetarian'));
    expect(screen.getByTestId('profile-details-submit').props.accessibilityState.disabled).toBe(
      false,
    );
  });

  /** Whitespace is not an answer — `'   '` can neither clear the gate nor be saved. */
  it('does not accept a whitespace-only name', async () => {
    mockSearchParams = { context: 'onboarding' };

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE }),
    });

    await screen.findByTestId('profile-name');
    fireEvent.changeText(screen.getByTestId('profile-name'), '   ');
    fireEvent.press(screen.getByTestId('profile-meal-structure-daily-cook-1x'));
    fireEvent.press(screen.getByTestId('profile-dietary-vegetarian'));

    expect(screen.getByTestId('profile-details-submit').props.accessibilityState.disabled).toBe(
      true,
    );
  });

  /** Test 4 — the five UNSTARRED fields never block progression. */
  it('enables Confirm with every optional field left empty', async () => {
    mockSearchParams = { context: 'onboarding' };

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE }),
    });

    await screen.findByTestId('profile-name');
    await completeMandatoryFields();

    expect(screen.getByTestId('profile-details-submit').props.accessibilityState.disabled).toBe(
      false,
    );
    // Nothing optional was touched.
    expect(screen.queryByTestId('profile-grown-up-chips')).toBeNull();
  });

  /** Test 5 — `341:4655` is genuinely multi-select. */
  it('holds several grown-up-eating values at once', async () => {
    mockSearchParams = { context: 'onboarding' };

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE }),
    });

    const entry = await screen.findByTestId('profile-grown-up-entry');
    for (const cuisine of ['Rajasthani food', 'Bihari food', 'Odiya food']) {
      fireEvent.changeText(entry, cuisine);
      fireEvent(entry, 'submitEditing');
    }

    expect(screen.getByTestId('profile-grown-up-Rajasthani food')).toBeTruthy();
    expect(screen.getByTestId('profile-grown-up-Bihari food')).toBeTruthy();
    expect(screen.getByTestId('profile-grown-up-Odiya food')).toBeTruthy();
  });

  /** Test 6 — removing one chip leaves the others alone. */
  it('removes one grown-up-eating value without clearing the rest', async () => {
    mockSearchParams = { context: 'onboarding' };

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE }),
    });

    const entry = await screen.findByTestId('profile-grown-up-entry');
    for (const cuisine of ['Rajasthani food', 'Bihari food', 'Odiya food']) {
      fireEvent.changeText(entry, cuisine);
      fireEvent(entry, 'submitEditing');
    }

    fireEvent.press(screen.getByTestId('profile-grown-up-Bihari food'));

    expect(screen.queryByTestId('profile-grown-up-Bihari food')).toBeNull();
    expect(screen.getByTestId('profile-grown-up-Rajasthani food')).toBeTruthy();
    expect(screen.getByTestId('profile-grown-up-Odiya food')).toBeTruthy();
  });

  /** A single-select group takes ONE answer, and swapping does not accumulate. */
  it('keeps the single-select groups single', async () => {
    mockSearchParams = { context: 'onboarding' };

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE }),
    });

    await screen.findByTestId('profile-dietary-vegan');
    fireEvent.press(screen.getByTestId('profile-dietary-vegan'));
    expect(screen.getByTestId('profile-dietary-vegan').props.accessibilityState.selected).toBe(
      true,
    );

    fireEvent.press(screen.getByTestId('profile-dietary-vegetarian'));
    expect(screen.getByTestId('profile-dietary-vegan').props.accessibilityState.selected).toBe(
      false,
    );
    expect(screen.getByTestId('profile-dietary-vegetarian').props.accessibilityState.selected).toBe(
      true,
    );
  });
});

/* --------------------------------------------------- 7, 8, 11, 12, 13, 14, 15: save + flow */

describe('saving (task §7, §10, §12)', () => {
  /** Test 7 — first-run Confirm saves, THEN opens `53:31` in the first-run flow context. */
  it('saves and then opens Address 18a on a first run', async () => {
    mockSearchParams = { context: 'onboarding' };
    const put = jest.fn(() => savedProfile());

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({
        'GET /v1/me': () => ME_INCOMPLETE,
        'GET /v1/me/addresses': () => [],
        'PUT /v1/me/profile': put,
      }),
    });

    await screen.findByTestId('profile-name');
    await completeMandatoryFields();
    fireEvent.press(screen.getByTestId('profile-details-submit'));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(MANDATORY_ONLY_PAYLOAD);
    // `onboarding=1` is what makes `53:31` draw no back control and end at Home.
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/address/location?onboarding=1'),
    );
  });

  /**
   * The case that would otherwise be a trap.
   *
   * A customer can owe the profile page while ALREADY having an address — which is every existing
   * account the day the server's completeness rule widens to V8's three starred fields. Sending
   * them to `53:31` would put them on a first-run map with no back control, asking for an address
   * they already have. Onboarding finishes at Home instead.
   */
  it('finishes at Home when the first-run customer already has an address', async () => {
    mockSearchParams = { context: 'onboarding' };
    const put = jest.fn(() => savedProfile());

    renderWithRuntime(<ProfileDetailsRoute />, {
      // DEFAULT_API_STUBS returns one saved address.
      runtime: runtimeWith({ 'GET /v1/me': () => ME_INCOMPLETE, 'PUT /v1/me/profile': put }),
    });

    await screen.findByTestId('profile-name');
    await completeMandatoryFields();
    fireEvent.press(screen.getByTestId('profile-details-submit'));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/address/location?onboarding=1');
  });

  /**
   * Test 8 — a REJECTED save keeps the customer here, with everything they typed.
   *
   * This is the case §7 is written against: advancing on a failed write would put a first-run
   * customer past a page they can never reach again, with no profile saved.
   */
  it('stays on the page when the save is rejected, and keeps the answers', async () => {
    mockSearchParams = { context: 'onboarding' };

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({
        'GET /v1/me': () => ME_INCOMPLETE,
        'PUT /v1/me/profile': () => {
          throw new Error('network down');
        },
      }),
    });

    await screen.findByTestId('profile-name');
    await completeMandatoryFields();
    fireEvent.press(screen.getByTestId('profile-details-submit'));

    await waitFor(() => expect(screen.getByTestId('profile-details-error')).toBeTruthy());

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.getByTestId('profile-name').props.value).toBe('Aarav Mehta');
    expect(screen.getByTestId('profile-dietary-vegetarian').props.accessibilityState.selected).toBe(
      true,
    );
  });

  /**
   * Test 11 + 14 — the saved name is prefilled, on an edit and after a restart alike.
   *
   * A cold start IS this test: the route mounts, reads `GET /v1/me`, and fills the form from the
   * response. There is no client-side cache in play, so "restart" and "first mount" are the same
   * code path.
   *
   * BACKEND GAP, asserted honestly rather than hidden: the other seven answers come back BLANK,
   * because `user_profiles` has no columns for them and `GET /v1/me` cannot return what was never
   * stored. This assertion documents the current contract; it flips to a real prefill the day the
   * columns exist. See `docs/FRONTEND_BACKEND_PENDING.md`.
   */
  it('prefills every saved answer on an edit', async () => {
    mockSearchParams = {};

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({
        'GET /v1/me': () => ({
          ...ME_COMPLETE,
          householdStructure: 'bachelors',
          mealStructure: 'daily-cook-1x',
          pressingIssue: 'My cook never varies the menu.',
          dietaryPreference: 'vegetarian',
          grownUpEating: ['Rajasthani food', 'Bihari food'],
          regionPreference: 'my-state',
          genderPreference: 'male',
        }),
      }),
    });

    await waitFor(() => expect(screen.getByTestId('profile-name').props.value).toBe('Aarav Mehta'));
    expect(screen.getByTestId('profile-pressing-issue').props.value).toBe(
      'My cook never varies the menu.',
    );

    for (const optionId of [
      'profile-household-bachelors',
      'profile-meal-structure-daily-cook-1x',
      'profile-dietary-vegetarian',
      'profile-region-my-state',
      'profile-gender-male',
    ]) {
      expect(screen.getByTestId(optionId).props.accessibilityState.selected).toBe(true);
    }

    // The MULTI-select restores every chip the customer added, in the stored order.
    expect(screen.getByTestId('profile-grown-up-chips')).toBeTruthy();
    expect(screen.getByTestId('profile-grown-up-Rajasthani food')).toBeTruthy();
    expect(screen.getByTestId('profile-grown-up-Bihari food')).toBeTruthy();
  });

  /**
   * `null` and `[]` are different facts on the wire; neither is a chip on the screen.
   *
   * The display collapse is asserted here so it cannot quietly become a two-way one — sending
   * `null` for an emptied chip row would tell the server the customer never answered.
   */
  it('opens an unanswered questionnaire blank without inventing selections', async () => {
    mockSearchParams = {};

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_COMPLETE }),
    });

    await waitFor(() => expect(screen.getByTestId('profile-name').props.value).toBe('Aarav Mehta'));

    for (const optionId of [
      'profile-household-bachelors',
      'profile-meal-structure-daily-cook-1x',
      'profile-dietary-vegetarian',
      'profile-region-my-state',
      'profile-gender-male',
    ]) {
      expect(screen.getByTestId(optionId).props.accessibilityState.selected).toBe(false);
    }
    expect(screen.queryByTestId('profile-grown-up-chips')).toBeNull();
  });

  /** Test 12 + 15 — an EDIT returns to Page 16 and never enters the address flow. */
  it('returns to Profile after an edit, and never diverts to Address', async () => {
    mockSearchParams = {};
    const put = jest.fn(() => savedProfile({ name: 'Rekha S' }));

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({ 'GET /v1/me': () => ME_COMPLETE, 'PUT /v1/me/profile': put }),
    });

    await screen.findByTestId('profile-name');
    fireEvent.changeText(screen.getByTestId('profile-name'), 'Rekha S');
    fireEvent.press(screen.getByTestId('profile-meal-structure-daily-cook-1x'));
    fireEvent.press(screen.getByTestId('profile-dietary-vegetarian'));
    fireEvent.press(screen.getByTestId('profile-details-submit'));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith({ ...MANDATORY_ONLY_PAYLOAD, name: 'Rekha S' }),
    );
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/profile'));

    expect(mockRouter.replace).not.toHaveBeenCalledWith('/address/location?onboarding=1');
  });

  /**
   * Test 13 — "sync with page 16".
   *
   * The mechanism is the mutation's invalidation of `auth.me`: Page 16 reads that key, so a
   * successful save makes it re-read rather than render a cached verdict. Asserted at the
   * transport, which is where the refetch is observable — a second `GET /v1/me` after the `PUT`.
   */
  it('re-reads the identity after a save so Page 16 cannot show a stale verdict', async () => {
    mockSearchParams = {};
    const get = jest.fn(() => ME_COMPLETE);

    renderWithRuntime(<ProfileDetailsRoute />, {
      runtime: runtimeWith({
        'GET /v1/me': get,
        'PUT /v1/me/profile': () => savedProfile({ name: 'Rekha S' }),
      }),
    });

    await screen.findByTestId('profile-name');
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    fireEvent.changeText(screen.getByTestId('profile-name'), 'Rekha S');
    fireEvent.press(screen.getByTestId('profile-meal-structure-daily-cook-1x'));
    fireEvent.press(screen.getByTestId('profile-dietary-vegetarian'));
    fireEvent.press(screen.getByTestId('profile-details-submit'));

    await waitFor(() => expect(get.mock.calls.length).toBeGreaterThan(1));
  });
});
