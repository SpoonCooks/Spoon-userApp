import { fetchAndActivate, getRemoteConfig, getString } from '@react-native-firebase/remote-config';

import type { AppEnv } from '@core/config';

/**
 * The update policy, read from Firebase Remote Config.
 *
 * Changing it needs no release: edit the parameters in the Firebase console and publish. The
 * parameters are per platform because the two stores approve a build at different times, and a
 * minimum raised for one before it is live there would block customers with nothing to install.
 *
 *   min_app_version_ios / _android     below this the app is blocked (mandatory update)
 *   latest_app_version_ios / _android  below this a dismissible prompt is shown (optional update)
 *   update_message                     optional copy for the mandatory screen
 *
 * An unset or blank parameter is `null`, which means "no requirement" (see `version.ts`).
 *
 * ## One Firebase project, separate keys per environment
 *
 * Every build — staging and production alike — reads the same Firebase project, so a value set
 * to test the update screen would otherwise reach real customers. Production reads the names
 * above exactly as written. Any other environment reads them with its own prefix
 * (`staging_min_app_version_ios`, `development_…`), so a test value can only ever be seen by
 * builds of that environment, and a prefixed key that does not exist yet means "no requirement".
 */

export interface UpdatePolicy {
  readonly minimum: string | null;
  readonly latest: string | null;
  readonly message: string | null;
}

/**
 * How stale a fetch may be before the SDK asks the network again.
 *
 * Firebase throttles a client to a handful of real fetches an hour, and a call inside the window
 * is answered from cache rather than failing — so asking on every foreground is safe. Fifteen
 * minutes is the answer to "how soon does a console change reach someone with the app open";
 * development gets 0 so a change can be seen at once.
 */
const MIN_FETCH_INTERVAL_MS = __DEV__ ? 0 : 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

/** `min_app_version_ios` in production; `staging_min_app_version_ios` in staging; and so on. */
export function parameterName(base: string, appEnv: AppEnv): string {
  return appEnv === 'production' ? base : `${appEnv}_${base}`;
}

function valueOf(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

/** `null` when Remote Config could not be reached or read — the caller then enforces nothing. */
export async function fetchUpdatePolicy(
  platform: 'ios' | 'android',
  appEnv: AppEnv,
): Promise<UpdatePolicy | null> {
  try {
    const remoteConfig = getRemoteConfig();
    remoteConfig.settings = {
      minimumFetchIntervalMillis: MIN_FETCH_INTERVAL_MS,
      fetchTimeoutMillis: FETCH_TIMEOUT_MS,
    };
    await fetchAndActivate(remoteConfig);

    const read = (base: string) => valueOf(getString(remoteConfig, parameterName(base, appEnv)));
    return {
      minimum: read(`min_app_version_${platform}`),
      latest: read(`latest_app_version_${platform}`),
      message: read('update_message'),
    };
  } catch {
    return null;
  }
}
