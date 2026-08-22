import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Environment resolution.
 *
 * Parsed once, validated with zod, and fails fast with a readable message rather than letting
 * `undefined` propagate into a fetch URL. (FRONTEND_FOUNDATION_PLAN.md §10)
 */

export const APP_ENVS = ['development', 'staging', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const configSchema = z.object({
  appEnv: z.enum(APP_ENVS),
  /**
   * The API root, host only — no trailing slash, no `/v1`. Validation is intentionally strict
   * so a missing value is loud at startup rather than surfacing as a fetch to "undefined/v1/me".
   */
  apiBaseUrl: z.string().url(),
  apiTimeoutMs: z.number().int().positive(),
  logLevel: z.enum(LOG_LEVELS),
  /**
   * Google Maps platform keys, per platform, for the two HTTPS APIs the app calls from JS —
   * Places (New) and Geocoding. The NATIVE Maps SDKs do not read these: their keys are baked into
   * AndroidManifest.xml and Info.plist by the `react-native-maps` config plugin at build time.
   *
   * Optional, and an absent key is NOT a startup failure: the map and search degrade to their
   * unavailable states while the rest of the address flow — device position, reverse geocoding
   * through the OS, serviceability, saving — keeps working. A blank map must not stop a customer
   * from giving us an address.
   */
  googleMapsAndroidApiKey: z.string().optional(),
  googleMapsIosApiKey: z.string().optional(),
  /** Sent as the app-restriction headers on those requests. Public build facts, not secrets. */
  androidPackage: z.string().optional(),
  iosBundleIdentifier: z.string().optional(),
  /** Uppercase hex, no separators. Empty until the key is restricted; the header is then omitted. */
  androidSigningSha1: z.string().optional(),
});

export type AppConfig = Readonly<z.infer<typeof configSchema>>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Exported for tests; app code should use `getConfig()`. */
export function parseConfig(raw: unknown): AppConfig {
  const result = configSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new ConfigError(
      `Invalid app configuration. Check app.config.ts and your .env file:\n${issues}`,
    );
  }

  return Object.freeze(result.data);
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  if (cached === undefined) {
    cached = parseConfig(Constants.expoConfig?.extra);
  }
  return cached;
}

/** Test-only: clears the memoised config. */
export function resetConfigCache(): void {
  cached = undefined;
}

export function isProduction(): boolean {
  return getConfig().appEnv === 'production';
}
