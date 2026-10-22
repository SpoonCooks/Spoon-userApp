/**
 * iOS lets an app ask `canOpenURL` only for schemes it declares in `LSApplicationQueriesSchemes`.
 * Razorpay Checkout relies on that to find the installed UPI apps, so a build without the list
 * shows no GPay, PhonePe or Paytm at all — no error, just an empty UPI section. That is what the
 * production iOS app did until this list reached `main`, and nothing else would catch it coming
 * back: the generated `Info.plist` is never committed, and checkout still works by UPI ID.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ENVS = ['development', 'staging', 'production'] as const;
type AppEnv = (typeof APP_ENVS)[number];

/** The schemes Razorpay's iOS SDK looks for, plus CRED and BHIM — the list `dev` also declares. */
const UPI_SCHEMES = ['phonepe', 'tez', 'paytmmp', 'credpay', 'bhim'];

type AppConfigModule = { default: (context: ConfigContext) => ExpoConfig };

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

/** `app.config.ts` reads `APP_ENV` at module load, so each environment needs a fresh registry. */
function resolveConfig(appEnv: AppEnv): ExpoConfig {
  const previous = {
    APP_ENV: process.env.APP_ENV,
    GOOGLE_MAPS_ANDROID_API_KEY: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
    GOOGLE_MAPS_IOS_API_KEY: process.env.GOOGLE_MAPS_IOS_API_KEY,
  };

  setEnv('APP_ENV', appEnv);
  // Not credentials: production refuses to evaluate with blank keys, and these only get past it.
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

describe('iOS UPI app schemes', () => {
  it.each([...APP_ENVS])('declares every UPI scheme Checkout looks for in %s', (appEnv) => {
    const schemes = resolveConfig(appEnv).ios?.infoPlist?.['LSApplicationQueriesSchemes'];

    expect(schemes).toEqual(expect.arrayContaining(UPI_SCHEMES));
  });
});
