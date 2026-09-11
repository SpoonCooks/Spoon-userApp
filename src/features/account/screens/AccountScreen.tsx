import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ScreenHeader, lightTheme } from '@ui';

import { DeleteAccountSheet } from '../components/DeleteAccountSheet';

/**
 * Account — reached from Profile's "Manage account" row. Still no frame id, but the three rows'
 * own geometry is read off the Figma inspector directly: 334 × 34, px 12 / py 6, 16pt radius —
 * `#FFEF99` for Terms of Service and Privacy Policy, `#FF0404` at 30% for Delete Account (see
 * `styles.softRow` / `styles.deleteRow`). Terms and Privacy reuse the documents `@features/legal`
 * already ships in-app (`/legal/terms`, `/legal/privacy`); see the superseded Ruling R-6 in
 * `@features/profile`.
 *
 * Delete Account has no backend behind it yet — see `AccountDeletionUnavailableError` in
 * `../data.ts` and `docs/FRONTEND_BACKEND_PENDING.md`. The sheet stays open and shows the
 * failure rather than pretending the account was deleted.
 */
export interface AccountActions {
  readonly onBack: () => void;
  readonly onOpenTerms: () => void;
  readonly onOpenPrivacy: () => void;
  readonly onOpenDeleteSheet: () => void;
  readonly onCloseDeleteSheet: () => void;
  readonly onConfirmDelete: () => void;
}

export interface AccountViewProps extends AccountActions {
  readonly deleteSheetVisible: boolean;
  readonly deleting?: boolean;
  readonly deleteErrorMessage?: string | null;
}

export function AccountView({
  onBack,
  onOpenTerms,
  onOpenPrivacy,
  onOpenDeleteSheet,
  onCloseDeleteSheet,
  onConfirmDelete,
  deleteSheetVisible,
  deleting = false,
  deleteErrorMessage = null,
}: AccountViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID="account-screen">
      <View style={styles.headerColumn}>
        <ScreenHeader title="Account" onBack={onBack} />
      </View>

      <View style={styles.body}>
        <Button
          label="Terms of Service"
          onPress={onOpenTerms}
          variant="secondary"
          size="form"
          style={styles.softRow}
          testID="account-terms"
        />
        <Button
          label="Privacy Policy"
          onPress={onOpenPrivacy}
          variant="secondary"
          size="form"
          style={styles.softRow}
          testID="account-privacy"
        />
        <Button
          label="Delete Account"
          onPress={onOpenDeleteSheet}
          variant="secondary"
          size="form"
          style={styles.deleteRow}
          testID="account-delete"
        />
      </View>

      <DeleteAccountSheet
        visible={deleteSheetVisible}
        onClose={onCloseDeleteSheet}
        onConfirm={onConfirmDelete}
        confirming={deleting}
        errorMessage={deleteErrorMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surfaceForm },
  headerColumn: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  body: {
    flexGrow: 1,
    gap: lightTheme.space.md,
    padding: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  /**
   * Figma inspector, read off the Terms/Privacy/Delete rows directly: 334 × 34, px 12 / py 6,
   * 16pt radius, `#FFEF99` fill — `secondary`'s white-plus-border swapped for that fill, no
   * border. `size="form"` already draws the 34pt bar at that padding; only the fill, the border
   * and the radius (16, not `form`'s own 30) are overridden here.
   */
  softRow: {
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    borderWidth: 0,
    borderRadius: 16,
  },
  /** Same geometry as `softRow`; the inspector gives Delete Account `#FF0404` at 30% instead. */
  deleteRow: {
    backgroundColor: lightTheme.colors.dangerSurfaceStrong,
    borderWidth: 0,
    borderRadius: 16,
  },
});
