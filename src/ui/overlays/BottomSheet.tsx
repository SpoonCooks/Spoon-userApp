import { useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
   */
  readonly headerVariant?: 'compact' | 'screen';
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
          { paddingBottom: lightTheme.space.xl + insets.bottom },
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
              style={[styles.header, headerVariant === 'screen' ? styles.headerScreen : null]}
              {...panResponder.panHandlers}
              testID={`${testID}-handle`}
            >
              {onBack === undefined ? null : (
                <IconButton
                  name={backVariant === 'outlined' ? 'back' : 'backArrow'}
                  label="Back"
                  onPress={onBack}
                  variant={backVariant}
                  color={backVariant === 'outlined' ? 'textSecondary' : 'textSecondaryStrong'}
                  testID={`${testID}-back`}
                />
              )}
              {headerGlyph ?? null}
              {/* Two lines, not one. `minHeight: 61` lets the band grow, and at 320dp the
                  cancellation title clipped to "Cancel booki…" beside its Help pill. A second
                  line is only ever used when the title does not fit; at the 370pt reference and
                  above it renders on one, exactly as drawn. */}
              <Text
                variant={headerVariant === 'screen' ? 'headingScreen' : 'headingSheet'}
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
    paddingTop: lightTheme.space.md,
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
  /** `143:317` — a 45pt band: pt 16 / pb 6, 15pt clear of the back control, no hairline. */
  headerScreen: {
    gap: 15,
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.lg,
    borderBottomWidth: 0,
    minHeight: 61,
  },
  title: { flexShrink: 1 },
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
  dialogScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: lightTheme.colors.scrim,
  },
  dialogContent: { paddingHorizontal: lightTheme.space.xl },
});
