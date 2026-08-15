/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
  },
  collectCoverageFrom: ['src/core/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/index.ts'],
  clearMocks: true,
};
