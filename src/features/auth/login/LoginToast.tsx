import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from './theme';

const VISIBLE_MS = 2500;

/**
 * One-line toast for the OTP screen ("New code sent to …", "No connection. Try again."). The dev
 * notes ask for these but no toast is drawn, so it is the same neutral pill the redesigned Home
 * uses — except it sits 16pt above the KEYBOARD, which is open for the whole OTP screen and would
 * otherwise cover it. A new `id` shows the message again even when the text repeats.
 */
export function LoginToast({
  notice,
  keyboardHeight,
}: {
  notice: { readonly id: number; readonly message: string } | null;
  keyboardHeight: number;
}) {
  const { bottom } = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  /** The notice whose fade-out has finished; a newer `id` shows again. */
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  useEffect(() => {
    if (notice === null) return undefined;
    AccessibilityInfo.announceForAccessibility(notice.message);
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
        setDismissedId(notice.id),
      );
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, opacity]);

  if (notice === null || notice.id === dismissedId) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { bottom: (keyboardHeight > 0 ? keyboardHeight : bottom) + 16, opacity },
      ]}
      testID="login-toast"
    >
      <Text style={styles.text}>{notice.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: C.text,
  },
  text: {
    fontFamily: F.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: C.base,
    textAlign: 'center',
  },
});
