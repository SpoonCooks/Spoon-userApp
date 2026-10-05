import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from '../theme';

export interface ToastHandle {
  readonly show: (message: string) => void;
}

const VISIBLE_MS = 2500;

/**
 * One-line toast pinned above the home indicator. The dev notes propose it for unavailable-tile
 * taps and for a selection lost on refresh; no toast is drawn in the file, so this is a neutral
 * pill in the page's own palette. Also announced to screen readers.
 */
export const Toast = forwardRef<ToastHandle>(function Toast(_, ref) {
  const { bottom } = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (next: string) => {
      if (timer.current !== null) clearTimeout(timer.current);
      setMessage(next);
      AccessibilityInfo.announceForAccessibility(next);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
          setMessage(null),
        );
      }, VISIBLE_MS);
    },
    [opacity],
  );

  useImperativeHandle(ref, () => ({ show }), [show]);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  if (message === null) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { bottom: bottom + 16, opacity }]}
      testID="home-toast"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: C.text,
    alignItems: 'center',
  },
  text: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.base },
});
