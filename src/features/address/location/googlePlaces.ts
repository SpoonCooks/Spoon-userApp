import { Platform } from 'react-native';

import { getConfig } from '@core/config';
import { getLogger } from '@core/logging';

import type { DeviceCoordinates, ReverseGeocodedAddress } from './deviceLocation';

/**
 * Google Places (New) and Geocoding — the two HTTPS APIs behind the address map step (`53:31`).
 *
 * ## What this is, and is not
 *
 * It resolves TEXT to a place and a place to COORDINATES, and it turns coordinates into something
 * a customer can recognise. That is all. It does not decide serviceability — the backend owns the
 * polygons and the verdict (`POST /v1/serviceability/check`) — and it never calls the Routes API,
 * which belongs to the backend and whose key never reaches this app.
 *
 * ## The key, and why it is allowed to be in the bundle
 *
 * The NATIVE Maps SDKs get their key from AndroidManifest.xml / Info.plist, written at build time
 * by the `react-native-maps` config plugin. These two are web services called over HTTPS from JS,
 * so their key has to be readable here — that is true of every client that calls Google's web
 * APIs directly. A Maps client key is therefore not kept secret; it is made safe by an
 * APPLICATION RESTRICTION in Google Cloud, and the app-identifying headers below are what let
 * that restriction be applied without another release.
 *
 * ## Every failure is a value
 *
 * Nothing here throws at the UI. Search with no results, a network error, a quota rejection and a
 * geocoder that knows nothing are all NORMAL on an address screen, and each has a different thing
 * to tell the customer — so they are returned, not raised. The one thing this module will never
 * do is invent a coordinate: a place it cannot resolve is `null`, never a city centre.
 */

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/** Spoon operates in India; biasing the query keeps a two-word search from returning the world. */
const REGION_CODE = 'IN';

/** How far around the customer's own position to prefer results, in metres. */
const BIAS_RADIUS_M = 50_000;

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * The platform's key.
 *
 * Both are carried in `extra` because that value is shared across platforms and the config is
 * evaluated once; the choice is made HERE, where `Platform.OS` is real. An absent key is not an
 * error — it means search degrades and the rest of the flow continues.
 */
function apiKey(): string | null {
  const config = getConfig();
  const key = Platform.OS === 'ios' ? config.googleMapsIosApiKey : config.googleMapsAndroidApiKey;
  return key === undefined || key === '' ? null : key;
}

/**
 * Identifies the app to Google so an APPLICATION-restricted key is accepted.
 *
 * `X-Android-Package` + `X-Android-Cert` (the signing SHA-1, uppercase hex, no separators) are
 * what the native SDKs send automatically and what a REST caller has to send itself;
 * `X-Ios-Bundle-Identifier` is the iOS equivalent. Sending them costs nothing when the key is
 * unrestricted and is the difference between working and 403 once it is locked down.
 *
 * The certificate fingerprint is a public fact about the build — anyone can read it out of the
 * APK with `apksigner` — so carrying it is not an exposure.
 */
function appHeaders(): Record<string, string> {
  const config = getConfig();

  if (Platform.OS === 'ios') {
    const bundle = config.iosBundleIdentifier;
    return bundle === undefined ? {} : { 'X-Ios-Bundle-Identifier': bundle };
  }

  const pkg = config.androidPackage;
  if (pkg === undefined) return {};
  const cert = config.androidSigningSha1;
  return {
    'X-Android-Package': pkg,
    ...(cert === undefined || cert === '' ? {} : { 'X-Android-Cert': cert }),
  };
}

/** Why a lookup produced nothing. Each says something different to the customer. */
export type PlacesFailure =
  /** No key in this build — search is switched off, not broken. */
  | 'unconfigured'
  /** The request never completed: offline, DNS, timeout. */
  | 'network'
  /** Google answered, and refused: quota, billing, a restriction that does not match. */
  | 'rejected';

export interface PlaceSuggestion {
  readonly placeId: string;
  /** `structuredFormat.mainText` — the name a customer scans for. */
  readonly primary: string;
  /** `structuredFormat.secondaryText` — the locality beneath it. */
  readonly secondary: string;
}

export type PlacesResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: PlacesFailure };

async function request(
  url: string,
  init: { method: 'GET' | 'POST'; headers: Record<string, string>; body?: string },
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A Places session token.
 *
 * Autocomplete keystrokes and the Details call that follows are billed as ONE session when they
 * share a token. It is an opaque string to Google, so a random one is sufficient; it must be
 * regenerated after each Details call, which is the caller's job.
 */
export function createSessionToken(): string {
  const part = () => Math.floor(Math.random() * 0x100000000).toString(16);
  return `${part()}-${part()}-${part()}`;
}

/**
 * `53:63` — the search field.
 *
 * An empty or one-character query returns no suggestions WITHOUT calling Google: every keystroke
 * is billable, and a single letter is never a useful prediction.
 */
export async function placesAutocomplete(input: {
  readonly query: string;
  readonly sessionToken: string;
  readonly bias?: DeviceCoordinates | null;
}): Promise<PlacesResult<readonly PlaceSuggestion[]>> {
  const query = input.query.trim();
  if (query.length < 2) return { ok: true, value: [] };

  const key = apiKey();
  if (key === null) return { ok: false, reason: 'unconfigured' };

  const response = await request(AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, ...appHeaders() },
    body: JSON.stringify({
      input: query,
      regionCode: REGION_CODE,
      sessionToken: input.sessionToken,
      ...(input.bias === undefined || input.bias === null
        ? {}
        : {
            locationBias: {
              circle: {
                center: { latitude: input.bias.latitude, longitude: input.bias.longitude },
                radius: BIAS_RADIUS_M,
              },
            },
          }),
    }),
  });

  if (response === null) return { ok: false, reason: 'network' };
  if (!response.ok) {
    getLogger('places').warn('places.autocomplete.rejected', { status: response.status });
    return { ok: false, reason: 'rejected' };
  }

  const payload = (await response.json().catch(() => null)) as {
    suggestions?: readonly {
      placePrediction?: {
        placeId?: string;
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
        text?: { text?: string };
      };
    }[];
  } | null;

  if (payload === null) return { ok: false, reason: 'rejected' };

  // No `suggestions` key at all is Google's way of saying "nothing matched" — a SUCCESS with an
  // empty list, not a failure, so the screen shows "no results" rather than an error.
  const suggestions = (payload.suggestions ?? [])
    .map((entry) => entry.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => prediction !== undefined)
    .map((prediction) => ({
      placeId: prediction.placeId ?? '',
      primary: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
      secondary: prediction.structuredFormat?.secondaryText?.text ?? '',
    }))
    .filter((suggestion) => suggestion.placeId !== '' && suggestion.primary !== '');

  return { ok: true, value: suggestions };
}

export interface ResolvedPlace {
  readonly coordinates: DeviceCoordinates;
  readonly address: ReverseGeocodedAddress;
}

/**
 * Turns a chosen suggestion into the COORDINATES the backend is actually told about.
 *
 * The field mask is explicit and minimal: Places (New) bills by the fields requested, so asking
 * for the whole place to read two numbers off it is a real cost.
 */
export async function placeDetails(input: {
  readonly placeId: string;
  readonly sessionToken: string;
}): Promise<PlacesResult<ResolvedPlace>> {
  const key = apiKey();
  if (key === null) return { ok: false, reason: 'unconfigured' };

  const url =
    `${PLACE_DETAILS_URL}/${encodeURIComponent(input.placeId)}` +
    `?sessionToken=${encodeURIComponent(input.sessionToken)}`;

  const response = await request(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'location,formattedAddress,addressComponents,displayName',
      ...appHeaders(),
    },
  });

  if (response === null) return { ok: false, reason: 'network' };
  if (!response.ok) {
    getLogger('places').warn('places.details.rejected', { status: response.status });
    return { ok: false, reason: 'rejected' };
  }

  const payload = (await response.json().catch(() => null)) as {
    location?: { latitude?: number; longitude?: number };
    formattedAddress?: string;
    displayName?: { text?: string };
    addressComponents?: readonly { types?: readonly string[]; longText?: string }[];
  } | null;

  const latitude = payload?.location?.latitude;
  const longitude = payload?.location?.longitude;
  // A place with no point is unusable and is NOT substituted for — the caller keeps the pin where
  // it was rather than moving it somewhere invented.
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { ok: false, reason: 'rejected' };
  }

  const component = (type: string): string | null =>
    payload?.addressComponents?.find((entry) => entry.types?.includes(type))?.longText ?? null;

  const title = payload?.displayName?.text ?? component('route') ?? 'Selected location';

  return {
    ok: true,
    value: {
      coordinates: { latitude, longitude },
      address: {
        placeId: input.placeId,
        title,
        line: payload?.formattedAddress ?? title,
        pincode: component('postal_code'),
        street: component('route') ?? payload?.displayName?.text ?? null,
        city:
          component('locality') ??
          component('administrative_area_level_2') ??
          component('sublocality'),
        region: component('administrative_area_level_1'),
      },
    },
  };
}

/**
 * Reverse geocoding through Google — the FALLBACK, not the primary.
 *
 * `expo-location`'s `reverseGeocodeAsync` is tried first by the caller because it needs no key, no
 * network round trip of ours, and no quota. It is also unreliable: on Android it depends on a
 * Play-services geocoder that returns an empty list on plenty of devices, and on those devices the
 * resolved row would read "Selected location" forever. This closes that hole.
 */
export async function googleReverseGeocode(
  coordinates: DeviceCoordinates,
): Promise<PlacesResult<ReverseGeocodedAddress>> {
  const key = apiKey();
  if (key === null) return { ok: false, reason: 'unconfigured' };

  const url =
    `${GEOCODE_URL}?latlng=${coordinates.latitude},${coordinates.longitude}` +
    `&region=${REGION_CODE.toLowerCase()}&key=${encodeURIComponent(key)}`;

  const response = await request(url, { method: 'GET', headers: appHeaders() });
  if (response === null) return { ok: false, reason: 'network' };
  if (!response.ok) return { ok: false, reason: 'rejected' };

  const payload = (await response.json().catch(() => null)) as {
    status?: string;
    results?: readonly {
      formatted_address?: string;
      address_components?: readonly { types?: readonly string[]; long_name?: string }[];
    }[];
  } | null;

  // `ZERO_RESULTS` is a real answer about an unnamed point, not a fault — but it gives the caller
  // nothing to show, so it is reported as a rejection and the caller keeps its existing text.
  const first = payload?.results?.[0];
  if (payload?.status !== 'OK' || first === undefined) return { ok: false, reason: 'rejected' };

  const component = (type: string): string | null =>
    first.address_components?.find((entry) => entry.types?.includes(type))?.long_name ?? null;

  const street = component('route');
  const sublocality = component('sublocality') ?? component('sublocality_level_1');
  const title = street ?? sublocality ?? component('locality') ?? 'Selected location';

  return {
    ok: true,
    value: {
      title,
      line: first.formatted_address ?? title,
      pincode: component('postal_code'),
      street,
      city: component('locality') ?? component('administrative_area_level_2'),
      region: component('administrative_area_level_1'),
    },
  };
}
