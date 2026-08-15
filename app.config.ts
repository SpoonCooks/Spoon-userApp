import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo app config.
 *
 * Values here are NON-SECRET only. `extra` is embedded in the JS bundle in plaintext and is
 * read back at runtime through `expo-constants` in `src/core/config`.
 *
 * NEVER put a key, token or secret in this file or in an EXPO_PUBLIC_* variable.
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
 * Development-only placeholder base URL.
 *
 * `.invalid` is a reserved TLD that can never resolve, so nothing can accidentally talk to it —
 * and nothing tries: no endpoint exists yet, and every screen renders from the dev data seam.
 * Its only job is to satisfy startup config validation so the app can boot on a device for
 * review. **Production still fails fast** when no real base URL is supplied.
 */
const DEV_PLACEHOLDER_API_BASE_URL = 'https://api.spoon.invalid';

const BUNDLE_ID = `com.spoonhelp.userapp${BUNDLE_SUFFIX[APP_ENV]}`;

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
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: SPLASH_BACKGROUND,
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    // Livvic is loaded at runtime in `src/app/_layout.tsx`; the plugin registers the native
    // module that loading depends on.
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: SPLASH_BACKGROUND,
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    ...config.extra,
    appEnv: APP_ENV,
    // TODO(backend-contract): no API base URL exists yet — no backend contract or environment
    // list has been provided. Production keeps failing fast at startup (src/core/config/env.ts)
    // rather than letting an unusable value reach a fetch URL; development falls back to an
    // unresolvable placeholder so the app can boot for UI review.
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      (APP_ENV === 'production' ? '' : DEV_PLACEHOLDER_API_BASE_URL),
    apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000),
    logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL ?? (APP_ENV === 'production' ? 'warn' : 'debug'),
  },
});
