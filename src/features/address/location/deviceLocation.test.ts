import * as Location from 'expo-location';

import { getCurrentCoordinates, reverseGeocode } from './deviceLocation';

/**
 * Device location.
 *
 * The property under test is that a coordinate is either REAL or absent. Every failure path
 * below must produce a reason, never a fallback point — a defaulted coordinate would be saved as
 * an address and would send a cook to the wrong door, which is the worst outcome this app has.
 */

const mocked = Location as jest.Mocked<typeof Location>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCurrentCoordinates', () => {
  it('returns the device position when permission is granted', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as never);
    mocked.hasServicesEnabledAsync.mockResolvedValue(true);
    mocked.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 12.9611, longitude: 77.6387 },
    } as never);

    await expect(getCurrentCoordinates()).resolves.toEqual({
      ok: true,
      coordinates: { latitude: 12.9611, longitude: 77.6387 },
    });
  });

  it('reports a refusal as denied, with no coordinates at all', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as never);

    await expect(getCurrentCoordinates()).resolves.toEqual({
      ok: false,
      reason: 'permission_denied',
    });
    expect(mocked.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('distinguishes location services being switched off', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.hasServicesEnabledAsync.mockResolvedValue(false);

    await expect(getCurrentCoordinates()).resolves.toEqual({
      ok: false,
      reason: 'services_disabled',
    });
  });

  it('reports a granted permission that yields no fix as unavailable', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.hasServicesEnabledAsync.mockResolvedValue(true);
    mocked.getCurrentPositionAsync.mockRejectedValue(new Error('timeout'));

    await expect(getCurrentCoordinates()).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });

  it('prefers the OS cached fix, because a fresh request may never arrive indoors', async () => {
    // Measured on the handset: `getCurrentPositionAsync` did not return in two minutes, while the
    // OS held a 24m fused fix throughout. Waiting on the fresh one first is what left the map
    // unmounted and Confirm disabled, so the cached reading is asked for first.
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.hasServicesEnabledAsync.mockResolvedValue(true);
    mocked.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 28.6304, longitude: 77.2777 },
    } as never);

    await expect(getCurrentCoordinates()).resolves.toEqual({
      ok: true,
      coordinates: { latitude: 28.6304, longitude: 77.2777 },
    });
    expect(mocked.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('falls back to the position the OS already holds when no fresh fix arrives', async () => {
    // The real symptom this closes: indoors, `getCurrentPositionAsync` stays outstanding for
    // minutes, so the first-run map never mounted and Confirm never enabled. The cached fix is a
    // REAL measurement from the OS, so using it invents nothing.
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.hasServicesEnabledAsync.mockResolvedValue(true);
    mocked.getCurrentPositionAsync.mockRejectedValue(new Error('no fix'));
    mocked.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 28.6304, longitude: 77.2777 },
    } as never);

    await expect(getCurrentCoordinates()).resolves.toEqual({
      ok: true,
      coordinates: { latitude: 28.6304, longitude: 77.2777 },
    });
  });

  it('never returns a half-filled position as a coordinate', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.hasServicesEnabledAsync.mockResolvedValue(true);
    mocked.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 12.9 } } as never);
    mocked.getLastKnownPositionAsync.mockResolvedValue(null as never);

    await expect(getCurrentCoordinates()).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });

  it('treats a permission response it cannot read as unavailable, NOT as denied', async () => {
    // A stubbed or half-initialised native module answers with nothing. Calling that a denial
    // would send the customer to Settings to fix a permission they never refused.
    mocked.requestForegroundPermissionsAsync.mockResolvedValue(undefined as never);

    await expect(getCurrentCoordinates()).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });

  it('still tries for a fix when the OS will not say whether services are enabled', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.hasServicesEnabledAsync.mockRejectedValue(new Error('unsupported'));
    mocked.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 1, longitude: 2 },
    } as never);

    await expect(getCurrentCoordinates()).resolves.toEqual({
      ok: true,
      coordinates: { latitude: 1, longitude: 2 },
    });
  });
});

describe('reverseGeocode', () => {
  const POINT = { latitude: 12.9611, longitude: 77.6387 };

  it('assembles a display line from whichever parts the geocoder filled in', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([
      {
        name: 'Purva Skydale',
        street: '18th Main Road',
        district: 'HSR Layout',
        city: 'Bengaluru',
        region: 'Karnataka',
        postalCode: '560102',
      },
    ] as never);

    await expect(reverseGeocode(POINT)).resolves.toEqual({
      title: 'Purva Skydale',
      line: '18th Main Road, HSR Layout, Bengaluru, Karnataka, 560102',
      pincode: '560102',
      street: '18th Main Road',
      city: 'Bengaluru',
      region: 'Karnataka',
    });
  });

  it('degrades to whatever it does know rather than emitting empty strings', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([{ city: 'Bengaluru' }] as never);

    const result = await reverseGeocode(POINT);

    expect(result?.title).toBe('Bengaluru');
    expect(result?.line).toBe('Bengaluru');
    expect(result?.pincode).toBeNull();
  });

  it('returns null when the geocoder knows nothing, so a good point can still be saved', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([] as never);
    await expect(reverseGeocode(POINT)).resolves.toBeNull();
  });

  it('returns null rather than throwing when the geocoder itself fails', async () => {
    mocked.reverseGeocodeAsync.mockRejectedValue(new Error('offline'));
    await expect(reverseGeocode(POINT)).resolves.toBeNull();
  });
});
