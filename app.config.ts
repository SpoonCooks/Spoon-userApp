import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo app config.
 *
 * Values here are NON-SECRET only. `extra` is embedded in the JS bundle in plaintext and is
 * read back at runtime through `expo-constants` in `src/core/config`.
 *
 * NEVER write a key, token or secret INTO this file, and never put a server-side secret in
 * `extra` or in an EXPO_PUBLIC_* variable.
 *
 * The Google Maps platform keys below are the one deliberate exception, and they are not an
 * exception to the rule above: they are read from the ENVIRONMENT (never committed), and a Maps
 * client key is not a secret — it is a public identifier made safe by an APPLICATION RESTRICTION
 * in Google Cloud, exactly like a Razorpay publishable key. The backend's Google Routes key is a
 * true secret and is never read here.
 */

const APP_ENVS = ['development', 'staging', 'production'] as const;
type AppEnv = (typeof APP_ENVS)[number];

function resolveAppEnv(value: string | undefined): AppEnv {
  const found = APP_ENVS.find((env) => env === value);
  return found ?? 'development';
}

const APP_ENV = resolveAppEnv(process.env.APP_ENV);

const ENV_SUFFIX: Record<AppEnv, string> = {
  development: ' (Dev)',
  staging: ' (Staging)',
  production: '',
};

const BUNDLE_SUFFIX: Record<AppEnv, string> = {
  development: '.dev',
  staging: '.staging',
  production: '',
};

// docs/FIGMA_DESIGN_TOKENS.md — `color/grey/98`, the app's dominant warm off-white background.
const SPLASH_BACKGROUND = '#FFFDF5';

/**
 * The deployed API, used when no `EXPO_PUBLIC_API_BASE_URL` is supplied in development.
 *
 * A developer who has not written a `.env` gets the real staging deployment rather than an
 * unresolvable placeholder, which is the behaviour that makes "clone and run" work now that a
 * backend exists. Point it at `http://127.0.0.1:3000` (with `adb reverse`) to develop against a
 * local API — see `.env.example`.
 *
 * **Production still fails fast** when no base URL is supplied: a release build must be told
 * explicitly which environment it is talking to, never defaulted into one.
 */
const DEV_FALLBACK_API_BASE_URL = 'https://spoon-api-kalc.onrender.com';

/**
 * Native application identities — PER PLATFORM, deliberately not one shared constant.
 *
 * The Apple App ID registered for release is `com.spoonhelp.customer`, which does not match the
 * Android package. Android stays on `com.spoonhelp.userapp`: a package rename is a new listing on
 * Play rather than an update, so the two platforms diverge in production and only in production.
 *
 *                 Android                         iOS
 *   development   com.spoonhelp.userapp.dev       com.spoonhelp.userapp.dev
 *   staging       com.spoonhelp.userapp.staging   com.spoonhelp.userapp.staging
 *   production    com.spoonhelp.userapp           com.spoonhelp.customer
 *
 * Both also travel in `extra`, because the Places / Geocoding REST calls send them as
 * `X-Android-Package` / `X-Ios-Bundle-Identifier` so an application-restricted Maps key keeps
 * working. The iOS key's restriction must therefore list `com.spoonhelp.customer` before a release
 * build can render a map — see docs/GOOGLE_MAPS_CONFIGURATION.md.
 */
const ANDROID_PACKAGE = `com.spoonhelp.userapp${BUNDLE_SUFFIX[APP_ENV]}`;

const IOS_BUNDLE_IDENTIFIER =
  APP_ENV === 'production'
    ? 'com.spoonhelp.customer'
    : `com.spoonhelp.userapp${BUNDLE_SUFFIX[APP_ENV]}`;

/**
 * Google Maps platform keys.
 *
 * Supplied ONLY through the environment (`.env`, which is gitignored) — never written into this
 * file, never committed. They are read here because two of the three consumers are NATIVE and can
 * only be configured at build time:
 *
 *   Maps SDK for Android  `com.google.android.geo.API_KEY` meta-data in AndroidManifest.xml
 *   Maps SDK for iOS      `GMSServices.provideAPIKey` in the AppDelegate, via Info.plist
 *   Places / Geocoding    HTTPS from JS, so the key has to reach the bundle through `extra`
 *
 * That last one means the key IS readable in a shipped build. That is inherent to calling Google's
 * web services from a client, and it is why the key must carry an APPLICATION restriction in Google
 * Cloud (Android: package + SHA-1; iOS: bundle id) — the restriction, not secrecy, is what makes a
 * client key safe. See docs/GOOGLE_MAPS_CONFIGURATION.md.
 *
 * These are NOT the backend's Google Routes key, which stays on the backend and is never read here.
 */
const GOOGLE_MAPS_ANDROID_API_KEY = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '';

const GOOGLE_MAPS_IOS_API_KEY = process.env.GOOGLE_MAPS_IOS_API_KEY ?? '';

/**
 * The signing certificate SHA-1 of the build being produced, uppercase hex WITHOUT separators.
 *
 * Sent as `X-Android-Cert` on Places and Geocoding requests, which is what makes an
 * "Android apps"-restricted key accept a REST call from JS (the native SDKs send it themselves).
 * Optional, because the header is only needed once the key is actually restricted — and because
 * it DIFFERS between the debug keystore and the release one, so it cannot be hardcoded.
 *
 *   debug:    keytool -list -v -keystore android/app/debug.keystore
 *                     -storepass android -alias androiddebugkey
 *   any APK:  apksigner verify --print-certs <apk>
 */
const ANDROID_SIGNING_SHA1 = (process.env.ANDROID_SIGNING_SHA1 ?? '')
  .replace(/[^0-9a-fA-F]/g, '')
  .toUpperCase();

/**
 * Android FCM credentials — `google-services.json`, supplied by PATH and never committed.
 *
 * `expo-notifications` gets an Android device token from Firebase, and Firebase needs this file
 * baked into the native project. Without it `getDevicePushTokenAsync` cannot return a token, the
 * push provider reports "no token", and registration is skipped — which is the correct fail-closed
 * behaviour, but it means push does not work at all.
 *
 * Supplied through the environment rather than checked in because the file carries the project's
 * Firebase identifiers and is regenerated per app package. An absent value simply omits the key,
 * so a build without Firebase still succeeds and still runs.
 *
 * iOS needs an APNs key uploaded to EAS instead; there is no file to reference here, which is why
 * only Android has one.
 */
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON ?? '';

/**
 * Production refuses to build without them, for the same reason it refuses without an API base
 * URL: a release that silently ships a blank map key renders a grey square on every customer's
 * address screen and no one finds out until support does. Development is allowed to continue —
 * the map degrades to its "unavailable" state and the rest of the flow still works.
 */
if (
  APP_ENV === 'production' &&
  (GOOGLE_MAPS_ANDROID_API_KEY === '' || GOOGLE_MAPS_IOS_API_KEY === '')
) {
  throw new Error(
    'GOOGLE_MAPS_ANDROID_API_KEY and GOOGLE_MAPS_IOS_API_KEY must be set for a production build. ' +
      'Supply them in the environment; never commit them.',
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: `Spoon${ENV_SUFFIX[APP_ENV]}`,
  slug: 'spoon-user-app',
  version: '0.1.0',

  orientation: 'portrait',

  // Native only — the web target and its peers were removed as unused.
  platforms: ['ios', 'android'],

  scheme: 'spoon',
  userInterfaceStyle: 'light',

  icon: './assets/images/icon.png',

  ios: {
    bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
    supportsTablet: false,
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'Spoon does not access your photo library directly. This declaration is required for compatibility with a bundled system component.',
    },
  },

  android: {
    package: ANDROID_PACKAGE,

    ...(GOOGLE_SERVICES_JSON === '' ? {} : { googleServicesFile: GOOGLE_SERVICES_JSON }),

    adaptiveIcon: {
      backgroundColor: SPLASH_BACKGROUND,
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },

    predictiveBackGestureEnabled: false,
  },

  plugins: [
    // Pins the Android NDK. `expo-root-project` defaults to 27.1.12297006, whose copy on the
    // build machine is a damaged package shipping clang 17 — which cannot compile
    // react-native-reanimated's constrained partial specialisations, nor React Native's own
    // `std::format`. See plugins/withNdkVersion.js for the measurements behind the choice.
    './plugins/withNdkVersion',

    'expo-router',

    // Livvic is loaded at runtime in `src/app/_layout.tsx`; the plugin registers the native
    // module that loading depends on.
    'expo-font',

    /**
     * Push. The JS side is already wired — registration, the rotation listener, the received
     * handler and the tap-to-route deep link all live in `@features/notifications` — but every
     * one of them needs the NATIVE module, and on iOS the plugin is also what adds the
     * `aps-environment` entitlement and the remote-notification background mode.
     *
     * No icon or colour is configured, deliberately: the design does not specify a notification
     * icon, and choosing one here would be a visual decision made in a build file.
     */
    'expo-notifications',

    [
      'expo-splash-screen',
      {
        backgroundColor: SPLASH_BACKGROUND,
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],

    [
      // The address step (`53:31`) needs the customer's coordinates so the BACKEND can decide
      // serviceability. Foreground only — Spoon has no reason to track anyone in the background,
      // and asking for it would be both a review risk and a privacy one.
      'expo-location',
      {
        locationWhenInUsePermission:
          'Spoon uses your location to find your address and check whether we serve your area.',
        isAndroidBackgroundLocationEnabled: false,
        isIosBackgroundLocationEnabled: false,
      },
    ],

    [
      // The map canvas on `53:31`. `react-native-maps` ships its own Expo config plugin, and
      // these two props are its official surface: `androidGoogleMapsApiKey` writes the
      // `com.google.android.geo.API_KEY` manifest meta-data, `iosGoogleMapsApiKey` writes
      // Info.plist AND adds the GoogleMaps AppDelegate import/init plus the CocoaPods entry.
      //
      // APPENDED, never substituted: `./plugins/withNdkVersion` must keep running (it pins the
      // NDK this machine can actually compile with) and every other plugin above is unchanged.
      'react-native-maps',
      {
        androidGoogleMapsApiKey: GOOGLE_MAPS_ANDROID_API_KEY,
        iosGoogleMapsApiKey: GOOGLE_MAPS_IOS_API_KEY,
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    ...config.extra,

    /**
     * Links this local Expo project to the EAS project:
     *
     * @lakshay-spoon/spoon-user-app
     *
     * This is a public project identifier, not a secret.
     */
    eas: {
      projectId: 'bab1e270-8234-46ea-85d0-37c40dee92e1',
    },

    appEnv: APP_ENV,

    // Production keeps failing fast at startup (`src/core/config/env.ts`) rather than letting an
    // unusable value reach a fetch URL; development falls back to the deployed API.
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      (APP_ENV === 'production' ? '' : DEV_FALLBACK_API_BASE_URL),

    apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000),

    logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL ?? (APP_ENV === 'production' ? 'warn' : 'debug'),

    /**
     * Places (New) and Geocoding are HTTPS APIs called from JS, so their key must be in the
     * bundle. Both platforms' keys are carried and the RUNTIME picks by `Platform.OS`, because
     * `extra` is shared across platforms and this config is evaluated once.
     *
     * Deliberately NOT an `EXPO_PUBLIC_` variable: those are inlined into every module that reads
     * `process.env`, which would scatter the key through the bundle. Routed through `extra` it has
     * exactly one reader — `src/features/address/location/googlePlaces.ts`.
     */
    googleMapsAndroidApiKey: GOOGLE_MAPS_ANDROID_API_KEY,

    googleMapsIosApiKey: GOOGLE_MAPS_IOS_API_KEY,

    /**
     * Sent as `X-Android-Package` / `X-Android-Cert` / `X-Ios-Bundle-Identifier` on every Places
     * and Geocoding request, so an APPLICATION-restricted key keeps working from the app. Both are
     * public facts about the build (anyone can read them out of the APK); carrying them is what
     * lets the key be locked down in Google Cloud without another release.
     */
    androidPackage: ANDROID_PACKAGE,
    iosBundleIdentifier: IOS_BUNDLE_IDENTIFIER,
    androidSigningSha1: ANDROID_SIGNING_SHA1,
  },
});
