import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { PropsWithChildren, ReactNode, RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Screen shell: safe-area insets, background token, optional scrolling, a STICKY header region
 * and a pinned footer region for the persistent bottom bars the design uses on Instant /
 * Scheduled / Extension.
 *
 * `37:3705` pins the screen header above the scroll area, so `header` renders outside the
 * `ScrollView` rather than as its first child. Real safe-area insets are used — the frames' notch,
 * status bar and home indicator are device mockup and are deliberately not reproduced.
 */

export type ScreenTone = 'app' | 'plain' | 'form';

export interface ScreenProps {
  readonly scroll?: boolean;
  readonly padded?: boolean;
  /**
   * The file uses three screen grounds:
   *   `app`   the warm cream `#FFFDF5` (Home and the marketing surfaces)
   *   `plain` white — `37:3704` Scheduled, `3:1042` Confirmation and the booking lifecycle
   *   `form`  `#F8FAFC` — `3:686` Meal Brief
   */
  readonly tone?: ScreenTone;
  /** Sticky region above the scroll area (`37:3705`). Draws its own padding. */
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  /**
   * Appended to the scroll content so a screen whose frame disagrees with the shared 20pt gap /
   * 22pt lead can state its own. `34:3045` opens 16 below the header and spaces sections at 21.
   */
  readonly contentStyle?: ViewStyle;
  readonly testID?: string;
}

/**
 * The IME's height while it is open, 0 otherwise.
 *
 * On Android 15+ the window is edge-to-edge and `adjustResize` NO LONGER shrinks it, so a
 * `ScrollView` never learns that the keyboard covered its lower half: on the handset the focused
 * Completion feedback field (`143:289`) sat entirely behind the IME with no way to scroll to it.
 * Shrinking the scroll viewport by the reported height restores both the reachability and RN's
 * built-in "scroll the focused input into view" behaviour, on both platforms.
 *
 * It is applied to the SCROLL VIEWPORT rather than to the content, because padding the content
 * alone would let the user scroll there but would not bring them there.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) =>
      setHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

/**
 * Keeps the FOCUSED field clear of the keyboard inside a scroll area that `useKeyboardHeight`
 * has already shrunk.
 *
 * Shrinking the viewport makes a covered field REACHABLE. It does not make it REACHED, and on
 * this form those are different things. Android scrolls a child into view when it TAKES focus —
 * and at that instant the keyboard is still closed, the viewport is still full height, and a
 * field sitting in the lower half of the screen is already visible, so nothing scrolls. The IME
 * then opens on top of it and nothing runs again, because a viewport that shrinks does not
 * re-scroll what is inside it. `341:4672` (the grown-up-food search) is exactly that field:
 * sixth block down, tapped from a scrolled position, typed into behind the keyboard.
 *
 * So the correction is issued from the viewport's own `onLayout`, for the reason `LoginScreen`
 * already records: on Android `keyboardDidShow` fires BEFORE the resize reaches the view, so a
 * scroll computed there is computed against the old height and moves nothing. `onLayout` is the
 * first moment the new geometry is real.
 *
 * `onInputFocus` covers the other order — moving between fields while the keyboard is ALREADY
 * up, where no relayout happens and so `onLayout` never fires.
 *
 * Both measure the field and the viewport in the SAME window coordinates and scroll by whatever
 * overlap is left. Nothing is derived from `Dimensions` or from the IME's own frame: under the
 * edge-to-edge window those two disagree about where the bottom of the screen is, and that
 * disagreement is what the measured approach exists to avoid.
 */
export interface KeyboardAwareScroll {
  /** Attach to the `ScrollView`. */
  readonly scrollRef: RefObject<ScrollView | null>;
  /** Attach to the `View` that carries the `marginBottom: keyboardHeight`. */
  readonly viewportRef: RefObject<View | null>;
  /** Attach to that same `View`'s `onLayout`. */
  readonly onViewportLayout: () => void;
  /** Attach to the `ScrollView`'s `onScroll` (with `scrollEventThrottle`). */
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Attach to every `TextInput` inside the scroll area. */
  readonly onInputFocus: () => void;
  /**
   * Scroll an arbitrary view clear of the keyboard.
   *
   * For a control that is TALLER than the input the customer is typing in: a search field that
   * opens a list of options beneath itself is one control from the customer's point of view and
   * two views from the layout's, and revealing only the input leaves the list — the entire
   * reason they tapped — under the IME.
   *
   * Call it from the taller view's own `onLayout`, for the same reason `onViewportLayout` exists:
   * the list is laid out one commit after the focus that opened it, so a measurement taken at
   * focus time is a measurement of something that is not on screen yet.
   */
  readonly revealView: (node: MeasurableNode | null) => void;
}

/** Anything that can report its own window rectangle — a `View` ref, or the focused input. */
interface MeasurableNode {
  measureInWindow(
    callback: (x: number, y: number, width: number, height: number) => void,
  ): void;
}

export function useKeyboardAwareScroll(
  keyboardHeight: number,
  gap: number = lightTheme.space.lg,
): KeyboardAwareScroll {
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  /**
   * `scrollTo` takes an ABSOLUTE offset while the measurement yields a RELATIVE overlap, so the
   * current offset has to be known. It is a ref rather than state: it changes on every frame of
   * a drag and nothing renders from it.
   */
  const offset = useRef(0);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);

  /**
   * Scrolls until `target`'s bottom edge clears the keyboard, or does nothing if it already does.
   *
   * Both rectangles are read in the SAME window coordinates, and nothing is derived from
   * `Dimensions` or from the IME's own frame — under the edge-to-edge window those two disagree
   * about where the bottom of the screen is, and that disagreement is what this exists to avoid.
   */
  const revealNode = useCallback(
    (target: MeasurableNode | null) => {
      // No keyboard means there is nothing to be covered by.
      if (keyboardHeight === 0) return;
      const viewport = viewportRef.current;
      if (target == null || viewport == null) return;

      viewport.measureInWindow((_x, viewportY, _width, viewportHeight) => {
        target.measureInWindow((_targetX, targetY, _targetWidth, targetHeight) => {
          // How far the target's bottom edge (plus the breathing room the frames leave under a
          // control) falls past the bottom of what the customer can still see.
          const covered = targetY + targetHeight + gap - (viewportY + viewportHeight);
          if (covered <= 0) return;

          /**
           * Never scroll the target's own TOP out of view.
           *
           * A control taller than the space left above the keyboard cannot be revealed whole, and
           * chasing its bottom edge would push the field being typed in off the top of the screen
           * — trading one invisible thing for a worse one. The grown-up-food search is exactly
           * that shape once its list is open: a label, a field, and up to 200pt of options.
           * Showing the top of the control and as much of the list as fits is the honest maximum.
           */
          const headroom = Math.max(0, targetY - viewportY);
          const scrollBy = Math.min(covered, headroom);
          if (scrollBy <= 0) return;

          scrollRef.current?.scrollTo({ y: offset.current + scrollBy, animated: true });
        });
      });
    },
    [keyboardHeight, gap],
  );

  const reveal = useCallback(() => {
    revealNode(TextInput.State.currentlyFocusedInput());
  }, [revealNode]);

  return {
    scrollRef,
    viewportRef,
    onViewportLayout: reveal,
    onScroll,
    onInputFocus: reveal,
    revealView: revealNode,
  };
}

/**
 * How much room the LAST element on a screen needs below it.
 *
 * The frames all draw a comfortable gap between the bottom CTA and the mock home indicator —
 * `53:110` leaves 12, `275:4485` and `37:3907` leave 16 — and that gap was being applied as a
 * flat padding. On a device it is not enough on its own: this app runs edge to edge, so the
 * system's gesture bar sits INSIDE the window, and a 34pt CTA with 12pt beneath it ends up under
 * the strip that intercepts swipes. Measured on the handset: the map step's Confirm finished 12dp
 * from the screen edge, flush against the gesture pill.
 *
 * `Math.max` rather than a sum: on a device with no bottom inset the frame's own gap is exactly
 * what the design asks for, and on a device with one the inset already provides more room than
 * the gap did. Adding them would push the CTA off the geometry the frame draws.
 */
export function useBottomGutter(designGap: number): number {
  const insets = useSafeAreaInsets();
  return Math.max(designGap, insets.bottom);
}

export function Screen({
  scroll = false,
  padded = true,
  tone = 'app',
  header,
  footer,
  contentStyle,
  testID,
  children,
}: PropsWithChildren<ScreenProps>) {
  const content = padded ? styles.padded : undefined;
  const keyboardHeight = useKeyboardHeight();
  const { scrollRef, viewportRef, onViewportLayout, onScroll, onInputFocus } =
    useKeyboardAwareScroll(keyboardHeight);
  const footerGutter = useBottomGutter(lightTheme.space.lg);

  return (
    <SafeAreaView
      style={[styles.safe, TONE_STYLE[tone]]}
      edges={['top', 'left', 'right']}
      testID={testID}
    >
      {header ?? null}

      {scroll ? (
        <View
          ref={viewportRef}
          onLayout={onViewportLayout}
          onFocus={onInputFocus}
          style={[
            styles.flex,
            Platform.OS === 'ios' || keyboardHeight === 0 ? null : { marginBottom: keyboardHeight },
          ]}
        >
          <ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
            /*
             * Shrinking for the keyboard is not the same as scrolling to the field being typed in.
             * Android uses the measured viewport and focus handlers above. iOS owns the equivalent
             * inset and first-responder reveal through `automaticallyAdjustKeyboardInsets`, so the
             * two platforms do not double-count the keyboard.
             */
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={[styles.scrollContent, content, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      ) : (
        <View style={[styles.flex, content]}>{children}</View>
      )}

      {footer === undefined ? null : (
        <View style={[styles.footer, TONE_STYLE[tone], { paddingBottom: footerGutter }]}>
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: lightTheme.colors.background },
  flex: { flex: 1 },
  /** `37:3713` — px 16, pt 22, pb 24. */
  padded: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.s22,
    paddingBottom: lightTheme.space.xl,
  },
  toneApp: { backgroundColor: lightTheme.colors.background },
  tonePlain: { backgroundColor: lightTheme.colors.surface },
  toneForm: { backgroundColor: lightTheme.colors.surfaceForm },
  /** `3:687` — 20pt between the Meal Brief blocks. */
  scrollContent: { flexGrow: 1, gap: 20 },
  /** `37:3907` — the footer's own 8pt top padding; it sits flush to the screen edges otherwise. */
  footer: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.sm,
    paddingBottom: lightTheme.space.lg,
  },
});

const TONE_STYLE: Record<ScreenTone, ViewStyle> = {
  app: styles.toneApp,
  plain: styles.tonePlain,
  form: styles.toneForm,
};
