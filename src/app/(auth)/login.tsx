import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { LoginScreen } from '@features/auth';
import { DEMO_LOGIN } from '@/demo/fixtures/screens';

/**
 * Login — Figma `53:174`, built as drawn.
 *
 * The CTA raises the request and navigates to `/otp`, which the NEW Figma designs (`227:1649`).
 * No auth endpoint exists yet, so the request itself is still a seam.
 *
 * The route renders NOTHING but the frame. The Phase 3 review menu used to sit below the fold
 * here; because `LoginScreen` is a `flex: 1` `SafeAreaView`, that content-sized sibling collapsed
 * it and `spoon://login` rendered the menu instead of the screen. The menu now lives at its own
 * `__DEV__` route (`spoon://menu`), and the only thing left on Login is a zero-footprint
 * `__DEV__` tap target in the top-left corner that opens it — invisible so it cannot alter a
 * pixel comparison, but labelled so assistive tech and tests can still find it.
 */
export default function LoginRoute() {
  const router = useRouter();

  return (
    <>
      <LoginScreen
        login={DEMO_LOGIN}
        onRequestOtp={() => {
          // TODO(backend-contract): request the OTP. Sending is the backend's job; the screen it
          // leads to is now designed (`227:1649`), so the navigation is real.
          router.push('/otp' as Href);
        }}
      />

      {__DEV__ ? (
        <Pressable
          style={styles.devHandle}
          onPress={() => router.push('/menu' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Development navigation"
          testID="login-dev-menu-handle"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  /** Absolute, transparent and unpainted: it occupies no layout and draws nothing. */
  devHandle: { position: 'absolute', top: 0, left: 0, width: 44, height: 44 },
});
