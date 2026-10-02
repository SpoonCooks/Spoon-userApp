import { Image, StyleSheet, View } from 'react-native';

import { Button, Dialog, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import { COOK_ICON } from '../art';

/**
 * Remove a cook from the pool — Figma `848:7494`.
 *
 * The recurring flow's confirm card (`586:4373`): p 24, 16 between rows, a 24pt radius and
 * `Elevation/3`; a 48pt `#FFE666` badge with the cook glyph, the question (SemiBold 16/24), then
 * "Keep" in gold and "Remove" outlined. Keep — or a tap outside — closes it and stays on the
 * profile.
 */
export interface RemoveCookDialogProps {
  readonly visible: boolean;
  /** The profile's title — "Cook Sanchita". */
  readonly cookName: string;
  readonly onKeep: () => void;
  readonly onRemove: () => void;
  readonly testID?: string;
}

export function RemoveCookDialog({
  visible,
  cookName,
  onKeep,
  onRemove,
  testID = 'remove-cook-dialog',
}: RemoveCookDialogProps) {
  return (
    <Dialog visible={visible} onClose={onKeep} testID={testID}>
      <View style={styles.card} accessibilityViewIsModal>
        <View style={styles.badge}>
          <Image source={COOK_ICON} style={styles.badgeIcon} />
        </View>
        <Text variant="emphasis" color="textPrimary" testID={`${testID}-title`}>
          Remove {cookName} from your Cook Pool?
        </Text>
        <View style={styles.actions}>
          <Button
            label="Keep"
            onPress={onKeep}
            size="pillLg"
            flat
            labelColor="textPrimary"
            style={styles.action}
            testID={`${testID}-keep`}
          />
          <Button
            label="Remove"
            onPress={onRemove}
            variant="secondary"
            size="pillLg"
            labelColor="textPrimary"
            style={[styles.action, styles.destructive]}
            testID={`${testID}-remove`}
          />
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: lightTheme.space.xl,
    gap: lightTheme.space.lg,
    borderRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surface,
    boxShadow: innerShadows.elevation3,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceBrandTint,
  },
  badgeIcon: { width: 24, height: 24 },
  /** pt 8, 12 between the two. */
  actions: { flexDirection: 'row', gap: lightTheme.space.md, paddingTop: lightTheme.space.sm },
  action: { flex: 1 },
  /** White behind a 1.5pt black edge. */
  destructive: { borderWidth: 1.5, borderColor: lightTheme.colors.borderInk },
});
