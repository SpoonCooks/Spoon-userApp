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
   * TODO(backend-contract): no API base URL exists — no backend contract has been provided.
   * Validation is intentionally strict so the missing value is loud at startup, not silent.
   */
  apiBaseUrl: z.string().url(),
  apiTimeoutMs: z.number().int().positive(),
  logLevel: z.enum(LOG_LEVELS),
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
