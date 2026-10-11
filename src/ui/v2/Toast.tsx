import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, T } from './theme';

export interface ToastNotice {
  readonly id: number;
  readonly message: string;
}

/**
 * One-line toast ("Address saved", "Address removed"). The dev notes ask for these but none is
 * drawn, so it is the same neutral black pill the Login and Home redesigns use. A new `id` shows
 * the message again even when the text repeats.
 */
export function AddressToast({
  notice,
  testID = 'address-toast',
}: {
  notice: ToastNotice | null;
  testID?: string;
}) {
  const { bottom } = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
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
    }, 2500);
    return () => clearTimeout(timer);
  }, [notice, opacity]);

  if (notice === null || notice.id === dismissedId) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { bottom: bottom + 24, opacity }]}
      testID={testID}
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
  text: { ...T.captionStrong, color: C.base, textAlign: 'center' },
});
