import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { resetConfigCache } from '@core/config';

import { googleReverseGeocode, placeDetails, placesAutocomplete } from './googlePlaces';

/**
 * Places (New) and Geocoding, at the boundary.
 *
 * The assertions that matter here are the FAILURES. An address screen meets "no results", "no
 * network", "quota exceeded" and "this build has no key" routinely, and each has to reach the
 * customer as a different sentence — so each is pinned as a distinct value rather than a thrown
 * error the screen would have to guess at.
 *
 * The other rule pinned here: a lookup that cannot produce a point produces NOTHING. There is no
 * path through this module that returns a fallback coordinate, because a plausible-but-wrong
 * coordinate sends a cook to the wrong door.
 */

const KEYED_EXTRA = {
  appEnv: 'development',
  apiBaseUrl: 'https://api.test.invalid',
  apiTimeoutMs: 15000,
  logLevel: 'silent',
  googleMapsAndroidApiKey: 'test-android-key',
  googleMapsIosApiKey: 'test-ios-key',
  androidPackage: 'com.spoonhelp.userapp.test',
  iosBundleIdentifier: 'com.spoonhelp.userapp.test',
  androidSigningSha1: 'AABBCC',
};

function withExtra(extra: Record<string, unknown>) {
  // `expo-constants` is mocked in jest.setup; this reshapes it per test.
  (Constants as unknown as { expoConfig: { extra: unknown } }).expoConfig = { extra };
  resetConfigCache();
}

const realFetch = global.fetch;

function mockFetch(impl: () => Promise<unknown>) {
  global.fetch = jest.fn(impl) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: async () => body } as unknown as Response);
}

afterEach(() => {
  global.fetch = realFetch;
  withExtra(KEYED_EXTRA);
});

beforeEach(() => {
  withExtra(KEYED_EXTRA);
});

describe('placesAutocomplete', () => {
  it('does not call Google for a query too short to predict anything', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await placesAutocomplete({ query: 'a', sessionToken: 't' });

    expect(result).toEqual({ ok: true, value: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports `unconfigured` — not an error — when the build carries no key', async () => {
    withExtra({ ...KEYED_EXTRA, googleMapsAndroidApiKey: '', googleMapsIosApiKey: '' });
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await placesAutocomplete({ query: 'Indiranagar', sessionToken: 't' });

    expect(result).toEqual({ ok: false, reason: 'unconfigured' });
    // Nothing is attempted: a missing key is a build fact, not something a retry can fix.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps predictions to the two lines the row draws', async () => {
    mockFetch(() =>
      jsonResponse({
        suggestions: [
          {
            placePrediction: {
              placeId: 'place-1',
              structuredFormat: {
                mainText: { text: 'Indiranagar' },
                secondaryText: { text: 'Bengaluru, Karnataka' },
              },
            },
          },
        ],
      }),
    );

    const result = await placesAutocomplete({ query: 'Indiranagar', sessionToken: 't' });

    expect(result).toEqual({
      ok: true,
      value: [{ placeId: 'place-1', primary: 'Indiranagar', secondary: 'Bengaluru, Karnataka' }],
    });
  });

  it('sends the PLATFORM key and its app-restriction headers, so a locked-down key keeps working', async () => {
    const seen: { headers?: Record<string, string> }[] = [];
    global.fetch = ((_url: string, init: { headers: Record<string, string> }) => {
      seen.push(init);
      return jsonResponse({ suggestions: [] });
    }) as unknown as typeof fetch;

    await placesAutocomplete({ query: 'Indiranagar', sessionToken: 't' });

    const headers = seen[0]?.headers ?? {};

    // The key and the identifying headers must come from the SAME platform — a request that
    // carried the Android key under an iOS bundle header would be refused by a restricted key.
    if (Platform.OS === 'ios') {
      expect(headers['X-Goog-Api-Key']).toBe('test-ios-key');
      expect(headers['X-Ios-Bundle-Identifier']).toBe('com.spoonhelp.userapp.test');
      expect(headers['X-Android-Package']).toBeUndefined();
    } else {
      expect(headers['X-Goog-Api-Key']).toBe('test-android-key');
      expect(headers['X-Android-Package']).toBe('com.spoonhelp.userapp.test');
      expect(headers['X-Android-Cert']).toBe('AABBCC');
      expect(headers['X-Ios-Bundle-Identifier']).toBeUndefined();
    }
  });

  it('treats a missing `suggestions` key as NO RESULTS, not as a failure', async () => {
    mockFetch(() => jsonResponse({}));

    const result = await placesAutocomplete({ query: 'zzzzzzzz', sessionToken: 't' });

    expect(result).toEqual({ ok: true, value: [] });
  });

  it('separates a refusal from a network fault', async () => {
    mockFetch(() => jsonResponse({ error: {} }, false, 403));
    expect(await placesAutocomplete({ query: 'Indiranagar', sessionToken: 't' })).toEqual({
      ok: false,
      reason: 'rejected',
    });

    mockFetch(() => Promise.reject(new Error('offline')));
    expect(await placesAutocomplete({ query: 'Indiranagar', sessionToken: 't' })).toEqual({
      ok: false,
      reason: 'network',
    });
  });
});

describe('placeDetails', () => {
  it('returns the point and the address the customer actually chose', async () => {
    mockFetch(() =>
      jsonResponse({
        location: { latitude: 12.9784, longitude: 77.6408 },
        formattedAddress: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038, India',
        displayName: { text: 'Indiranagar' },
        addressComponents: [
          { types: ['route'], longText: '100 Feet Road' },
          { types: ['locality'], longText: 'Bengaluru' },
          { types: ['postal_code'], longText: '560038' },
          { types: ['administrative_area_level_1'], longText: 'Karnataka' },
        ],
      }),
    );

    const result = await placeDetails({ placeId: 'place-1', sessionToken: 't' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.coordinates).toEqual({ latitude: 12.9784, longitude: 77.6408 });
    expect(result.value.address.pincode).toBe('560038');
    expect(result.value.address.city).toBe('Bengaluru');
    expect(result.value.address.street).toBe('100 Feet Road');
  });

  it('refuses a place with no coordinates rather than substituting one', async () => {
    mockFetch(() => jsonResponse({ formattedAddress: 'Somewhere' }));

    expect(await placeDetails({ placeId: 'place-1', sessionToken: 't' })).toEqual({
      ok: false,
      reason: 'rejected',
    });
  });
});

describe('googleReverseGeocode', () => {
  it('reads the components the address form prefills from', async () => {
    mockFetch(() =>
      jsonResponse({
        status: 'OK',
        results: [
          {
            formatted_address: '100 Feet Rd, Indiranagar, Bengaluru 560038, India',
            address_components: [
              { types: ['route'], long_name: '100 Feet Road' },
              { types: ['locality'], long_name: 'Bengaluru' },
              { types: ['postal_code'], long_name: '560038' },
            ],
          },
        ],
      }),
    );

    const result = await googleReverseGeocode({ latitude: 12.97, longitude: 77.64 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe('100 Feet Road');
    expect(result.value.pincode).toBe('560038');
  });

  it('reports ZERO_RESULTS as a rejection, so the caller keeps the text it already had', async () => {
    mockFetch(() => jsonResponse({ status: 'ZERO_RESULTS', results: [] }));

    expect(await googleReverseGeocode({ latitude: 0, longitude: 0 })).toEqual({
      ok: false,
      reason: 'rejected',
    });
  });
});
