import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

/**
 * The designed launch splash, drawn from inside the app -- Android's half of it.
 *
 * iOS shows `splash-background-ios.png` full-bleed from its launch storyboard. Android 12+ cannot:
 * its OS-level splash is a flat colour and an icon, nothing else. So Android's system splash is
 * the gradient's top yellow with a transparent icon (see `app.config.ts`), and this view takes over
 * the moment it can, drawing the same artwork edge to edge until the app is ready to show its
 * first screen, then fading out.
 *
 * ## The hand-over
 *
 * `onShown` fires once the artwork has loaded (or failed to, or 1.5 s have passed -- whichever is
 * first), and that is the caller's cue to release the system splash. Releasing it any earlier
 * would show the app's blank window for a frame; waiting for a promise that never settles would
 * strand the customer on a flat yellow screen, hence the timeout.
 *
 * ## Seen long enough
 *
 * Once the app is ready the artwork fades out -- but not before it has been on screen for
 * `MIN_VISIBLE_MS`. A cold start with nothing to wait for (no session to restore) would otherwise
 * flash the designed splash for a fraction of a second, which reads as a glitch rather than a
 * launch screen.
 *
 * ## Why the fallback colour
 *
 * `#FFD600` is the same yellow the system splash already shows, so if the image is slow to decode
 * the screen simply stays yellow instead of flashing.
 */

const ARTWORK = require('../../../assets/images/splash-background-ios.png') as ImageSourcePropType;
const FALLBACK_COLOUR = '#FFD600';
const FADE_MS = 250;
const SHOWN_TIMEOUT_MS = 1500;
/** Long enough to be seen. Without it, a launch with nothing to wait for shows the artwork for a blink. */
const MIN_VISIBLE_MS = 600;

export interface LaunchSplashProps {
  /** The app can draw its first screen; start fading out. */
  readonly ready: boolean;
  /** The artwork is on screen, so the system splash can be released. */
  readonly onShown: () => void;
  /** The fade has finished; stop rendering this view. */
  readonly onDone: () => void;
}

export function LaunchSplash({ ready, onShown, onDone }: LaunchSplashProps) {
  const [opacity] = useState(() => new Animated.Value(1));
  const shown = useRef(false);
  const minTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Held in refs so a caller's inline callbacks cannot restart the timer or the fade.
  const onShownRef = useRef(onShown);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onShownRef.current = onShown;
    onDoneRef.current = onDone;
  }, [onShown, onDone]);

  const [seenLongEnough, setSeenLongEnough] = useState(false);

  const reportShown = useCallback(() => {
    if (shown.current) return;
    shown.current = true;
    onShownRef.current();
    minTimer.current = setTimeout(() => setSeenLongEnough(true), MIN_VISIBLE_MS);
  }, []);

  useEffect(() => {
    const timer = setTimeout(reportShown, SHOWN_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(minTimer.current);
    };
  }, [reportShown]);

  useEffect(() => {
    if (!ready || !seenLongEnough) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
  }, [ready, seenLongEnough, opacity]);

  return (
    <Animated.View
      style={[styles.fill, { opacity }]}
      pointerEvents={ready ? 'none' : 'auto'}
      testID="launch-splash"
    >
      <Image
        source={ARTWORK}
        style={styles.art}
        resizeMode="cover"
        onLoadEnd={reportShown}
        accessibilityIgnoresInvertColors
        testID="launch-splash-art"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /**
   * Explicit 100% width AND height, not just absolute insets: React Native gives a local image its
   * file's own pixel size as a default, and an explicit width/height beats `left`/`right` -- so
   * without these the artwork is laid out at 1110 x 2283 and only its top-left corner is on screen.
   */
  art: { width: '100%', height: '100%' },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: FALLBACK_COLOUR,
  },
});
