import { ConfigError, parseConfig } from './env';

const VALID = {
  appEnv: 'development',
  apiBaseUrl: 'https://api.spoonhelp.test',
  apiTimeoutMs: 15000,
  logLevel: 'debug',
};

describe('parseConfig', () => {
  it('accepts a complete configuration and freezes it', () => {
    const config = parseConfig(VALID);

    expect(config.appEnv).toBe('development');
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('fails fast when the API base URL is missing', () => {
    // This is the intended state today: no backend contract, so no base URL exists.
    expect(() => parseConfig({ ...VALID, apiBaseUrl: '' })).toThrow(ConfigError);
  });

  it('fails fast on a malformed API base URL rather than letting it reach fetch', () => {
    expect(() => parseConfig({ ...VALID, apiBaseUrl: 'not-a-url' })).toThrow(ConfigError);
  });

  it('rejects unknown environments and log levels', () => {
    expect(() => parseConfig({ ...VALID, appEnv: 'qa' })).toThrow(ConfigError);
    expect(() => parseConfig({ ...VALID, logLevel: 'verbose' })).toThrow(ConfigError);
  });

  it('rejects a non-positive timeout', () => {
    expect(() => parseConfig({ ...VALID, apiTimeoutMs: 0 })).toThrow(ConfigError);
  });

  it('names the offending field in the error message', () => {
    expect(() => parseConfig({ ...VALID, apiBaseUrl: undefined })).toThrow(/apiBaseUrl/);
  });

  it('rejects a completely absent config', () => {
    expect(() => parseConfig(undefined)).toThrow(ConfigError);
  });
});
