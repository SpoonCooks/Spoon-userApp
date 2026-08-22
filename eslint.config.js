const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

/**
 * Architecture rules encoded here rather than left to convention:
 *
 * 1. Features may not reach into each other's internals — only through the feature barrel.
 *    (FRONTEND_FOUNDATION_PLAN.md §3)
 * 2. `expo-secure-store` may only be imported by `src/core/auth` — one module owns tokens.
 *    (§9)
 * 3. Route files stay thin: no direct API/transport imports from `src/app`. (§3, §4)
 * 4. Development fixtures stay out of production code: only a feature's `data.ts` — the seam that
 *    becomes a React Query hook — the dev-only showcase, and tests may import `src/demo`.
 */
const FEATURE_INTERNALS = [
  {
    group: ['@features/*/*', '@/features/*/*'],
    message: 'Import a feature through its barrel (@features/<name>), never its internals.',
  },
];

const DEMO_FIXTURES = [
  {
    group: ['@/demo', '@/demo/**'],
    message:
      'Development fixtures may only be imported by a feature data.ts, the dev showcase, or tests.',
  },
];

const SECURE_STORE = [
  {
    name: 'expo-secure-store',
    message: 'Only src/core/auth/tokenStore.ts may touch SecureStore. Use the tokenStore module.',
  },
];

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'coverage/**',
      'ios/**',
      'android/**',
      'expo-env.d.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        { patterns: [...FEATURE_INTERNALS, ...DEMO_FIXTURES], paths: SECURE_STORE },
      ],
    },
  },
  {
    // The data seam, the dev-only showcase and the demo module itself may use fixtures.
    files: ['src/features/*/data.ts', 'src/app/(dev)/**/*.tsx', 'src/demo/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: FEATURE_INTERNALS, paths: SECURE_STORE }],
    },
  },
  {
    // The one module allowed to talk to the keychain.
    files: ['src/core/auth/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: FEATURE_INTERNALS }],
    },
  },
  {
    // The logger is the only place a console sink may exist.
    files: ['src/core/logging/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Route files are a map of the product, not a place for logic or transport.
    files: ['src/app/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...FEATURE_INTERNALS,
            {
              group: ['@core/api/*', '@/core/api/*'],
              message: 'Routes must not call transport directly — go through a feature hook.',
            },
          ],
          paths: SECURE_STORE,
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.e2e.ts', 'jest.setup.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['*.js', '*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
