import { Modal, StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Modal host shared by `BottomSheet` and `Dialog`.
 *
 * Implementation choice: **React Native's own `Modal`** — no sheet library.
 *
 * The deciding requirement from the audit is layering: the taxes dialog (`25:1585`) is presented
 * OVER the Instant bottom sheet (`1:728`). Rather than stacking two native modals — which is
 * where Android's Dialog-backed Modal gets unreliable — `BottomSheet` renders its dialog as a
 * layer INSIDE this single host. One native modal, one back-button handler, one focus scope.
 *
 * What we get from RN core, with zero added dependencies:
 *  - `onRequestClose` → Android hardware back;
 *  - `accessibilityViewIsModal` → iOS VoiceOver stops reading content behind the overlay;
 *  - `statusBarTranslucent` → the scrim covers the status bar on Android.
 *
 * `@gorhom/bottom-sheet` was considered and rejected for now: it would add a dependency plus
 * Reanimated worklet setup in Jest, to buy gesture polish we do not yet need. The public API of
 * `BottomSheet` is deliberately library-agnostic, so swapping later is an internal change.
 */

export interface OverlayProps {
  readonly visible: boolean;
  /** Android back button and (for the sheet) backdrop taps route here. */
  readonly onRequestClose: () => void;
  readonly testID?: string;
}

export function Overlay({
  visible,
  onRequestClose,
  testID,
  children,
}: PropsWithChildren<OverlayProps>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose}
      testID={testID}
    >
      <View style={styles.root} accessibilityViewIsModal>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightTheme.colors.scrim },
});
