import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AppState } from 'react-native';
import type { ReactNode } from 'react';

import { RuntimeProvider } from '@core/runtimeContext';
import { createStubApi, createTestRuntime } from '@/test/renderWithRuntime';

import { useAddressLocation } from './useAddressLocation';
import type { ConfirmOutcome } from './useAddressLocation';

/**
 * Location acquisition must happen ONCE per intended entry to `53:31`.
 *
 * ## The defect these lock down
 *
 * Measured on the handset: a SINGLE mount of the map screen produced 128 device-location
 * resolutions and was still climbing when the capture stopped. The chain was
 *
 *   AppState emits 'active'  ->  `locate()`  ->  `attempt` changes  ->  the effect re-runs
 *     ->  its cleanup cancels the fix already in flight  ->  that fix returns, sees it was
 *         cancelled, and skips `select`  ->  `latestPoint` is never set  ->  the listener's
 *         "nothing to lose" guard never engages  ->  the next 'active' repeats it.
 *
 * Android re-emitted 'active' about eight times a second while the app was ALREADY foreground,
 * so this ran continuously behind "Finding your location…". Two things closed it, and both are
 * asserted below: the resolution is single-flight (never cancelled and restarted), and the
 * listener acts on a background -> foreground EDGE rather than on every 'active'.
 *
 * The other half is §5: a point the CUSTOMER placed must survive a device fix that lands later.
 */

jest.mock('./googlePlaces', () => ({
  createSessionToken: () => 'test-session',
  placesAutocomplete: jest.fn(async () => ({ ok: true, value: [] })),
  placeDetails: jest.fn(async () => ({ ok: false, reason: 'error' })),
  googleReverseGeocode: jest.fn(async () => ({ ok: false, reason: 'error' })),
}));

const mocked = Location as jest.Mocked<typeof Location>;

/** The device chain always starts by asking for permission, so this counts resolutions. */
const resolutions = () => mocked.requestForegroundPermissionsAsync.mock.calls.length;

const DEVICE_POINT = { latitude: 28.6304, longitude: 77.2777 };
const USER_POINT = { latitude: 12.9611, longitude: 77.6387 };

let appStateListener: ((status: string) => void) | undefined;

/** The server's answer to the one serviceability call Confirm makes. Reset before each test. */
let verdict: { status: string } = { status: 'serviceable' };

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  const runtime = createTestRuntime({
    api: createStubApi({ 'POST /v1/serviceability/check': () => verdict }),
  });
  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>{children}</RuntimeProvider>
    </QueryClientProvider>
  );
}

/** Lets a pending promise settle and React apply the state it produced. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  appStateListener = undefined;
  verdict = { status: 'serviceable' };

  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _type: string,
    handler: (status: string) => void,
  ) => {
    appStateListener = handler;
    return { remove: jest.fn() };
  }) as never);

  mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
  mocked.hasServicesEnabledAsync.mockResolvedValue(true);
  mocked.getLastKnownPositionAsync.mockResolvedValue({ coords: DEVICE_POINT } as never);
  mocked.reverseGeocodeAsync.mockResolvedValue([] as never);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('device location acquisition', () => {
  it('resolves exactly once on the initial mount', async () => {
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    expect(resolutions()).toBe(1);
    expect(result.current.coordinates).toEqual(DEVICE_POINT);
  });

  it('does not re-acquire when the hook re-renders', async () => {
    const { rerender } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    rerender({});
    rerender({});
    await flush();

    expect(resolutions()).toBe(1);
  });

  it('does not re-acquire when the reverse geocode resolves', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([
      { name: 'Laxmi Nagar', street: 'Vikas Marg', city: 'Delhi', postalCode: '110092' },
    ] as never);

    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();
    await flush();

    expect(result.current.geocoded?.title).toBe('Laxmi Nagar');
    expect(resolutions()).toBe(1);
  });

  it('does not re-acquire when the customer taps the map or drags the pin', async () => {
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));
    act(() => result.current.selectPoint({ latitude: 12.97, longitude: 77.64 }));
    await flush();

    expect(resolutions()).toBe(1);
    expect(result.current.coordinates).toEqual({ latitude: 12.97, longitude: 77.64 });
  });

  it('does not re-acquire when a Places suggestion is chosen', async () => {
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.chooseSuggestion('place-id-with-no-match'));
    await flush();

    expect(resolutions()).toBe(1);
  });

  /**
   * The production loop, reproduced. Android emitted this roughly eight times a second while the
   * app was already foreground; before the edge check each one started another resolution.
   */
  it('ignores repeated "active" AppState events while already foreground', async () => {
    renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    for (let i = 0; i < 20; i += 1) {
      act(() => appStateListener?.('active'));
    }
    await flush();

    expect(resolutions()).toBe(1);
  });

  /**
   * The behaviour the listener exists for (§6): the customer left to grant permission and came
   * back. Only a real background -> foreground edge, and only while there is still no point.
   */
  it('re-asks once on a real background to foreground edge when nothing was found', async () => {
    mocked.getLastKnownPositionAsync.mockResolvedValue(null as never);
    mocked.getCurrentPositionAsync.mockRejectedValue(new Error('no fix'));

    renderHook(() => useAddressLocation(), { wrapper });
    await flush();
    expect(resolutions()).toBe(1);

    act(() => appStateListener?.('background'));
    act(() => appStateListener?.('active'));
    await flush();

    expect(resolutions()).toBe(2);
  });

  it('does not re-ask on returning to the foreground once a point exists', async () => {
    renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => appStateListener?.('background'));
    act(() => appStateListener?.('active'));
    await flush();

    expect(resolutions()).toBe(1);
  });

  /**
   * §5 — the race the generation guard exists for. The customer picked their own point while the
   * device fix was still out; the fix must not drag the red pin back to the GPS reading.
   */
  it('never lets a late device fix overwrite a manually selected pin', async () => {
    let releaseFix: (value: unknown) => void = () => undefined;
    mocked.getLastKnownPositionAsync.mockReturnValue(
      new Promise((resolve) => {
        releaseFix = resolve;
      }) as never,
    );

    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    // The customer places their own pin while the device chain is still in flight.
    act(() => result.current.selectPoint(USER_POINT));
    expect(result.current.coordinates).toEqual(USER_POINT);

    // The device fix now lands. It is a stale answer and must be discarded.
    await act(async () => {
      releaseFix({ coords: DEVICE_POINT });
      await Promise.resolve();
    });
    await flush();

    expect(result.current.coordinates).toEqual(USER_POINT);
  });

  it('ignores a device fix that lands after unmount', async () => {
    let releaseFix: (value: unknown) => void = () => undefined;
    mocked.getLastKnownPositionAsync.mockReturnValue(
      new Promise((resolve) => {
        releaseFix = resolve;
      }) as never,
    );

    const { unmount } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();
    unmount();

    // No state update may follow, and nothing may throw.
    await act(async () => {
      releaseFix({ coords: DEVICE_POINT });
      await Promise.resolve();
    });

    expect(resolutions()).toBe(1);
  });

  /**
   * §5 — Confirm asks the SERVER about a point that already exists. It has no business touching
   * the device, and a re-acquisition here would move the pin the customer just committed to.
   *
   * Both verdicts are exercised: a refusal is the branch that pushes `215:1472`, and it must be
   * as inert against the device as an approval is.
   */
  it('does not re-acquire when Confirm runs, refused or serviceable', async () => {
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));
    await flush();

    verdict = { status: 'outside_service_area' };
    let refused: ConfirmOutcome | undefined;
    await act(async () => {
      refused = await result.current.confirm();
    });
    expect(refused?.kind).toBe('refused');

    verdict = { status: 'serviceable' };
    let accepted: ConfirmOutcome | undefined;
    await act(async () => {
      accepted = await result.current.confirm();
    });
    expect(accepted?.kind).toBe('serviceable');

    expect(resolutions()).toBe(1);
    expect(result.current.coordinates).toEqual(USER_POINT);
  });

  /**
   * §9 lifecycle — "Choose another location" is a POP back onto a map that never unmounted,
   * because `215:1472` is PUSHED over it rather than replacing it. So the refusal, the return and
   * the next point all happen on ONE mount.
   *
   * The loop this rules out: refusal -> back -> the map re-acquires -> the device fix lands on the
   * same unserviceable point -> Confirm refuses again. Nothing re-acquires, and selecting clears
   * the verdict, so Confirm is live again rather than dead after one "no".
   */
  it('an outside-area refusal followed by another point does not re-acquire or loop', async () => {
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));
    verdict = { status: 'outside_service_area' };
    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.status).toBe('outside_service_area');

    // Back from `215:1472`. The pin is still the one the customer placed, not a fresh GPS fix.
    expect(result.current.coordinates).toEqual(USER_POINT);

    const another = { latitude: 12.93, longitude: 77.61 };
    act(() => result.current.selectPoint(another));
    await flush();

    expect(result.current.status).toBeNull();
    expect(result.current.canConfirm).toBe(true);
    expect(result.current.coordinates).toEqual(another);
    expect(resolutions()).toBe(1);
  });

  /**
   * §6 lifecycle: leaving the flow and coming back is a NEW entry, so it resolves again. The
   * screen owns no state across mounts, which is what makes "Choose another location" (a push,
   * not a replace) able to keep the pin the customer was looking at.
   */
  it('resolves once again on a fresh mount, and only once', async () => {
    const first = renderHook(() => useAddressLocation(), { wrapper });
    await flush();
    first.unmount();

    renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    expect(resolutions()).toBe(2);
  });
});

/**
 * The map now commits a point every time it comes to REST under the fixed pin, so a run of quick
 * pans really does put several reverse geocodes in the air at once. These lock down what happens
 * when they land out of order — the failure mode being an address for a place the customer has
 * already panned away from, sitting under a pin that is somewhere else entirely.
 */
/**
 * `53:63` — what the search field says after a suggestion is chosen.
 *
 * It used to take the suggestion's `primary` alone, which is only the first line of the two-line
 * row the customer tapped: picking "Laxmi Nagar / Delhi, India" left the box reading "Laxmi
 * Nagar" and dropped the half that disambiguates it. The pin moves to the whole place, so the
 * field states the whole place.
 */
describe('choosing a Places suggestion rewrites the query', () => {
  const suggestionsMock = jest.requireMock('./googlePlaces') as {
    placesAutocomplete: jest.Mock;
  };

  /** Types, lets the debounce fire, and returns once the predictions are on the hook. */
  async function searchFor(
    result: { current: ReturnType<typeof useAddressLocation> },
    text: string,
  ) {
    act(() => result.current.search(text));
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    await flush();
  }

  beforeEach(() => {
    jest.useFakeTimers();
    suggestionsMock.placesAutocomplete.mockResolvedValue({
      ok: true,
      value: [{ placeId: 'laxmi', primary: 'Laxmi Nagar', secondary: 'Delhi, India' }],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    suggestionsMock.placesAutocomplete.mockResolvedValue({ ok: true, value: [] });
  });

  it('states the full place — primary AND locality — not just the first line', async () => {
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    await searchFor(result, 'Laxmi naga');
    expect(result.current.query).toBe('Laxmi naga');
    expect(result.current.suggestions).toHaveLength(1);

    act(() => result.current.chooseSuggestion('laxmi'));

    expect(result.current.query).toBe('Laxmi Nagar, Delhi, India');
  });

  /** A prediction with no locality is not padded with a trailing comma. */
  it('uses the primary alone when there is no locality under it', async () => {
    suggestionsMock.placesAutocomplete.mockResolvedValue({
      ok: true,
      value: [{ placeId: 'solo', primary: 'Laxmi Nagar', secondary: '' }],
    });

    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    await searchFor(result, 'Laxmi');
    act(() => result.current.chooseSuggestion('solo'));

    expect(result.current.query).toBe('Laxmi Nagar');
  });
});

describe('settling on a point', () => {
  /**
   * Drains whatever a test left hanging. A geocode that is never resolved keeps a promise — and
   * with it the jest worker — alive after the test that made it has finished.
   */
  const outstanding: (() => void)[] = [];
  afterEach(async () => {
    const drain = outstanding.splice(0);
    if (drain.length === 0) return;
    await act(async () => {
      drain.forEach((resolve) => resolve());
      await Promise.resolve();
    });
  });

  /** A geocode whose landing this test controls. */
  function deferGeocode() {
    const pending: ((results: unknown[]) => void)[] = [];
    mocked.reverseGeocodeAsync.mockImplementation(
      (() => new Promise((resolve) => pending.push(resolve))) as never,
    );
    outstanding.push(() => pending.splice(0).forEach((resolve) => resolve([])));
    return {
      /** Land the nth outstanding call (0 = the oldest). */
      land: (index: number, name: string) =>
        pending[index]?.([{ name, city: 'Bengaluru', postalCode: '560038' }]),
      count: () => pending.length,
    };
  }

  const NEARBY = { latitude: 12.9612, longitude: 77.6388 };

  it('reports the point as resolving until its address lands', async () => {
    const geocode = deferGeocode();
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));
    expect(result.current.coordinates).toEqual(USER_POINT);
    expect(result.current.resolving).toBe(true);
    // The point is usable the instant it is selected; only its NAME is pending.
    expect(result.current.canConfirm).toBe(true);

    await act(async () => {
      geocode.land(geocode.count() - 1, 'Indiranagar');
      await Promise.resolve();
    });

    expect(result.current.resolving).toBe(false);
    expect(result.current.geocoded?.title).toBe('Indiranagar');
  });

  it('never lets an older geocode overwrite the address for a newer point', async () => {
    const geocode = deferGeocode();
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    // Two settles in quick succession — the customer flicked the map twice.
    act(() => result.current.selectPoint(USER_POINT));
    const first = geocode.count() - 1;
    act(() => result.current.selectPoint(NEARBY));
    const second = geocode.count() - 1;

    // The NEWER one answers first, then the older straggler arrives.
    await act(async () => {
      geocode.land(second, 'Domlur');
      await Promise.resolve();
    });
    await act(async () => {
      geocode.land(first, 'Indiranagar');
      await Promise.resolve();
    });

    expect(result.current.coordinates).toEqual(NEARBY);
    expect(result.current.geocoded?.title).toBe('Domlur');
    expect(result.current.resolving).toBe(false);
  });

  /**
   * Search and selection used to share one counter, so a keystroke invalidated the geocode running
   * for the pinned point: the address was fetched, discarded, and the row stayed on "Selected
   * location" for good.
   */
  it('does not let typing cancel the geocode running for the pinned point', async () => {
    const geocode = deferGeocode();
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));
    const pinned = geocode.count() - 1;

    act(() => result.current.search('koramangala'));

    await act(async () => {
      geocode.land(pinned, 'Indiranagar');
      await Promise.resolve();
    });

    expect(result.current.geocoded?.title).toBe('Indiranagar');
    expect(result.current.resolving).toBe(false);
  });

  it('keeps the point, and Confirm, when the geocoder has nothing to say', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([] as never);

    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));
    await flush();
    await flush();

    expect(result.current.geocoded).toBeNull();
    expect(result.current.resolving).toBe(false);
    expect(result.current.coordinates).toEqual(USER_POINT);
    expect(result.current.canConfirm).toBe(true);
  });

  /**
   * Confirm hands back the point it CHECKED. The route writes the address draft from that, not
   * from its own closure over render state, which the map can be a settle ahead of.
   */
  it('returns the coordinates it checked, with the address held for them', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([
      { name: 'Indiranagar', city: 'Bengaluru', postalCode: '560038' },
    ] as never);

    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));
    await flush();
    await flush();

    let outcome: ConfirmOutcome | undefined;
    await act(async () => {
      outcome = await result.current.confirm();
    });

    expect(outcome).toEqual({
      kind: 'serviceable',
      coordinates: USER_POINT,
      geocoded: expect.objectContaining({ title: 'Indiranagar', pincode: '560038' }),
    });
  });

  it('refuses a verdict for a point the map has already left', async () => {
    const { result } = renderHook(() => useAddressLocation(), { wrapper });
    await flush();

    act(() => result.current.selectPoint(USER_POINT));

    let outcome: ConfirmOutcome | undefined;
    await act(async () => {
      const pending = result.current.confirm();
      // The customer kept panning while the check was out.
      result.current.selectPoint(NEARBY);
      outcome = await pending;
    });

    expect(outcome?.kind).toBe('blocked');
    expect(result.current.coordinates).toEqual(NEARBY);
  });
});
