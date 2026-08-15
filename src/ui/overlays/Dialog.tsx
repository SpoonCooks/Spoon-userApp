import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

import { Overlay } from './Overlay';

/**
 * Standalone centred dialog host.
 *
 * Use this when a dialog is presented over a SCREEN. When it is presented over a bottom sheet
 * (the taxes popup over the Instant sheet), pass the dialog to `BottomSheet`'s `dialog` prop
 * instead — that keeps both surfaces inside one native modal.
 */

export interface DialogProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly dismissOnBackdropPress?: boolean;
  readonly testID?: string;
}

export function Dialog({
  visible,
  onClose,
  dismissOnBackdropPress = true,
  testID = 'dialog',
  children,
}: PropsWithChildren<DialogProps>) {
  if (!visible) {
    return null;
  }

  return (
    <Overlay visible={visible} onRequestClose={onClose} testID={`${testID}-modal`}>
      <Pressable
        style={styles.backdrop}
        testID={`${testID}-backdrop`}
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={dismissOnBackdropPress ? onClose : undefined}
        disabled={!dismissOnBackdropPress}
      />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.content} accessibilityViewIsModal testID={testID}>
          {children}
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  center: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: lightTheme.space.xl },
});
