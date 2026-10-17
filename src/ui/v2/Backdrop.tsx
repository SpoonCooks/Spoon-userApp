import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';

/**
 * The blurred scrim the frames draw under every sheet and dialog: what is behind is blurred
 * (`BACKGROUND_BLUR` 12, e.g. `542:1499`) and dimmed with black on top (owner, 2026-10-16).
 *
 * iOS blurs whatever sits behind the view. Android can only blur a view it is pointed at, so the
 * app's screens are wrapped once in `BackdropTargetRoot` (the root layout) and every scrim blurs
 * that, including from inside a `Modal`, which opens in its own window.
 */
const BackdropTarget = createContext<RefObject<View | null> | null>(null);

/** Wraps the app's screens: the view every scrim blurs on Android. */
export function BackdropTargetRoot({ children }: { readonly children: ReactNode }) {
  const target = useRef<View>(null);
  return (
    <BackdropTarget.Provider value={target}>
      <BlurTargetView ref={target} style={styles.root} collapsable={false}>
        {children}
      </BlurTargetView>
    </BackdropTarget.Provider>
  );
}

/**
 * Android divides `intensity` by `blurReductionFactor` (4) to get the radius: 32 is an 8pt blur,
 * a little softer than the frames' 12 (owner, 2026-10-16). iOS reads the same number as the
 * effect's strength.
 */
const BLUR_INTENSITY = 32;

/**
 * Fills its parent with the blur and the dim. Put it first inside the scrim, with the sheet or
 * dialog after it. `dim` is the black on top, 0.4 in most frames.
 */
export function BlurredScrim({
  dim = 0.4,
  style,
}: {
  readonly dim?: number;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const target = useContext(BackdropTarget);
  /*
   * Android's blur draws a copy of the screen behind it. After the app has been in the background
   * (the Play Store, a UPI app) that copy came back empty: a flat grey sheet over nothing (owner,
   * 2026-10-17). Remounting the blur on the way back to the foreground draws it afresh.
   */
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setGeneration((value) => value + 1);
    });
    return () => subscription.remove();
  }, []);
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <BlurView
        key={generation}
        intensity={BLUR_INTENSITY}
        tint="default"
        style={StyleSheet.absoluteFill}
        {...(Platform.OS === 'android' && target !== null
          ? { blurMethod: 'dimezisBlurViewSdk31Plus' as const, blurTarget: target }
          : {})}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${String(dim)})` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
