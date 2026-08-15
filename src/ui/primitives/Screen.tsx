import { ScrollView, StyleSheet, View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Screen shell: safe-area insets, background token, optional scrolling, a STICKY header region
 * and a pinned footer region for the persistent bottom bars the design uses on Instant /
 * Scheduled / Extension.
 *
 * `37:3705` pins the screen header above the scroll area, so `header` renders outside the
 * `ScrollView` rather than as its first child. Real safe-area insets are used — the frames' notch,
 * status bar and home indicator are device mockup and are deliberately not reproduced.
 */

export type ScreenTone = 'app' | 'plain' | 'form';

export interface ScreenProps {
  readonly scroll?: boolean;
  readonly padded?: boolean;
  /**
   * The file uses three screen grounds:
   *   `app`   the warm cream `#FFFDF5` (Home and the marketing surfaces)
   *   `plain` white — `37:3704` Scheduled, `3:1042` Confirmation and the booking lifecycle
   *   `form`  `#F8FAFC` — `3:686` Meal Brief
   */
  readonly tone?: ScreenTone;
  /** Sticky region above the scroll area (`37:3705`). Draws its own padding. */
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly testID?: string;
}

export function Screen({
  scroll = false,
  padded = true,
  tone = 'app',
  header,
  footer,
  testID,
  children,
}: PropsWithChildren<ScreenProps>) {
  const content = padded ? styles.padded : undefined;

  return (
    <SafeAreaView
      style={[styles.safe, TONE_STYLE[tone]]}
      edges={['top', 'left', 'right']}
      testID={testID}
    >
      {header ?? null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, content]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content]}>{children}</View>
      )}

      {footer === undefined ? null : (
        <View style={[styles.footer, TONE_STYLE[tone]]}>{footer}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: lightTheme.colors.background },
  flex: { flex: 1 },
  /** `37:3713` — px 16, pt 22, pb 24. */
  padded: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.s22,
    paddingBottom: lightTheme.space.xl,
  },
  toneApp: { backgroundColor: lightTheme.colors.background },
  tonePlain: { backgroundColor: lightTheme.colors.surface },
  toneForm: { backgroundColor: lightTheme.colors.surfaceForm },
  /** `3:687` — 20pt between the Meal Brief blocks. */
  scrollContent: { flexGrow: 1, gap: 20 },
  /** `37:3907` — the footer's own 8pt top padding; it sits flush to the screen edges otherwise. */
  footer: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.sm,
    paddingBottom: lightTheme.space.lg,
  },
});

const TONE_STYLE: Record<ScreenTone, ViewStyle> = {
  app: styles.toneApp,
  plain: styles.tonePlain,
  form: styles.toneForm,
};
