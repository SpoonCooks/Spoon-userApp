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
            { maxHeight: height * 0.9, transform: [{ translateY }] },
          ]}
          testID={testID}
        >
          <View
            style={[styles.handleZone, account && styles.handleZoneAccount]}
            {...pan.panHandlers}
          >
            <View style={[styles.handle, account && styles.handleSoft]} />
          </View>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: account ? Math.max(32, bottom) : bottom + 16 },
            ]}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

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
  content: { paddingHorizontal: 16, gap: 16 },
});
