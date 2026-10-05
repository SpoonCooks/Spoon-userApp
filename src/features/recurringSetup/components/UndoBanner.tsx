import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { CLOSE_ICON, DONE_ICON } from '../art';

/**
 * `Banner / Undo` — Figma `567:1030` (on `568:2909`).
 *
 * Shown at the top of the Summary after a visit or plan is deleted: a tick, what went, "Undo" to
 * put it back and × to dismiss. The file's own note: Spoon uses banners, not toasts.
 */
export interface UndoBannerProps {
  /** "2nd Visit deleted from Plan 2", "Plan 2 deleted". */
  readonly message: string;
  readonly onUndo: () => void;
  readonly onDismiss: () => void;
  readonly testID?: string;
}

export function UndoBanner({
  message,
  onUndo,
  onDismiss,
  testID = 'recurring-undo-banner',
}: UndoBannerProps) {
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite" testID={testID}>
      <View style={styles.badge}>
        <Image source={DONE_ICON} style={styles.tick} />
      </View>
      <Text variant="bodyLarge" color="textPrimary" style={styles.message}>
        {message}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          style={styles.undo}
          testID={`${testID}-undo`}
        >
          <Text variant="headingBold" color="textPrimary" style={styles.underline}>
            Undo
          </Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.dismiss}
          testID={`${testID}-dismiss`}
        >
          <Image source={CLOSE_ICON} style={styles.close} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * `567:1030` — 52 tall (more if the message wraps), px 8, 8 apart, a 24pt radius on
   * `color/surface/disabled`. The frame fixes the height at 52 and lets the 44pt Undo and dismiss
   * overflow its 8pt padding, so the vertical padding here is the 4 that fits them exactly.
   */
  banner: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surfaceDisabledSoft,
  },
  /** `567:1031` — a 40pt `#00000040` disc around the 20pt white tick. */
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceDisabledStrong,
  },
  tick: { width: 20, height: 20 },
  message: { flex: 1 },
  /** `568:3003` — 4 between Undo and the dismiss. */
  actions: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  /** `567:1035` — 44 tall, px 8, Bold 16/24 underlined. */
  undo: { height: 44, paddingHorizontal: lightTheme.space.sm, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  /** `567:1037` — a 44pt target around the 24pt ×. */
  dismiss: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  close: { width: 24, height: 24 },
});
