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
 *
 * The No/Yes pair is the sheet's FOOTER rather than the last row of its body, which is where
 * every other sheet with a CTA puts it -- Instant, Schedule -- because `BottomSheet` pins the
 * footer below the scrolling body. In the body it sat wherever the content left it; pinned, it is
 * at the bottom of the sheet on every phone, and cannot be scrolled out of reach on a short one.
 *
 * ## What the prompt carries, and what it dropped
 *
 * A separate disclosure block used to sit above the prompt: immediacy, what is erased, and that
 * payment and invoice records survive for eight years under Indian tax law with the name and
 * number stripped. It read as too long on the sheet, so the irreversibility -- the half Apple and
 * Google actually check for on a deletion screen -- folded into the prompt itself, and the
 * retention detail went. That detail is still stated in full by the in-app Privacy Policy
 * (`src/features/legal/documents.ts`), which is now the only place in the app that gives it.
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
      /*
       * The disc, as `CancelBookingSheet`, `BookingDetailsSheet` and `HelpMePickSheet` all ask
       * for, and as the Account screen behind this one draws through `ScreenHeader`. This sheet
       * was the only one taking `BottomSheet`'s `plain` default -- a bare Feather arrow where
       * everything around it is `DirectionalDisc`'s exported asset. Two different back buttons on
       * one screen, one on top of the other.
       */
      backVariant="outlined"
      title="Delete Account"
      testID="delete-account-sheet"
      footer={
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
      }
    >
      <View style={styles.body}>
        <PromptBlock
          title="This happens immediately and cannot be undone. Are you sure you want to delete?"
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
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: lightTheme.space.lg, paddingVertical: lightTheme.space.lg },
  actions: { flexDirection: 'row', gap: lightTheme.space.s10 },
  actionButton: { flex: 1 },
});
