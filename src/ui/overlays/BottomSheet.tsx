import { useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  Animated,
  Keyboard,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DirectionalDisc } from '@ui/primitives/DirectionalDisc';
import { IconButton } from '@ui/primitives/IconButton';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { Overlay } from './Overlay';

/**
 * Bottom sheet — Figma `1:729` (Instant), `3:2002` (Extension) and the cancellation stack.
 *
 * Geometry read off `1:729`:
 *   sheet   white, top corners at **20** (not 24), 12pt top padding, 24pt bottom padding
 *   header  `1:735` — STICKY, white, 0.8pt bottom hairline, px 16 / py 12, LEFT-ALIGNED:
 *           back button → optional leading glyph → title at Livvic Black 20/20
 *   body    `1:750` — px 16, pt 20, pb 16, 29pt between blocks
 *
 * The frame draws NO drag handle, and one is no longer rendered. The previous hairline handle was
 * a 3pt bar plus an 8pt margin — 11pt of undesigned chrome above a header the frame starts at
 * exactly 12pt — which is a visible difference on device. The drag-to-dismiss gesture is kept and
 * is now carried by the header itself (and, on a headerless sheet, by a transparent grab strip),
 * so nothing is lost and nothing undesigned is drawn.
 *
 * RESPONSIVENESS (task §9): the body SCROLLS. The Instant grid plus CTA is ~404pt of content; on
 * a short phone the 90% cap would otherwise clip the CTA out of reach. The footer stays pinned
 * below the scroll area so the CTA is always reachable.
 *
 * Layering: pass `dialog` to render a dialog ABOVE the sheet — the taxes popup over the Instant
 * sheet. It renders inside the same native modal, so:
 *  - Android back closes the DIALOG first, then the sheet;
 *  - a backdrop tap while the dialog is open closes only the dialog;
 *  - there is one focus scope, so assistive tech never lands on the sheet behind the dialog.
 */

const SHEET_OFFSET = 600;
const ANIMATION_MS = 220;
const DRAG_DISMISS_THRESHOLD = 80;
/** `6:3` — the ground below the CTA block before the frame's own edge. */
const SHEET_BOTTOM_PAD = 18;

export interface BottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  /** Right-hand header slot — the `Help 📞` pill on the cancellation sheets. */
  readonly headerAction?: ReactNode;
  /** Shown when the sheet is a step in a stack (the ← chevron steps within the sheet). */
  readonly onBack?: () => void;
  /** `22:1151` — the glyph between the back control and the title (the Instant bolt). */
  readonly headerGlyph?: ReactNode;
  /**
   * `compact` (default) — `1:735`: the Instant sheet's tight left-aligned row with a hairline.
   * `screen`  — `143:317`: the Extension sheet reuses the SCREEN header instead. A 45pt band,
   *             pt 16 / pb 6 / px 16, a 32pt back control 15pt clear of a Livvic Black 20/28
   *             title, the Help pill on the right and NO hairline.
   * `banner`  — `289:6866` / `289:6848` in `sbIXeBfaMzUFUz2NYJIJTm`: the finalized Instant and
   *             Cancellation sheets adopted the SHARED screen header `63:783` — a **338 x 38**
   *             bar, px 4, 12pt gap, Livvic Black 20/28, no hairline. Added as its own variant
   *             rather than by re-valuing `screen`, whose other three consumers (Extension,
   *             Booking details, address edit) are outside this pass's scope.
   */
  readonly headerVariant?: 'compact' | 'screen' | 'banner';
  /**
   * The back control's own treatment. Sheets disagree: `1:735` and `143:317` draw a bare arrow,
   * while `230:1927` on the address-edit sheet draws the OUTLINED disc the screen headers use.
   * Default keeps every already-verified sheet exactly as it is.
   */
  readonly backVariant?: 'plain' | 'outlined';
  /** Per-sheet body padding/gap. `1:750` and `143:326` genuinely differ. */
  readonly bodyStyle?: StyleProp<ViewStyle>;
  readonly footer?: ReactNode;
  /**
   * Per-sheet footer offsets. The CTA is in FLOW in the frames; it is pinned here so a short
   * viewport can always reach it (task §15), which means the gap above it has to be restated
   * per sheet — `1:821` sits 29pt below the grid, `37:3908` does not.
   */
  readonly footerStyle?: StyleProp<ViewStyle>;
  /**
   * A layer drawn over the header and body but NOT the footer — `44:5632`, the Instant
   * unavailable scrim, which stops above the CTA so the CTA stays fully saturated.
   */
  readonly overlay?: ReactNode;
  /** A dialog layered above this sheet. See the layering note above. */
  readonly dialog?: ReactNode;
  readonly onDialogClose?: () => void;
  readonly dismissOnBackdropPress?: boolean;
  readonly testID?: string;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  headerAction,
  onBack,
  headerGlyph,
  headerVariant = 'compact',
  backVariant = 'plain',
  bodyStyle,
  footer,
  footerStyle,
  overlay,
  dialog,
  onDialogClose,
  dismissOnBackdropPress = true,
  testID = 'bottom-sheet',
  children,
}: PropsWithChildren<BottomSheetProps>) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Lazily-created and stable for the component's lifetime, without reading a ref during render.
  const [translateY] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [mounted, setMounted] = useState(visible);
  const dialogOpen = dialog !== undefined && dialog !== null;

  // Keep the sheet mounted through its exit animation. Adjusting state during render is the
  // supported pattern here; doing it in an effect would cost an extra frame.
  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_OFFSET,
      duration: ANIMATION_MS,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });

    return () => animation.stop();
  }, [visible, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !dialogOpen && gesture.dy > lightTheme.space.sm,
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > DRAG_DISMISS_THRESHOLD) {
            onClose();
            return;
          }
          Animated.timing(translateY, {
            toValue: 0,
            duration: ANIMATION_MS,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dialogOpen, onClose, translateY],
  );

  /** Back button / backdrop precedence: dialog first, sheet second. */
  const requestClose = () => {
    if (dialogOpen) {
      onDialogClose?.();
      return;
    }
    onClose();
  };

  if (!visible && !mounted) {
    return null;
  }

  return (
    <Overlay visible={visible || mounted} onRequestClose={requestClose} testID={`${testID}-modal`}>
      <Pressable
        style={styles.backdrop}
        testID={`${testID}-backdrop`}
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={dismissOnBackdropPress ? requestClose : undefined}
        disabled={!dismissOnBackdropPress}
      />

      <Animated.View
        testID={testID}
        style={[
          styles.sheet,
          /*
           * KEYBOARD AVOIDANCE. The sheet is bottom-anchored, so with an IME up it kept its
           * position and the keyboard simply covered it — observed on the handset with the
           * cancellation "Others" field, where BOTH the field being typed into and the Continue
           * CTA sat behind the keyboard and the sheet never scrolled.
           *
           * Lifting by the keyboard height (and taking that height out of the max) moves the whole
           * sheet above the IME and lets its own ScrollView carry any remainder. When the keyboard
           * is closed this is 0 and every already-verified sheet is byte-identical.
           *
           * `padding`-style avoidance is used rather than `KeyboardAvoidingView` because the sheet
           * lives inside a native modal, where that component does not receive the same insets.
           */
          { marginBottom: keyboardHeight },
          /*
           * `6:3` / `104:2261` / `115:2704` / `289:6865` all measure the sheet at a fixed height
           * with the header starting at y = 16 and ~18 of ground below the CTA. The frames model
           * no gesture inset, so `insets.bottom` is ADDED rather than folded in — dropping it
           * would put the CTA under the home indicator on this handset.
           */
          { paddingBottom: SHEET_BOTTOM_PAD + (keyboardHeight > 0 ? 0 : insets.bottom) },
          { transform: [{ translateY }] },
        ]}
        accessibilityViewIsModal={!dialogOpen}
        {...(dialogOpen ? { accessibilityElementsHidden: true } : {})}
        importantForAccessibility={dialogOpen ? 'no-hide-descendants' : 'yes'}
      >
        <View style={styles.main}>
          {title === undefined && onBack === undefined && headerAction === undefined ? (
            /* Headerless sheet — a transparent strip keeps drag-to-dismiss reachable. */
            <View
              style={styles.grabStrip}
              {...panResponder.panHandlers}
              testID={`${testID}-handle`}
            />
          ) : (
            <View
              style={[
                styles.header,
                headerVariant === 'screen' ? styles.headerScreen : null,
                headerVariant === 'banner' ? styles.headerBanner : null,
              ]}
              {...panResponder.panHandlers}
              testID={`${testID}-handle`}
            >
              {onBack === undefined ? null : backVariant === 'outlined' ? (
                /* `111:2640` — the disc control, from the exported asset. */
                <DirectionalDisc
                  direction="back"
                  label="Back"
                  onPress={onBack}
                  testID={`${testID}-back`}
                />
              ) : (
                /* `1:739` — the Instant sheet's bare 20pt arrow on no fill. A different control. */
                <IconButton
                  name="backArrow"
                  label="Back"
                  onPress={onBack}
                  variant="plain"
                  color="textSecondaryStrong"
                  testID={`${testID}-back`}
                />
              )}
              {headerGlyph ?? null}
              {/* Two lines, not one. `minHeight: 61` lets the band grow, and at 320dp the
                  cancellation title clipped to "Cancel booki…" beside its Help pill. A second
                  line is only ever used when the title does not fit; at the 370pt reference and
                  above it renders on one, exactly as drawn. */}
              <Text
                variant={headerVariant === 'compact' ? 'headingSheet' : 'headingScreen'}
                color="textStrong"
                accessibilityRole="header"
                numberOfLines={2}
                style={styles.title}
              >
                {title ?? ''}
              </Text>
              {headerAction ?? null}
            </View>
          )}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.body, bodyStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            testID={`${testID}-scroll`}
          >
            {children}
          </ScrollView>

          {overlay ?? null}
        </View>

        {footer === undefined ? null : <View style={[styles.footer, footerStyle]}>{footer}</View>}

        {/* `29:1858` — the 50% black wash the sheet takes under an open dialog. */}
        {dialogOpen ? <View style={styles.sheetDim} pointerEvents="none" /> : null}
      </Animated.View>

      {dialogOpen ? (
        <View style={styles.dialogLayer} testID={`${testID}-dialog-layer`}>
          <Pressable
            style={styles.dialogScrim}
            testID={`${testID}-dialog-backdrop`}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onDialogClose}
          />
          <View style={styles.dialogContent} accessibilityViewIsModal>
            {dialog}
          </View>
        </View>
      ) : null}
    </Overlay>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  /** `1:729` — 20pt top corners, 12pt top padding, 24pt bottom padding (+ the safe area). */
  sheet: {
    marginTop: 'auto',
    backgroundColor: lightTheme.colors.surface,
    borderTopLeftRadius: lightTheme.layout.sheetRadius,
    borderTopRightRadius: lightTheme.layout.sheetRadius,
    paddingTop: lightTheme.space.lg,
    maxHeight: '92%',
  },
  /** Drag target on a sheet that draws no header. Transparent — the frames draw no handle. */
  grabStrip: { height: lightTheme.space.md, alignSelf: 'stretch' },
  /**
   * `1:735` — px 16, py 12, 3pt gap, left-aligned, and a 0.8pt bottom border whose fill the node
   * gives as WHITE. It is a spacer, not a rule: the frame shows no divider under a sheet header.
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    borderBottomWidth: lightTheme.stroke.hairline,
    borderBottomColor: lightTheme.colors.surface,
  },
  /**
   * `289:6944` / `115:2786` — the shared `63:783` bar: 38 tall, its own px 4, 12pt gap, no
   * hairline.
   *
   * The frames nest that bar inside the sheet's own `p 16` (`289:6943` / `104:2337`), so the back
   * disc lands at x 20, not x 4. `body` already carries that 16 for the scroll region; the header
   * sits outside it and therefore adds the gutter itself.
   */
  headerBanner: {
    height: 38,
    gap: lightTheme.space.md,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal + lightTheme.space.xs,
    paddingVertical: 0,
    borderBottomWidth: 0,
    minHeight: 0,
  },
  /** `143:317` — a 45pt band: pt 16 / pb 6, 15pt clear of the back control, no hairline. */
  headerScreen: {
    gap: 15,
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.lg,
    borderBottomWidth: 0,
    minHeight: 61,
  },
  /**
   * `289:6817` — the title takes the slack so a `headerAction` lands flush against the banner's
   * right padding, as the Help pill does (`289:6823` ends at 333 of a 334pt inner width). With
   * only `flexShrink` it sat 12pt after the title and left 70pt dead on a 393dp screen.
   */
  title: { flex: 1 },
  /** Header + body share one positioning context so `overlay` can cover both, but not the CTA. */
  main: { flexShrink: 1 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  /** `1:750` — px 16, pt 20, pb 16, 29pt between blocks. */
  body: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: 20,
    paddingBottom: lightTheme.space.lg,
    gap: 29,
  },
  footer: {
    paddingHorizontal: lightTheme.space.lg,
    gap: lightTheme.space.sm,
  },
  dialogLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
  },
  /**
   * `47:6615` / `29:1858` — the sheet dims ITSELF rather than taking a second full-screen scrim.
   *
   * The frame expresses this as a 50% black wash under a 50% layer opacity. Reproduced literally
   * that makes the sheet translucent, and on a real device the Home screen behind it reads
   * straight through — the artboard hides this only because its background is blank. The flattened
   * `black65` wash lands the same measured colour (~#595959 on white) with the sheet still opaque.
   */
  sheetDim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: lightTheme.colors.scrimSheet,
  },
  /**
   * Transparent: `25:1745` is the ONE scrim in the frame and `Overlay` already draws it. Painting
   * `scrim` here again stacked 0.8 on 0.8 and took the screen behind the sheet to 96% black.
   */
  dialogScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  dialogContent: { paddingHorizontal: lightTheme.space.xl },
});
