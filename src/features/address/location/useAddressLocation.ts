import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getLogger } from '@core/logging';

import { serviceabilityMessageFor, useServiceabilityCheck } from '../api';
import type { ServiceabilityStatus } from '../api';

import { getCurrentCoordinates, reverseGeocode } from './deviceLocation';
import type {
  DeviceCoordinates,
  DeviceLocationFailure,
  ReverseGeocodedAddress,
} from './deviceLocation';
import {
  createSessionToken,
  googleReverseGeocode,
  placeDetails,
  placesAutocomplete,
} from './googlePlaces';
import type { PlaceSuggestion } from './googlePlaces';

/**
 * The map step's real state (`53:31`) — position, search, geocode, and the server's verdict.
 *
 * ## Selection and confirmation are SEPARATE
 *
 * They used to be one operation, and that was the defect: every point — the device fix on mount,
 * a map settle under the pin, a chosen search result — ran `POST /v1/serviceability/check`, and a
 * refusal navigated the customer off the map. Exploring the map therefore cost a request per
 * gesture and could eject you from the screen for looking at the wrong side of a road.
 *
 *   SELECTING a point   ->  coordinates + reverse geocode.       LOCAL. No network decision.
 *   CONFIRMING a point  ->  POST /v1/serviceability/check.       ONE request, on the CTA.
 *
 * Reverse geocoding stays on selection because it is what the resolved row displays — the
 * customer has to be able to read where the pin is before they commit to it — and it is a display
 * concern that decides nothing. Serviceability decides everything, so it waits for the press that
 * means "this one".
 *
 * The SERVER decides serviceability; this hook only carries the coordinates there and reports the
 * answer. Nothing here evaluates coverage, and no coordinate is ever defaulted, invented or
 * remembered from a previous session — a wrong coordinate sends a cook to the wrong door.
 *
 * ## Three sources, one selection
 *
 * A device fix, a chosen search result and the map coming to rest under the pin are the same
 * event: "the point is now this". They all run `select`, so the geocode can never be out of step
 * with the pin, and any verdict already obtained is DISCARDED — a verdict describes one coordinate
 * and nothing else.
 *
 * A monotonic selection id guards the races that follow, and it matters most for the third source:
 * the map commits a point every time it stops moving, so several reverse geocodes really are in
 * flight at once during a run of quick pans, and a slow one for an abandoned point must never
 * overwrite the address for the point the customer is actually looking at.
 *
 * ## Why it holds no view model
 *
 * It returns FACTS, and `data.ts` composes them with the screen's static copy. That is the
 * feature's existing seam and the only place development fixtures may be imported.
 */

/**
 * FIGMA_PENDING — the design draws no permission or failure state on `53:31`.
 *
 * These share the `63:780` helper pill, which is drawn 247pt wide and does not grow. Measured on
 * the handset, anything past roughly forty characters is CLIPPED mid-word with no ellipsis, so
 * each line is written to fit that pill rather than to read well in isolation. Every one of them
 * also names the escape route, because search now produces a point without any location permission
 * at all — a denial is no longer a dead end.
 */
const FAILURE_MESSAGE: Record<DeviceLocationFailure, string> = {
  permission_denied: 'Allow location, or search above',
  services_disabled: 'Turn on location, or search above',
  unavailable: 'No location fix — search above',
};

/**
 * FIGMA_PENDING — `53:31` draws no state for "we could not ask". Written to the same 247pt pill.
 *
 * It names RETRY rather than a cause: the customer pressed Confirm and got no answer, and the only
 * useful next action is to press it again. Reporting it as "unserviceable" would be this client
 * asserting coverage it was never told about.
 */
const CONFIRM_ERROR_MESSAGE = 'Couldn’t check just now — try again';

/** What the search field is currently able to say. */
export type AddressSearchState =
  | 'idle'
  | 'searching'
  | 'results'
  /** Google answered and matched nothing. */
  | 'empty'
  /** Offline, timed out, or Google refused. */
  | 'error'
  /** No Maps key in this build — search is off, and says so rather than looking broken. */
  | 'unconfigured';

/**
 * What pressing Confirm produced. The ROUTE turns this into navigation; the hook never does.
 *
 * `refused` carries the server's own status so the route can distinguish "not here" from "not
 * right now" — `215:1472` is a coming-soon screen, and sending a temporary outage to it would tell
 * the customer something false about where they live.
 */
export type ConfirmOutcome =
  /**
   * Carries the exact point that was CHECKED, and the address held for it at that moment.
   *
   * The route must not read them back off render state: the map now commits a coordinate on every
   * settle, so the closure that raised Confirm can be a render behind the pin. Reading `latitude`
   * from a stale closure and sending `latitude` from a ref is how an address gets saved at a
   * coordinate the server never approved — the cook goes to the wrong door.
   */
  | {
      readonly kind: 'serviceable';
      readonly coordinates: DeviceCoordinates;
      readonly geocoded: ReverseGeocodedAddress | null;
    }
  | { readonly kind: 'refused'; readonly status: ServiceabilityStatus }
  /** No point to check, or a check already in flight. Nothing happened; nothing should move. */
  | { readonly kind: 'blocked' }
  /** Offline, timed out, or the server errored. The customer stays on the map. */
  | { readonly kind: 'error' };

export interface AddressLocationState {
  /** The point in play, or null while there is none. */
  readonly coordinates: DeviceCoordinates | null;
  /** The geocoder's reading of that point — display and prefill only, never authoritative. */
  readonly geocoded: ReverseGeocodedAddress | null;
  /** The SERVER's verdict for the CONFIRMED coordinates, or null until Confirm has answered. */
  readonly status: ServiceabilityStatus | null;
  /**
   * The one message slot: a device failure, or the server's answer for the point last confirmed.
   * Selecting a new point clears it, because it described the old one.
   */
  readonly message: string | undefined;
  /** The device fix, or a chosen suggestion's details, is still resolving. */
  readonly locating: boolean;
  /**
   * A reverse geocode for the CURRENT point is still out.
   *
   * Distinct from `locating`, which means "we do not know where the customer is". Here the point
   * is known and framed under the pin; only its NAME is missing. The resolved row needs the
   * difference because the map now settles on a new point every time the customer stops panning,
   * and the alternative — leaving the previous point's line up, or falling back to the screen's
   * static copy — puts an address under the pin that the pin is not on.
   */
  readonly resolving: boolean;
  /** Re-runs the device chain. Also the retry for a denied permission. */
  readonly locate: () => void;
  /** `53:33` — the map settled under the fixed pin, or the customer picked a search result. LOCAL. */
  readonly selectPoint: (coordinates: DeviceCoordinates) => void;
  /** The CTA's own pending state. Never a screen-level loader (task §7). */
  readonly confirming: boolean;
  /** True when there is a valid point and no check is in flight. */
  readonly canConfirm: boolean;
  /** `53:59` — asks the SERVER about the selected point. The only serviceability call. */
  readonly confirm: () => Promise<ConfirmOutcome>;
  /** `53:63` — the search field. */
  readonly query: string;
  readonly suggestions: readonly PlaceSuggestion[];
  readonly searchState: AddressSearchState;
  readonly search: (text: string) => void;
  readonly chooseSuggestion: (placeId: string) => void;
  readonly dismissSuggestions: () => void;
}

/** Keystrokes are billable; this is the pause that separates typing from searching. */
const SEARCH_DEBOUNCE_MS = 350;

export function useAddressLocation(): AddressLocationState {
  const check = useServiceabilityCheck();

  const [coordinates, setCoordinates] = useState<DeviceCoordinates | null>(null);
  const [geocoded, setGeocoded] = useState<ReverseGeocodedAddress | null>(null);
  const [status, setStatus] = useState<ServiceabilityStatus | null>(null);
  const [failure, setFailure] = useState<DeviceLocationFailure | null>(null);
  const [confirmError, setConfirmError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // True from the first render: arriving at this screen IS the request to place a pin, so the
  // chain below runs on mount and the screen should say so before the first await resolves.
  const [locating, setLocating] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<readonly PlaceSuggestion[]>([]);
  const [searchState, setSearchState] = useState<AddressSearchState>('idle');

  /**
   * Only the newest SELECTION may write geocode state. Everything older is a stale answer.
   *
   * This is what makes a fast sequence of drags safe: each settle takes a higher id, and a geocode
   * that returns for a point the customer has already panned away from finds `current()` false and
   * writes nothing. It matters far more now than it did — the map commits a point every time it
   * comes to rest, so several geocodes really are in flight at once.
   */
  const selectionId = useRef(0);
  /**
   * SEARCH's own counter, deliberately separate from `selectionId`.
   *
   * They used to share one. Typing therefore invalidated a reverse geocode that was still out for
   * the pinned point, so the resolved row could sit on "Selected location" for a point whose
   * address had already arrived and been discarded — and, now that a geocode has a visible
   * pending state, would have left that state stuck on for good.
   */
  const searchId = useRef(0);
  /** Autocomplete + the Details call that follows are ONE billable session while they share this. */
  const sessionToken = useRef(createSessionToken());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  /** Read inside async work without making it a dependency of every callback. */
  const latestPoint = useRef<DeviceCoordinates | null>(null);
  /**
   * The address held for `latestPoint`, mirrored out of render state.
   *
   * `confirm` reports both together, and it has to read them from the same instant: the pin's
   * coordinate and the row's address describing two different places is how a saved address ends
   * up with one street's name and another street's location.
   */
  const latestGeocoded = useRef<ReverseGeocodedAddress | null>(null);
  /** Guards a double press: the second one must not start a second check. */
  const confirmInFlight = useRef(false);
  /**
   * SINGLE-FLIGHT for the device chain. One resolution owns a screen entry; a later trigger
   * joins it rather than replacing it. See the effect below for the loop this closes.
   */
  const resolveInFlight = useRef(false);
  /**
   * Bumped by every point the CUSTOMER places - a pan that came to rest under the pin, a chosen
   * Places result. A device fix that lands after one of those answers a question nobody is asking
   * any more, and must not drag the ground out from under them.
   */
  const userPointGeneration = useRef(0);
  /** The last AppState seen, so only a REAL background -> foreground edge can re-ask. */
  const lastAppState = useRef(AppState.currentState);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (debounce.current !== null) clearTimeout(debounce.current);
    };
  }, []);

  const checkServiceability = check.mutateAsync;

  /**
   * "The point is now this."
   *
   * Local, and deliberately so: it resolves what the point IS (for the resolved row, and for the
   * details form's prefill) and nothing about whether Spoon serves it. Any previous verdict is
   * dropped, because a verdict belongs to one coordinate — keeping it would let a refusal for the
   * last point speak for a new one, or, worse, let an approval for the last point stand for a
   * point the server never saw.
   *
   * `known` is the address Places already returned for a chosen suggestion — using it skips a
   * reverse geocode we have already paid for and, more importantly, shows the customer the exact
   * place they picked rather than the geocoder's re-description of it.
   */
  const select = useCallback((point: DeviceCoordinates, known?: ReverseGeocodedAddress) => {
    const id = ++selectionId.current;
    const current = () => mounted.current && selectionId.current === id;

    latestPoint.current = point;
    latestGeocoded.current = known ?? null;
    setCoordinates(point);
    setFailure(null);
    setStatus(null);
    setConfirmError(false);
    setGeocoded(known ?? null);
    setLocating(false);
    setResolving(known === undefined);

    if (known !== undefined) return;

    // Display only. Nothing waits on it — Confirm is enabled by the POINT, not by its description,
    // so a slow or silent geocoder can never hold the customer up.
    void (async () => {
      const os = await reverseGeocode(point);
      if (os !== null) {
        if (!current()) return;
        latestGeocoded.current = os;
        setGeocoded(os);
        setResolving(false);
        return;
      }
      // The OS geocoder is empty on plenty of Android builds. Google is the backstop, so the
      // resolved row does not read "Selected location" forever.
      const google = await googleReverseGeocode(point);
      if (!current()) return;
      if (google.ok) {
        latestGeocoded.current = google.value;
        setGeocoded(google.value);
      }
      /**
       * Cleared whether or not an address was found. A geocoder that returns nothing is a NAME we
       * do not have, not a point we have lost: the coordinate stays selected, the row falls back
       * to "Selected location", and Confirm stays live (task §"handle geocoding failure without
       * losing the selected coordinates").
       */
      setResolving(false);
    })();
  }, []);

  /**
   * Retry. Sets state from an EVENT, never from inside the effect — the effect below performs no
   * synchronous state update at all, which is what keeps it from cascading renders.
   */
  const locate = useCallback(() => {
    setLocating(true);
    setFailure(null);
    setStatus(null);
    setConfirmError(false);
    setAttempt((previous) => previous + 1);
  }, []);

  /**
   * The device chain - ONCE per intended entry.
   *
   * ## The loop this closes
   *
   * This used to cancel-and-restart: every run set `cancelled` in its cleanup, so a
   * re-trigger abandoned the resolution already in flight. That turned a chatty platform
   * signal into an unbounded loop, measured on the handset at 128 resolutions from a SINGLE
   * mount, still climbing when the capture stopped:
   *
   *   AppState emits 'active'  ->  `locate()`  ->  `attempt` changes  ->  effect re-runs
   *     ->  cleanup cancels the in-flight fix  ->  the fix returns, sees it was cancelled and
   *         skips `select`  ->  `latestPoint` is never set  ->  the listener's
   *         "nothing to lose" guard never engages  ->  the next 'active' starts it all again.
   *
   * The retry was cancelling the very work whose result would have stopped the retries.
   * Android emitted 'active' roughly eight times a second on the test handset, so the screen
   * re-acquired location continuously while showing "Finding your location...".
   *
   * Single-flight fixes it at the cause: a resolution in progress is never replaced, so it
   * always reaches `select`, and every guard that depends on a point existing starts
   * working again.
   */
  useEffect(() => {
    if (resolveInFlight.current) return;
    resolveInFlight.current = true;

    // Whatever the customer has chosen by the time this returns takes precedence over it.
    const generation = userPointGeneration.current;

    void (async () => {
      // ONE line per resolution, and the counter used to verify §5 on a real handset. No
      // coordinate is logged: this says that a fix was asked for, never where the customer is.
      getLogger('location').info('resolving device fix', { attempt });
      const fix = await getCurrentCoordinates();
      resolveInFlight.current = false;

      if (!mounted.current) return;
      // The customer placed a pin while this was out. Their point stands; this one is dropped.
      if (generation !== userPointGeneration.current) return;

      if (!fix.ok) {
        // A denied permission is NOT a dead end any more: search still produces a point, so the
        // message points at it instead of only offering Settings.
        //
        // The counter is bumped for the same reason `select` bumps it: there is no point any more,
        // so a geocode still out for a previous one must not put its address under a blank map.
        selectionId.current += 1;
        latestGeocoded.current = null;
        setFailure(fix.reason);
        setCoordinates(null);
        setGeocoded(null);
        setLocating(false);
        setResolving(false);
        return;
      }

      select(fix.coordinates);
    })();
  }, [attempt, select]);

  const selectPoint = useCallback(
    (point: DeviceCoordinates) => {
      // The customer's own point. Retires any device fix still in flight (section 5).
      userPointGeneration.current += 1;
      select(point);
    },
    [select],
  );

  /**
   * Returning from the SETTINGS app re-asks for the fix — but only when there is still nothing to
   * lose (task §19, §8).
   *
   * A denied permission sends the customer out of the app to grant it, and coming back to the same
   * "Allow location" pill with no way to retry is a dead end on the one screen onboarding cannot
   * skip. So a foreground event re-runs the device chain.
   *
   * The guard is what keeps §8 intact: it runs ONLY while `coordinates` is null. A customer who
   * has already placed a point — by panning the map, or by choosing a search result — and then stepped
   * out to WhatsApp comes back to THEIR point, never to a fresh GPS fix that quietly moved it.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      const previous = lastAppState.current;
      lastAppState.current = status;

      // An EDGE, not a level. Android re-emits 'active' while the app is already foreground -
      // eight times a second on the test handset - and treating each one as a return from
      // Settings is what drove the re-acquisition loop.
      if (status !== 'active' || previous === 'active') return;
      // Nothing to lose, and nothing already looking.
      if (latestPoint.current !== null || resolveInFlight.current) return;
      // No point AND no fix in progress. `locate` only schedules an attempt; nothing here awaits.
      locate();
    });

    return () => subscription.remove();
  }, [locate]);

  /**
   * The ONE serviceability call in the address flow.
   *
   * It reads the point from a ref rather than from render state, so a press that lands in the same
   * tick as the map settling still checks the coordinate the pin is actually on. The in-flight
   * guard is a ref for the same reason: `confirming` exists to draw the CTA, and a second press
   * arriving before that render commits must still be refused.
   *
   * The point it checked is RETURNED, not left for the caller to look up again. The route needs
   * the same coordinate the server approved, and its own closure can be a render behind the pin.
   */
  const confirm = useCallback(async (): Promise<ConfirmOutcome> => {
    const point = latestPoint.current;
    if (point === null || confirmInFlight.current) return { kind: 'blocked' };

    confirmInFlight.current = true;
    setConfirming(true);
    setConfirmError(false);

    try {
      const verdict = await checkServiceability(point);
      // A point selected WHILE the check was in flight invalidates its answer: the verdict
      // describes coordinates the customer has already moved away from.
      if (latestPoint.current !== point) return { kind: 'blocked' };
      if (mounted.current) setStatus(verdict.status);

      return verdict.status === 'serviceable'
        ? { kind: 'serviceable', coordinates: point, geocoded: latestGeocoded.current }
        : { kind: 'refused', status: verdict.status };
    } catch {
      // The verdict is unknown, so nothing moves. Reported as an error rather than as
      // "unserviceable", which would be this client asserting what it cannot know.
      if (mounted.current) setConfirmError(true);
      return { kind: 'error' };
    } finally {
      confirmInFlight.current = false;
      if (mounted.current) setConfirming(false);
    }
  }, [checkServiceability]);

  const search = useCallback((text: string) => {
    setQuery(text);
    if (debounce.current !== null) clearTimeout(debounce.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setSearchState('idle');
      return;
    }

    setSearchState('searching');
    debounce.current = setTimeout(() => {
      // `searchId`, NOT `selectionId`: typing must not invalidate the reverse geocode running for
      // the point currently under the pin.
      const id = ++searchId.current;
      void (async () => {
        const result = await placesAutocomplete({
          query: text,
          sessionToken: sessionToken.current,
          bias: latestPoint.current,
        });
        if (!mounted.current || searchId.current !== id) return;

        if (!result.ok) {
          setSuggestions([]);
          setSearchState(result.reason === 'unconfigured' ? 'unconfigured' : 'error');
          return;
        }
        setSuggestions(result.value);
        setSearchState(result.value.length === 0 ? 'empty' : 'results');
      })();
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  /**
   * Closes the prediction list, and does NOTHING when there is nothing open.
   *
   * The guard is not a micro-optimisation. The map calls this on `onRegionChangeStart` for every
   * gesture — a pan that begins under a floating prediction list must not leave it floating — and
   * the unguarded version always re-rendered: `setSuggestions([])` hands React a NEW array, which
   * never compares equal, so every pan on every screen would open with a render pass over the map
   * whether or not anything was actually open.
   *
   * Reading state inside the callback keeps its identity stable, so the map's props do not
   * change either.
   */
  const dismissSuggestions = useCallback(() => {
    setSuggestions((current) => (current.length === 0 ? current : []));
    setSearchState((current) => (current === 'idle' ? current : 'idle'));
  }, []);

  const chooseSuggestion = useCallback(
    (placeId: string) => {
      // A chosen Places result is a customer point too - same retirement as a tap or a drag.
      userPointGeneration.current += 1;
      const chosen = suggestions.find((suggestion) => suggestion.placeId === placeId);
      setSuggestions([]);
      setSearchState('idle');
      /**
       * The field is rewritten to the WHOLE place that was chosen — `mainText` and the locality
       * under it, exactly as the row the customer tapped read.
       *
       * It used to take `primary` alone, which is only the first line of a two-line row: tapping
       * "Laxmi Nagar / Delhi, India" left the box saying "Laxmi Nagar" and dropped the half that
       * disambiguates it. Now the box states the same place the pin has moved to, in full, so the
       * two agree and re-opening the field shows what the search actually resolved.
       */
      if (chosen !== undefined) {
        setQuery(
          chosen.secondary === '' ? chosen.primary : `${chosen.primary}, ${chosen.secondary}`,
        );
      }
      setLocating(true);

      void (async () => {
        const details = await placeDetails({ placeId, sessionToken: sessionToken.current });
        // The session ends with the Details call, billed or not; the next search starts a new one.
        sessionToken.current = createSessionToken();

        if (!mounted.current) return;
        if (!details.ok) {
          // The pin does NOT move to somewhere invented. The previous point stands and the
          // customer can try another suggestion.
          setLocating(false);
          setSearchState('error');
          return;
        }
        // SELECTION only. Choosing a search result must not navigate and must not ask the server
        // anything — the customer is still looking (task §6).
        select(details.value.coordinates, details.value.address);
      })();
    },
    [suggestions, select],
  );

  const message =
    failure !== null
      ? FAILURE_MESSAGE[failure]
      : confirmError
        ? CONFIRM_ERROR_MESSAGE
        : status === null
          ? undefined
          : serviceabilityMessageFor(status);

  return {
    coordinates,
    geocoded,
    status,
    message,
    locating,
    resolving,
    locate,
    selectPoint,
    confirming,
    /**
     * The POINT is what Confirm needs.
     *
     * A refusal already on screen does NOT disable it: the customer may pan one street over and
     * press again, and a CTA that stays dead after one refusal is exactly the dead end §8 forbids.
     * Selecting a new point clears the message anyway, so the two never disagree.
     *
     * A geocode still in flight does not disable it either. The coordinate is what gets saved and
     * checked; its NAME is display. Gating the CTA on the geocoder would hand a third party a veto
     * over onboarding — and would strand every customer the geocoder has nothing to say about.
     */
    canConfirm: coordinates !== null && !confirming,
    confirm,
    query,
    suggestions,
    searchState,
    search,
    chooseSuggestion,
    dismissSuggestions,
  };
}
