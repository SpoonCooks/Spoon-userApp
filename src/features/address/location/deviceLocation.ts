import * as Location from 'expo-location';

import { getLogger } from '@core/logging';

/**
 * Device location — the app's ONLY source of real coordinates.
 *
 * ## Why this is not a map provider
 *
 * Choosing between Google Maps, Mapbox and Ola Maps is an open engineering and commercial
 * decision (docs/FRONTEND_FOUNDATION_PLAN.md §305): it needs an API key, a billing account and a
 * vendor commitment, and none has been made. This module deliberately does NOT make that choice.
 * It uses the operating system's own location service and the OS geocoder — no key, no account,
 * no vendor lock-in — which is the part of §16 that can be honoured today.
 *
 * What remains blocked, and stays blocked rather than being faked:
 *
 *  - the MAP CANVAS on `53:33`, which needs a tile provider;
 *  - SEARCH / autocomplete on `53:63`, which needs Places or an equivalent.
 *
 * Both are recorded as CONFIGURATION_GAP. What works without them is "use where I am now", which
 * is enough to produce genuine coordinates for serviceability and for saving an address.
 *
 * ## What it never does
 *
 * It does not decide serviceability. It produces a latitude and a longitude and hands them to
 * `POST /v1/serviceability/check`; the backend owns the polygons and the verdict (§15). And it
 * never invents a coordinate: every failure below returns a REASON, and the caller shows it,
 * rather than defaulting to a city centre that would silently book a cook to the wrong place.
 */

/** Why coordinates could not be produced. Each maps to a different thing to tell the customer. */
export type DeviceLocationFailure =
  /** The customer declined, or the OS refused. Recoverable by asking again from Settings. */
  | 'permission_denied'
  /** Location services are switched off device-wide. */
  | 'services_disabled'
  /** Permission was granted but no fix arrived — indoors, airplane mode, a cold GPS. */
  | 'unavailable';

export interface DeviceCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export type DeviceLocationResult =
  | { readonly ok: true; readonly coordinates: DeviceCoordinates }
  | { readonly ok: false; readonly reason: DeviceLocationFailure };

/**
 * A human-readable address for a point, from the OS geocoder.
 *
 * Presentation only. The backend is told the COORDINATES, never this text, so a geocoder that
 * words a street differently cannot change which address is saved or whether it is serviceable.
 */
export interface ReverseGeocodedAddress {
  /** The short line for the resolved row's title — a building, a street, or a district. */
  readonly title: string;
  /** The fuller line beneath it. */
  readonly line: string;
  /** Supplied to `POST /v1/me/addresses` when the geocoder knows it; the customer can correct it. */
  readonly pincode: string | null;
  readonly street: string | null;
  readonly city: string | null;
  readonly region: string | null;
  /** Present when the address came from a Places selection; absent for device/OS geocoding. */
  readonly placeId?: string;
}

/**
 * Asks for permission and returns the current position.
 *
 * Permission is requested HERE rather than at launch: §16 wants it at a product moment, and the
 * moment a customer taps "use my location" is the one place the request explains itself.
 */
export async function getCurrentCoordinates(): Promise<DeviceLocationResult> {
  let permission;
  try {
    permission = await Location.requestForegroundPermissionsAsync();
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  // A response that is not shaped like the contract means the module answered but told us
  // nothing — a stubbed native module, or an OS that refused without erroring. That is
  // "unavailable", NOT "denied": reporting a denial the customer never made would send them to
  // Settings to fix a permission that is already granted.
  if (typeof permission !== 'object' || permission === null || !('granted' in permission)) {
    return { ok: false, reason: 'unavailable' };
  }
  if (!permission.granted) return { ok: false, reason: 'permission_denied' };

  try {
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) return { ok: false, reason: 'services_disabled' };
  } catch {
    // An OS that will not answer the question is treated as "try anyway": the position call
    // below is the real test, and refusing early would block a customer whose location works.
  }

  /**
   * THREE sources, tried in order of how quickly they can open the map.
   *
   * The cached fix goes FIRST, which is not the obvious order. Measured on the handset,
   * `getCurrentPositionAsync` never returned at all indoors — two minutes on `53:31` with the
   * screen untouched still read "Finding your location…", the map never mounted (it needs a
   * coordinate before `MapView` renders) and Confirm stayed disabled. Meanwhile `dumpsys
   * location` showed the OS holding a fused fix accurate to 24m the whole time. Preferring a
   * fresh reading is only worth anything if it ARRIVES.
   *
   * Every branch is a real measurement taken by the OS. None of them is defaulted, invented or
   * carried over from a previous session, and the customer still confirms the pin — which is
   * what §16 actually protects.
   */
  const recent = toCoordinates(await lastKnownPosition({ maxAge: RECENT_FIX_MAX_AGE_MS }));
  if (recent !== null) return located('last-known', recent);

  /**
   * `Low` rather than `Balanced`: it is served by wifi and cell rather than by the GPS radio, so
   * it answers indoors in seconds where the balanced request waits on a satellite lock that may
   * never come. The coordinate is coarser, and the customer adjusts the pin — which the screen
   * asks them to do regardless ("Move pin to help the cook reach accurately").
   */
  const fresh = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
    FRESH_FIX_TIMEOUT_MS,
  );
  const fromFresh = toCoordinates(fresh);
  if (fromFresh !== null) return located('fresh', fromFresh);

  // Last resort: a cached fix older than the window above. Still a real reading, and a map the
  // customer can drag beats a screen that never resolves.
  const stale = toCoordinates(await lastKnownPosition());
  if (stale !== null) return located('last-known-stale', stale);

  getLogger('location').warn('no device fix available', { source: 'none' });
  return { ok: false, reason: 'unavailable' };
}

/** One line per outcome, so a build in someone's hand can say WHICH source placed the pin. */
function located(source: string, coordinates: DeviceCoordinates): DeviceLocationResult {
  getLogger('location').info('device fix', { source });
  return { ok: true, coordinates };
}

/**
 * How long to wait for a FRESH fix before falling back to the position the OS already holds.
 *
 * `getCurrentPositionAsync` asks the fused provider for a NEW reading, and expo's own
 * documentation notes it "can take up to several seconds". Indoors — which is exactly where a
 * cook is booked — that request routinely stays outstanding far longer, and it carries no timeout
 * of its own. `53:31` is the FIRST-RUN destination, so an unbounded wait strands a customer on
 * "Finding your location…" with no map and a disabled Confirm, which reads as a broken app.
 */
const FRESH_FIX_TIMEOUT_MS = 8000;

/**
 * How old the OS's cached fix may be and still be preferred to a fresh request.
 *
 * An hour is chosen against the failure it guards: a fix from THIS session or the last one is the
 * customer's actual neighbourhood, while a fix from yesterday could be another city, and dropping
 * a pin there would be exactly the silent wrong-address error §16 forbids. Anything older falls
 * through to a fresh request and is only used if that produces nothing at all.
 */
const RECENT_FIX_MAX_AGE_MS = 60 * 60 * 1000;

/** Resolves to `null` rather than rejecting, and rather than waiting past `ms`. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race<T | null>([
      promise.catch(() => null),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** The OS's cached fix, or `null` — never a throw, and never a missing-method crash. */
async function lastKnownPosition(options?: { readonly maxAge: number }): Promise<unknown> {
  if (typeof Location.getLastKnownPositionAsync !== 'function') return null;
  try {
    return await Location.getLastKnownPositionAsync(options);
  } catch {
    return null;
  }
}

/**
 * Reads a coordinate pair out of a position object, or `null`.
 *
 * Both numbers are checked for finiteness: a half-filled position must produce "no coordinate"
 * rather than a `NaN` that would travel all the way into a saved address.
 */
function toCoordinates(position: unknown): DeviceCoordinates | null {
  if (typeof position !== 'object' || position === null) return null;
  const { coords } = position as { coords?: unknown };
  if (typeof coords !== 'object' || coords === null) return null;
  const { latitude, longitude } = coords as { latitude?: unknown; longitude?: unknown };
  if (typeof latitude !== 'number' || !Number.isFinite(latitude)) return null;
  if (typeof longitude !== 'number' || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

/**
 * Turns a point into something the customer can recognise, using the OS geocoder.
 *
 * Returns `null` rather than throwing when the geocoder has nothing: an unnamed point is a normal
 * outcome (it happens offline, and in areas with no address data), and it must not stop the
 * customer from saving an address whose COORDINATES are perfectly good.
 */
export async function reverseGeocode(
  coordinates: DeviceCoordinates,
): Promise<ReverseGeocodedAddress | null> {
  let results;
  try {
    results = await Location.reverseGeocodeAsync(coordinates);
  } catch {
    return null;
  }

  const first = results[0];
  if (first === undefined) return null;

  // Assembled from whichever parts this geocoder filled in — they vary by platform and by
  // locale, so the fields are picked in order of specificity rather than assumed to be present.
  const title = first.name ?? first.street ?? first.district ?? first.city ?? 'Selected location';
  const line = [first.street, first.district, first.city, first.region, first.postalCode]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(', ');

  return {
    title,
    line: line.length > 0 ? line : title,
    pincode: first.postalCode ?? null,
    street: first.street ?? first.name ?? null,
    city: first.city ?? null,
    region: first.region ?? null,
  };
}
