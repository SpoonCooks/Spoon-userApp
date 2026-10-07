import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

export interface VisitToastHandle {
  readonly show: (message: string) => void;
}

/** `Note · Help deep link` — "Toast shows for ~1.5s while WhatsApp opens". */
const VISIBLE_MS = 1500;
/** `1444:736` — the action dock is 89 tall over the home-indicator gutter; the toast sits 12 above. */
const ABOVE_DOCK = 89 + lightTheme.space.md;

/**
 * A one-line ink pill over the Visit details dock. No toast is drawn in the file, so it takes the
 * Home toast's shape in the design-system tokens; it is also announced to screen readers.
 */
export const VisitToast = forwardRef<VisitToastHandle, { readonly testID?: string }>(
  function VisitToast({ testID = 'visit-toast' }, ref) {
    const { bottom } = useSafeAreaInsets();
    const [message, setMessage] = useState<string | null>(null);
    const [opacity] = useState(() => new Animated.Value(0));
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
        style={[styles.toast, { bottom: bottom + ABOVE_DOCK, opacity }]}
        testID={testID}
      >
        <Text variant="spoonBodyStrong" color="textInverse">
          {message}
        </Text>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: lightTheme.space.lg,
    right: lightTheme.space.lg,
    alignItems: 'center',
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceInverse,
  },
});
