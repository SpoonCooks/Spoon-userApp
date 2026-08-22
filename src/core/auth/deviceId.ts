import * as SecureStore from 'expo-secure-store';

/**
 * The install's stable device identifier.
 *
 * `POST /v1/auth/otp/verify` requires a `deviceId` and binds the refresh-token FAMILY to it. The
 * backend uses that binding to detect refresh-token reuse and kill a compromised family, so the
 * value has exactly one requirement: it must be the SAME string on every launch of this install.
 * A value regenerated per launch would silently create a new session family on every sign-in and
 * make the reuse detection meaningless.
 *
 * It lives in SecureStore next to the tokens rather than AsyncStorage because it is part of the
 * session's identity, and because clearing app data should invalidate it together with them.
 *
 * It is NOT a hardware id and deliberately carries no device fingerprint: it is a random opaque
 * string minted on first use. Nothing about the handset is disclosed.
 */

const DEVICE_ID_KEY = 'spoon.auth.deviceId';

function mint(): string {
  const chunk = () => Math.random().toString(36).slice(2, 12);
  return `dev-${Date.now().toString(36)}-${chunk()}${chunk()}`;
}

let cached: string | undefined;

export async function getDeviceId(): Promise<string> {
  if (cached !== undefined) return cached;

  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing !== null && existing.length > 0) {
    cached = existing;
    return existing;
  }

  const created = mint();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  cached = created;
  return created;
}

/** Test-only: drops the memoised value so a test can observe the storage read. */
export function resetDeviceIdCache(): void {
  cached = undefined;
}
