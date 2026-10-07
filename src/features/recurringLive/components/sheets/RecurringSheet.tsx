import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { SHEET_CLOSE_GLYPH } from './assets';

/**
 * Sheet chrome shared by the Visit details sheets — Figma `1433:1625` / `1434:1770` in
 * `cCQlzTeiObQkpVBzwI8mZi`, over the `1433:1624` / `1434:1769` scrim.
 *
 * Why not `@ui`'s `BottomSheet`: that chrome is the booking file's (`1:729`) — 20pt corners, NO
 * drag handle, a single-line back/title header with a hairline, and `Overlay`'s 80 % black scrim.
 * This file draws 24pt corners, a 40 × 4 handle, a TWO-line title block with a close well on the
 * right, and a 40 % scrim. `Overlay` hard-codes its 80 % ground, so the host is RN's `Modal`
 * directly, set up exactly as `Overlay` sets it (transparent, `statusBarTranslucent`, back → close).
 *
 * Geometry, verbatim:
 *   sheet   white, top corners 24, pt 8 / px 16 / pb 34, 16pt between blocks, centred
 *   handle  `1433:1626` — 40 × 4 at r2, black 25 %
 *   header  `1402:5638` — 370 wide, pr 4, 12pt gap; title column gap 4 (Title 20/28 over
 *           Caption 12/16 at 60 %); `1402:5642` a 40pt white well, `0 0 3 rgba(0,0,0,0.08)`,
 *           holding the 20pt `Icon/Close`
 *
 * The scrim also carries a 6pt backdrop blur (`Spoon/Scrim`); there is no blur dependency in the
 * app, so only the 40 % wash is drawn.
 */

const SHEET_OFFSET = 600;
const ANIMATION_MS = 220;
/** `1433:1625` — pb 34: the frame's own home-indicator band. */
const SHEET_BOTTOM_PAD = 34;

export interface RecurringSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle: string;
  readonly testID: string;
}

export function RecurringSheet({
  visible,
  onClose,
  title,
  subtitle,
  testID,
  children,
}: PropsWithChildren<RecurringSheetProps>) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [mounted, setMounted] = useState(visible);

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

  if (!visible && !mounted) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      testID={`${testID}-modal`}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          testID={`${testID}-backdrop`}
        />
        <Animated.View
          testID={testID}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(SHEET_BOTTOM_PAD, insets.bottom) },
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text variant="spoonTitle" accessibilityRole="header">
                {title}
              </Text>
              <Text variant="spoonCaption" color="textSecondarySoft">
                {subtitle}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={lightTheme.space.xs}
              style={styles.closeWell}
              testID={`${testID}-close`}
            >
              <Image source={SHEET_CLOSE_GLYPH} style={styles.closeGlyph} />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightTheme.colors.scrimRecurringSheet },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  /** `1433:1625` — r24 top corners, pt 8 / px 16, 16pt gap, children centred. */
  sheet: {
    marginTop: 'auto',
    backgroundColor: lightTheme.colors.surface,
    borderTopLeftRadius: lightTheme.radius.lg,
    borderTopRightRadius: lightTheme.radius.lg,
    paddingTop: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.lg,
    gap: lightTheme.space.lg,
    alignItems: 'center',
    maxHeight: '92%',
  },
  /** `1433:1626` — 40 × 4, r2, `color/text/disabled`. */
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: lightTheme.colors.textDisabledSoft,
  },
  /** `1402:5638` — pr 4, 12pt gap, centred vertically. */
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingRight: lightTheme.space.xs,
  },
  titleBlock: { flex: 1, gap: lightTheme.space.xs },
  /** `1402:5642` — 40pt white disc, `Elevation/1` = `0 0 3 rgba(0,0,0,0.08)`. */
  closeWell: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...lightTheme.elevation.softer,
    shadowRadius: 1.5,
  },
  closeGlyph: { width: 20, height: 20 },
});
