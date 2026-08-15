// Type-only imports: erased at runtime, so they do not break jest.mock factory hoisting.
import type * as ReactTypes from 'react';
import type * as ReactNativeTypes from 'react-native';
import type * as SafeAreaContextTypes from 'react-native-safe-area-context';

/**
 * Global test setup.
 *
 * Native modules are mocked here rather than per-test so that a module under test can import
 * them normally. Anything backend-shaped is deliberately absent — there is no contract to mock.
 */

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    isAvailableAsync: jest.fn(async () => true),
    __reset: () => store.clear(),
  };
});

/**
 * `@expo/vector-icons` loads its font asynchronously and setStates when it resolves, which fires
 * an act() warning in every component test. The glyph itself is not under test — our `Icon`
 * wrapper is — so the family is replaced by a plain Text that forwards all props (including the
 * accessibility props `Icon` sets).
 */
jest.mock('@expo/vector-icons/Feather', () => {
  const ReactNative = jest.requireActual('react-native') as typeof ReactNativeTypes;
  const React = jest.requireActual('react') as typeof ReactTypes;

  return {
    __esModule: true,
    default: ({ name, ...rest }: { name: string }) =>
      React.createElement(ReactNative.Text, rest, name),
  };
});

/**
 * Livvic is loaded natively at runtime. Under Jest there is no font loader, so `useFonts`
 * reports loaded immediately and the TTF modules resolve to inert handles — the typography
 * tokens under test carry a `fontFamily` string, which is asserted directly.
 */
jest.mock('@expo-google-fonts/livvic', () => ({
  __esModule: true,
  useFonts: () => [true, null],
  Livvic_400Regular: 'Livvic_400Regular',
  Livvic_500Medium: 'Livvic_500Medium',
  Livvic_600SemiBold: 'Livvic_600SemiBold',
  Livvic_700Bold: 'Livvic_700Bold',
  Livvic_900Black: 'Livvic_900Black',
}));

/**
 * `SafeAreaProvider` lives at the app root (`src/app/_layout.tsx`), so `useSafeAreaInsets` is
 * valid at runtime. Component tests render a component in isolation, without that provider, and
 * the hook throws rather than defaulting. Only the inset READERS are mocked — `SafeAreaView` and
 * everything else stay real — and they report zero, so no test can pass because an inset padded
 * a layout it should not have.
 */
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual(
    'react-native-safe-area-context',
  ) as typeof SafeAreaContextTypes;

  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        appEnv: 'development',
        apiBaseUrl: 'https://api.test.invalid',
        apiTimeoutMs: 15000,
        logLevel: 'silent',
      },
    },
  },
}));
