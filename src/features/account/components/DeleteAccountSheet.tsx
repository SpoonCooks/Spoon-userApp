import { StyleSheet, View } from 'react-native';

import { BottomSheet, Button, PromptBlock, Text, lightTheme } from '@ui';

/**
 * The delete-account confirmation sheet.
 *
 * No Figma frame id for this pass — built from the supplied mock: a sheet titled "Delete Account"
 * with a bare back arrow (closes the sheet, same as "No"), a centred prompt on a ROSE block
 * (`PromptBlock` `tone="critical"`, not the lime every other prompt block uses), and a No/Yes
 * pair. Modelled on `CancelBookingSheet`'s "confirmed" step, which is the app's only other
 * prompt + No/Yes sheet — "No" stays `outlineSoft` (the frame's soft-yellow decline edge), "Yes"
 * is `dangerSolid`: a solid `#FF0404` fill with a white label, not `danger`'s pale Log Out
 * treatment, because that is what the mock draws.
 */
export interface DeleteAccountSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /**
   * "Yes" — requests the confirmation code. The OTP screen opens only once the server says a code
   * is on its way, the same order Login uses, so that screen can never open having to admit it
   * could not send one.
   */
  readonly onConfirm: () => void;
  /** The request is in flight — disables both buttons and shows the Yes CTA as loading. */
  readonly confirming?: boolean;
  /** A code that never went out. Shown here, without dismissing, so the flow stops before the OTP. */
  readonly errorMessage?: string | null;
}

export function DeleteAccountSheet({
  visible,
  onClose,
  onConfirm,
  confirming = false,
  errorMessage = null,
}: DeleteAccountSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBack={onClose}
      title="Delete Account"
      testID="delete-account-sheet"
    >
      <View style={styles.body}>
        <PromptBlock
          title="Are you sure you want to delete?"
          tone="critical"
          testID="delete-account-prompt"
        />

        {errorMessage === null ? null : (
          <Text
            variant="body"
            color="textSecondary"
            align="center"
            accessibilityRole="alert"
            testID="delete-account-error"
          >
            {errorMessage}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            label="No"
            onPress={onClose}
            variant="outlineSoft"
            size="bar"
            fullWidth={false}
            disabled={confirming}
            style={styles.actionButton}
            testID="delete-account-no"
          />
          <Button
            label="Yes"
            onPress={onConfirm}
            variant="dangerSolid"
            size="bar"
            fullWidth={false}
            disabled={confirming}
            loading={confirming}
            style={styles.actionButton}
            testID="delete-account-yes"
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: lightTheme.space.lg, paddingVertical: lightTheme.space.lg },
  actions: { flexDirection: 'row', gap: lightTheme.space.s10 },
  actionButton: { flex: 1 },
});
