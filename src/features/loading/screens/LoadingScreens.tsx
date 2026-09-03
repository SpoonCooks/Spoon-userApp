import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  LOADING_CONFIRMATION_PROGRESS,
  LOADING_INTRO_HERO,
  LOADING_INTRO_LOGO,
  LOADING_SPLASH_LOGO,
  Text,
  gradientAxis,
  lightTheme,
} from '@ui';

/**
 * The two DESIGNED loading surfaces — Figma `73:1036` (splash) and `71:747` (interstitial).
 *
 * These replace a generic spinner wherever a whole screen is waiting. Task §13: the file draws
 * real loading states, so they are used rather than approximated with the shared `Skeleton`.
 *
 * BOUNDARY: neither screen decides anything. Readiness is governed by `src/app/_layout.tsx`,
 * which holds until the session resolves and Livvic has loaded. Nothing here advances navigation
 * (FRONTEND_FOUNDATION_PLAN.md §18).
 */

/* ------------------------------------------------------------------------- splash */

/**
 * `73:1036` "Page 0- loading page" — REWORKED in the current file.
 *
 * v4 drew a 179 × 179 mark (`74:27`) on a flat `canaryWash` ground. `74:27` no longer exists.
 * The finalized frame is:
 *
 *   `73:1039`  white ground, the full 370 × 764 viewport
 *   `73:1040`  370 × 761 diagonal wash at 154.26° — `gradients.splash`
 *   `313:3159` 370 × 370 brand logo at y 196.5, `object-cover`, FULL viewport width
 *
 * 196.5 = (764 − 370) / 2 to within half a point, so the square is exactly centred in the
 * viewport and spans it edge to edge. It is therefore drawn as a MEASURED square — `box.width`
 * on both axes — centred between the safe-area insets, rather than at a fixed 370 × 370.
 *
 * The size has to come from the measurement. An `Image` carries an intrinsic size, and neither
 * `width: '100%'` nor `alignSelf: 'stretch'` + `aspectRatio` constrained it here: the asset fell
 * back to its own 1110px and drew at ~3× the screen, cropped to the fork and two tomatoes. Both
 * were caught on the handset, not in review.
 *
 * FULL-BLEED: the frame paints white behind its mock status bar because the mock draws one. On a
 * device that would leave a white strip above the wash, so the gradient is taken edge to edge and
 * only the LOGO is centred against the insets — the frame's own geometry, without the mock's
 * chrome.
 *
 * MOTION: `get_motion_context` returns no animated nodes for `73:1036`, and the logo now fills the
 * viewport width, so v4's invented 1 → 6.4 zoom is removed rather than re-pointed at a mark that
 * has nowhere left to grow into. The surface is static, as drawn.
 */
const SPLASH = lightTheme.gradients.splash;

export interface SplashLoadingProps {
  readonly testID?: string;
}

export function SplashLoading({ testID = 'splash-loading' }: SplashLoadingProps) {
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };

  const axis = gradientAxis(SPLASH.angleDeg, box.width, box.height);

  return (
    <View
      style={styles.splash}
      onLayout={onLayout}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Spoon"
      accessibilityState={{ busy: true }}
    >
      <LinearGradient
        colors={SPLASH.colors}
        locations={SPLASH.locations}
        start={axis.start}
        end={axis.end}
        style={styles.fill}
      />

      <View
        style={[styles.splashViewport, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        pointerEvents="none"
      >
        <Image
          source={LOADING_SPLASH_LOGO}
          style={{ width: box.width, height: box.width }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
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

/* ------------------------------------------------------ confirmation in progress */

/**
 * `433:2290` "Page 21- confirmation loading" — NEW in the final file.
 *
 * The frame, re-read off the nodes on 2026-08-31 — the founder reported this screen had changed,
 * and it had. The mark is a DIFFERENT node at three times the size:
 *   `433:2291`  the 370 × 835 viewport
 *   `433:2304`  a 338 × 278.32 block at y 278.34, vertically centred in the viewport
 *   `526:283`   the 220.66 × 216.32 progress mark, centred (x 58.67 = (338 − 220.66) / 2), 6pt
 *               down. This REPLACES the old 72 × 72 `433:2308`, which no longer exists.
 *   `433:2313`  a 44pt box 6pt below it, holding `433:2315` "Confirmation in progress ..." —
 *               28pt line, centred
 *
 * ARTWORK GAP — the bundled `confirmation-progress.png` is the SUPERSEDED mark: lime, with round
 * dots. `526:283` is two-tone green with rectangular dashes and a darker green tick. Exporting it
 * needs `assets/figma/loading` added to Figma Dev Mode's allowed-directories list, which only the
 * file's owner can do, so the geometry below is correct and the image is not yet.
 *
 * There is NO header, no back control and no CTA. That is the point of the screen: it is the few
 * seconds between a verified payment and a booking the server has confirmed (V7 founder comment,
 * task §9), and there is nothing to do on it.
 *
 * MOTION — static. `get_motion_context` returns no animated nodes for `433:2290`, so the mark is
 * rendered exactly as supplied by the design. The detached segments are part of the artwork, not
 * a runtime spinner; rotating the whole image made the confirmation screen move when it should
 * have been fixed.
 *
 * BOUNDARY: this component renders. It does not poll, does not decide that a booking is
 * confirmed, and does not navigate — see `app/(app)/booking/confirming.tsx`, which owns all three
 * and reads them off the server.
 */
export interface ConfirmationLoadingProps {
  /** `433:2315` — "Confirmation in progress ...", the frame's own words, ellipsis included. */
  readonly title?: string;
  readonly testID?: string;
}

export function ConfirmationLoading({
  title = 'Confirmation in progress ...',
  testID = 'confirmation-loading',
}: ConfirmationLoadingProps) {
  return (
    <View
      style={styles.confirming}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={title}
      accessibilityState={{ busy: true }}
    >
      {/* `433:2304` — the centred block. */}
      <View style={styles.confirmingBlock}>
        <Image
          source={LOADING_CONFIRMATION_PROGRESS}
          style={styles.confirmingMark}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          testID={`${testID}-mark`}
        />

        <View style={styles.confirmingTitle}>
          <Text variant="titleLead" color="textPrimary" align="center">
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `73:1039` — the white ground the 70 % stops of `73:1040` are computed over. */
  splash: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceSplash,
  },
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  /** The frame's 370 × 764 content box — the wash runs past it, the logo does not. */
  splashViewport: { flex: 1, justifyContent: 'center' },
  /** `71:887` — a flat `#EAF086` ground. */
  intro: { flex: 1, alignItems: 'center', backgroundColor: lightTheme.colors.surfaceLoading },
  /** `73:1035` — 130 × 130, centred, 39.5pt down. */
  introLogo: { width: 130, height: 130, marginTop: 39.5 },
  /** `73:1062` — Livvic Black 36/45 at −0.9, right-aligned 21pt in from the edge. */
  introHeadline: { alignSelf: 'stretch', paddingRight: 21, marginTop: 23 },
  /** `73:894` — full width from y 273 to past the frame bottom; cropped, never stretched. */
  introHero: { alignSelf: 'stretch', flex: 1, minHeight: 300, marginTop: 58, width: '100%' },
  /** `433:2291` — a plain white viewport; the block is centred on both axes. */
  confirming: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  /** `433:2304` — 338 wide, py 6, 6pt between the mark and the title. */
  confirmingBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.s6,
    gap: lightTheme.space.s6,
  },
  /** `433:2308` — 72 x 72. */
  /** `526:283` — 220.66 × 216.32, superseding the 72 × 72 mark this screen used to draw. */
  confirmingMark: { width: 220.66, height: 216.32 },
  /** `433:2313` — a 44pt box around the 28pt line, i.e. 8pt above and below. */
  confirmingTitle: {
    alignSelf: 'stretch',
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: lightTheme.space.sm,
  },
});
