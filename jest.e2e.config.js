/**
 * Live-backend integration config.
 *
 * Separate from the default project so `npm test` never depends on a server being up: it matches
 * `*.e2e.ts`, which `jest.config.js` does not.
 *
 * It runs in NODE, not the React Native environment. The RN preset's `fetch` is a polyfill built
 * for a device runtime and does not work headlessly, and these tests exercise the TRANSPORT —
 * envelope unwrapping, zod parsing, error-code preservation — which is plain TypeScript with no
 * React in it. Node's built-in fetch is the right host for that.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.e2e.ts'],
  transform: {
    '^.+\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  // The Expo packages ship untranspiled ESM. `@core/logging` reaches `expo-constants` through
  // the config module, so they have to be transformed rather than ignored.
  transformIgnorePatterns: ['node_modules/(?!(expo|@expo|expo-modules-core|expo-constants)/)'],
  moduleNameMapper: {
    // Native bindings do not exist headlessly, and nothing under test reads app config.
    '^expo-constants$': '<rootDir>/src/test/stubs/expoConstants.js',
    // addressApi uses the public auth feature barrel in the app; map that barrel to its
    // headless API surface here so the live transport check never loads native screens.
    '^@features/auth$': '<rootDir>/src/features/auth/api/authApi.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
  },
  clearMocks: true,
};
