import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

import { LOADING_INTRO_HERO, LOADING_INTRO_LOGO, LOADING_SPLASH_LOGO, Text, lightTheme } from '@ui';

/**
 * The two DESIGNED loading surfaces — Figma `73:1036` (splash) and `71:747` (interstitial).
 *
 * These replace a generic spinner wherever a whole screen is waiting. Task §13: the file draws
 * real loading states, so they are used rather than approximated with the shared `Skeleton`.
 *
 * BOUNDARY: neither screen decides anything. The splash animation finishing is a VISUAL event —
 * `onFinished` is optional and the app's readiness is still governed by `src/app/_layout.tsx`,
 * which holds until the session resolves and Livvic has loaded. A timer here never advances
 * navigation on its own (FRONTEND_FOUNDATION_PLAN.md §18).
 */

/* ------------------------------------------------------------------------- splash */

/** `74:27` — the logo scales 1 → 6.4 over 2s on an ease-out curve, zooming into the app. */
const SPLASH_SCALE_TO = 6.4;
const SPLASH_DURATION_MS = 2000;

export interface SplashLoadingProps {
  /** Purely a visual callback. The host decides whether it means anything. */
  readonly onFinished?: () => void;
  /** Disables the zoom — used by tests and by reduced-motion hosts. */
  readonly animate?: boolean;
  readonly testID?: string;
}

export function SplashLoading({
  onFinished,
  animate = true,
  testID = 'splash-loading',
}: SplashLoadingProps) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!animate) {
      onFinished?.();
      return;
    }

    const animation = Animated.timing(scale, {
      toValue: SPLASH_SCALE_TO,
      duration: SPLASH_DURATION_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) onFinished?.();
    });

    return () => animation.stop();
  }, [animate, onFinished, scale]);

  return (
    <View
      style={styles.splash}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Spoon"
      accessibilityState={{ busy: true }}
    >
      <Animated.Image
        source={LOADING_SPLASH_LOGO}
        style={[styles.splashLogo, { transform: [{ scale }] }]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/* ------------------------------------------------------------------- interstitial */

export interface IntroLoadingProps {
  /** `73:1062` — "Best cooks in town!". Supplied so the line can be varied per surface. */
  readonly headline?: string;
  readonly testID?: string;
}

export function IntroLoading({
  headline = 'Best cooks in town!',
  testID = 'intro-loading',
}: IntroLoadingProps) {
  return (
    <View
      style={styles.intro}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={headline}
      accessibilityState={{ busy: true }}
    >
      <Image
        source={LOADING_INTRO_LOGO}
        style={styles.introLogo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />

      <Text variant="displayHero" color="textPrimary" align="right" style={styles.introHeadline}>
        {headline}
      </Text>

      <Image
        source={LOADING_INTRO_HERO}
        style={styles.introHero}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /** `73:1040` — `canary` at 70%, edge to edge, the logo dead centre. */
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceSplash,
  },
  /** `74:27` — 179 × 179. */
  splashLogo: { width: 179, height: 179 },
  /** `71:887` — a flat `#EAF086` ground. */
  intro: { flex: 1, alignItems: 'center', backgroundColor: lightTheme.colors.surfaceLoading },
  /** `73:1035` — 130 × 130, centred, 39.5pt down. */
  introLogo: { width: 130, height: 130, marginTop: 39.5 },
  /** `73:1062` — Livvic Black 36/45 at −0.9, right-aligned 21pt in from the edge. */
  introHeadline: { alignSelf: 'stretch', paddingRight: 21, marginTop: 23 },
  /** `73:894` — full width from y 273 to past the frame bottom; cropped, never stretched. */
  introHero: { alignSelf: 'stretch', flex: 1, minHeight: 300, marginTop: 58, width: '100%' },
});
