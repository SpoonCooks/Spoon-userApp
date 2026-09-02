/**
 * The native application identities, pinned for all six environment/platform combinations because
 * either one being wrong is discovered at upload time at the earliest.
 *
 * They USED to disagree in production — Apple on `com.spoonhelp.customer`, Android on
 * `com.spoonhelp.userapp` — and this file's own note gave the reason not to touch it: renaming a
 * package is a new Play listing, not an update. That is exactly right AFTER publishing, and it is
 * why the change was made on 2026-09-02 and not later: the Android app had not been published, so
 * it was the last moment the two could be aligned at all.
 *
 * They are aligned now. Two names for one app meant every external registration keyed on the
 * identity had to be done twice and kept in step — the Maps key restrictions, the Firebase Android
 * app entry, the push sender identity — and each is a silent failure when it drifts: a grey map,
 * or a device token no push can reach. Android moved to Apple's name rather than the reverse,
 * because App Store Connect app 6803578695 is registered under it and cannot change.
 *
 * The original warning still stands for the future: once `com.spoonhelp.customer` is on Play, this
 * value is permanent. A test failure here is the intended alarm, not a line to update.
 *
 * The `extra` copies are pinned against the native values too. They are not decoration: the Places
 * and Geocoding REST calls send them as `X-Android-Package` / `X-Ios-Bundle-Identifier`, and an
 * application-restricted Maps key answers `403` the moment they disagree with the build's real
 * identity — a failure that looks like a broken map, not like a config drift.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ENVS = ['development', 'staging', 'production'] as const;
type AppEnv = (typeof APP_ENVS)[number];

const EXPECTED_IDENTITIES: Record<AppEnv, { android: string; ios: string }> = {
  development: {
    android: 'com.spoonhelp.userapp.dev',
    ios: 'com.spoonhelp.userapp.dev',
  },
  staging: {
    android: 'com.spoonhelp.userapp.staging',
    ios: 'com.spoonhelp.userapp.staging',
  },
  production: {
    android: 'com.spoonhelp.customer',
    ios: 'com.spoonhelp.customer',
  },
};

const EAS_PROJECT_ID = 'bab1e270-8234-46ea-85d0-37c40dee92e1';

type AppConfigModule = { default: (context: ConfigContext) => ExpoConfig };

type RuntimeExtra = {
  androidPackage: string;
  iosBundleIdentifier: string;
  eas: { projectId: string };
};

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

/**
 * `app.config.ts` reads `APP_ENV` once, at module load, so every environment needs a fresh module
 * registry rather than a second call.
 *
 * The Maps placeholders are not credentials — production refuses to evaluate at all with blank
 * keys, and these only get past that guard so the identities underneath can be read.
 */
function resolveConfig(appEnv: AppEnv): ExpoConfig {
  const previous = {
    APP_ENV: process.env.APP_ENV,
    GOOGLE_MAPS_ANDROID_API_KEY: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
    GOOGLE_MAPS_IOS_API_KEY: process.env.GOOGLE_MAPS_IOS_API_KEY,
  };

  setEnv('APP_ENV', appEnv);
  setEnv('GOOGLE_MAPS_ANDROID_API_KEY', 'placeholder-android-maps-key');
  setEnv('GOOGLE_MAPS_IOS_API_KEY', 'placeholder-ios-maps-key');

  try {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appConfig = require('../../app.config') as AppConfigModule;
    return appConfig.default({ config: {} } as unknown as ConfigContext);
  } finally {
    setEnv('APP_ENV', previous.APP_ENV);
    setEnv('GOOGLE_MAPS_ANDROID_API_KEY', previous.GOOGLE_MAPS_ANDROID_API_KEY);
    setEnv('GOOGLE_MAPS_IOS_API_KEY', previous.GOOGLE_MAPS_IOS_API_KEY);
  }
}

function runtimeExtra(config: ExpoConfig): RuntimeExtra {
  return config.extra as RuntimeExtra;
}

describe('app.config application identities', () => {
  describe.each([...APP_ENVS])('%s', (appEnv) => {
    const expected = EXPECTED_IDENTITIES[appEnv];

    it(`builds android.package as ${expected.android}`, () => {
      expect(resolveConfig(appEnv).android?.package).toBe(expected.android);
    });

    it(`builds ios.bundleIdentifier as ${expected.ios}`, () => {
      expect(resolveConfig(appEnv).ios?.bundleIdentifier).toBe(expected.ios);
    });

    it('carries both identities into extra unchanged, so the Maps headers match the build', () => {
      const config = resolveConfig(appEnv);
      const extra = runtimeExtra(config);

      expect(extra.androidPackage).toBe(config.android?.package);
      expect(extra.iosBundleIdentifier).toBe(config.ios?.bundleIdentifier);
    });
  });

  it('keeps the platforms on one identifier outside production', () => {
    for (const appEnv of ['development', 'staging'] as const) {
      const config = resolveConfig(appEnv);

      expect(config.ios?.bundleIdentifier).toBe(config.android?.package);
    }
  });

  it('gives both platforms the Apple App ID in production', () => {
    const config = resolveConfig('production');

    // This assertion was `not.toBe` until 2026-09-02, when the two were aligned. The equality is
    // the point now: one identity is what keeps the Maps restrictions, the Firebase app entry and
    // the push sender from having to be registered twice and kept in step.
    expect(config.ios?.bundleIdentifier).toBe('com.spoonhelp.customer');
    expect(config.android?.package).toBe('com.spoonhelp.customer');
    expect(config.ios?.bundleIdentifier).toBe(config.android?.package);
  });

  it('leaves the EAS project and the Expo slug untouched', () => {
    const config = resolveConfig('production');

    expect(runtimeExtra(config).eas.projectId).toBe(EAS_PROJECT_ID);
    expect(config.slug).toBe('spoon-user-app');
  });
});
