import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardAwareScroll, useKeyboardHeight } from '../primitives/Screen';

import { C, SHADOW_3 } from './theme';

/**
 * The redesign's bottom sheet (dev note "General (all sheets)", `2071:2884`): 24pt top radius over
 * the scrim, 16pt side padding, a 40 × 4 handle, height hugging its content and scrolling past
 * ~90% of the screen. Scrim tap, swipe down on the handle, and Android back all call `onClose` —
 * unless `dismissible` is false (a write in flight, or a step with no way back).
 *
 * The scrim is 40% black: the frames draw a blurred backdrop, and the app has no blur library.
 *
 * `look="account"` is the Accounts sheet (Delete account, `1517:10413`), drawn differently from the
 * cancellation sheets: a 36 × 4 `#FFEF99` grabber 12pt from the top, a 35% scrim, no shadow, and
 * the content ending 32pt above the bottom edge (or the safe-area inset, if that is larger).
 *
 * A Modal is not resized for the keyboard (Android edge to edge, and iOS), so a sheet with a text
 * field rides ON the keyboard: lifted by its height, capped to the room above it, and scrolled so
 * the focused field and the action under it stay in sight. Cancel's "Something else" box opened
 * entirely behind the keyboard before this (owner, 2026-10-14).
 */
export function Sheet({
  visible,
  onClose,
  dismissible = true,
  look = 'default',
  children,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
  look?: 'default' | 'account';
  children: ReactNode;
  testID: string;
}) {
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [translateY] = useState(() => new Animated.Value(height));
  const [mounted, setMounted] = useState(visible);
  const keyboardHeight = useKeyboardHeight();
  const { scrollRef, viewportRef, onViewportLayout, onScroll } = useKeyboardAwareScroll(
    keyboardHeight,
    KEYBOARD_ACTION_ROOM,
  );

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    const animation = Animated.timing(translateY, {
      toValue: visible ? 0 : height,
      duration: 220,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, translateY, height]);

  const close = () => {
    if (dismissible) onClose();
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => dismissible && gesture.dy > 6,
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 80 || gesture.vy > 0.8) {
            onClose();
          } else {
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      }),
    [dismissible, onClose, translateY],
  );

  if (!mounted) return null;
  const account = look === 'account';

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={[styles.scrim, account && styles.scrimAccount]} accessibilityViewIsModal>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel="Close"
          testID={`${testID}-backdrop`}
        />
        <Animated.View
          style={[
            styles.sheet,
            account ? null : SHADOW_3,
            {
              maxHeight: height * 0.9 - keyboardHeight,
              marginBottom: keyboardHeight,
              transform: [{ translateY }],
            },
          ]}
          testID={testID}
        >
          <View
            style={[styles.handleZone, account && styles.handleZoneAccount]}
            {...pan.panHandlers}
          >
            <View style={[styles.handle, account && styles.handleSoft]} />
          </View>
          <View ref={viewportRef} onLayout={onViewportLayout} style={styles.viewport}>
            <ScrollView
              ref={scrollRef}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={[
                styles.content,
                // With the keyboard up, the home indicator is under it: no gutter for it.
                {
                  paddingBottom:
                    keyboardHeight > 0 ? 16 : account ? Math.max(32, bottom) : bottom + 16,
                },
              ]}
            >
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Room kept in sight under a focused field: the end of its card and the sheet's button after it.
 * Under Cancel's "Something else" field sit its counter (20), the box's and the card's padding
 * (25), a 16pt gap and the 56pt Continue: about 120pt, measured on the S21.
 */
const KEYBOARD_ACTION_ROOM = 136;

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  scrimAccount: { backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    marginTop: 'auto',
    backgroundColor: C.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleZone: { alignItems: 'center', paddingTop: 8, paddingBottom: 16 },
  handleZoneAccount: { paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.textDisabled },
  handleSoft: { width: 36, backgroundColor: C.border },
  viewport: { flexShrink: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
});
