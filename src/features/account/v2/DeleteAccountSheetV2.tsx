import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { OutlineButton, PrimaryButton } from '@ui/v2/Buttons';
import { Sheet } from '@ui/v2/Sheet';
import { C, T } from '@ui/v2/theme';

import { ACCOUNTS_ART } from '@ui/v2/accountsArt';

/** What the customer actually has — the "You’ll lose" list names only these. */
export interface DeletionLosses {
  readonly cookPool: boolean;
  readonly foodProfile: boolean;
  readonly visitHistory: boolean;
  readonly addresses: boolean;
}

export interface DeleteAccountSheetV2Props {
  readonly visible: boolean;
  readonly losses: DeletionLosses;
  readonly onKeep: () => void;
  /** Asks for the deletion code; the OTP screen does the deleting. */
  readonly onDelete: () => void;
  readonly onLogout: () => void;
  readonly requesting?: boolean;
  readonly errorMessage?: string | null;
}

const LOSS_ROWS: readonly {
  readonly key: keyof DeletionLosses;
  readonly icon: ImageSourcePropType;
  readonly label: string;
}[] = [
  {
    key: 'cookPool',
    icon: ACCOUNTS_ART.favorite,
    label: 'Your Cook Pool · cooks who know your taste',
  },
  { key: 'foodProfile', icon: ACCOUNTS_ART.dish, label: 'Your Food Profile' },
  { key: 'visitHistory', icon: ACCOUNTS_ART.bookings, label: 'Visit history, ratings & feedback' },
  { key: 'addresses', icon: ACCOUNTS_ART.location, label: 'Saved addresses' },
];

/**
 * Delete account — confirm (Figma `1517:10362`, dev note `2084:2786`). "Keep my account" is the
 * primary action; "Delete permanently" (the outline) asks for the deletion code exactly as before
 * (`/account/delete-otp`). "Log out instead" signs out without deleting.
 */
export function DeleteAccountSheetV2(props: DeleteAccountSheetV2Props) {
  const losses = LOSS_ROWS.filter((row) => props.losses[row.key]);
  const requesting = props.requesting === true;

  return (
    <Sheet
      visible={props.visible}
      onClose={props.onKeep}
      dismissible={!requesting}
      handle="soft"
      testID="delete-account-sheet"
    >
      <View style={styles.content}>
        <View style={styles.trashDisc}>
          <Image source={ACCOUNTS_ART.trash} style={styles.icon24} />
        </View>
        <View style={styles.title} testID="delete-account-prompt">
          <Text style={[T.title, styles.center]}>Delete your account?</Text>
          <Text style={[T.body, styles.secondary, styles.center]}>
            This is permanent and can’t be undone.
          </Text>
        </View>
        {losses.length === 0 ? null : (
          <View style={styles.lose} testID="delete-account-losses">
            <Text style={[T.captionStrong, styles.secondary]}>You’ll lose</Text>
            {losses.map((row) => (
              <View key={row.key} style={styles.loseItem} testID={`delete-account-loss-${row.key}`}>
                <Image source={row.icon} style={styles.icon20} />
                <Text style={[T.bodyStrong, styles.flex]}>{row.label}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={[T.caption, styles.secondary, styles.center]}>
          Any upcoming bookings will be cancelled.
        </Text>
        {props.errorMessage === undefined || props.errorMessage === null ? null : (
          <Text
            style={[T.body, styles.secondary, styles.center]}
            accessibilityRole="alert"
            testID="delete-account-error"
          >
            {props.errorMessage}
          </Text>
        )}
        <PrimaryButton
          label="Keep my account"
          onPress={props.onKeep}
          disabled={requesting}
          style={styles.button}
          testID="delete-account-no"
        />
        {requesting ? (
          <View style={[styles.button, styles.lockedButton]} testID="delete-account-yes">
            <ActivityIndicator color={C.text} />
          </View>
        ) : (
          <OutlineButton
            label="Delete permanently"
            onPress={props.onDelete}
            style={styles.button}
            testID="delete-account-yes"
          />
        )}
        <View style={styles.breakRow}>
          <Text style={[T.caption, styles.secondary]}>Just need a break?</Text>
          <Pressable
            onPress={props.onLogout}
            disabled={requesting}
            accessibilityRole="button"
            accessibilityLabel="Log out instead"
            hitSlop={8}
            testID="delete-account-logout"
          >
            <Text style={[T.captionStrong, styles.underline]}>Log out instead</Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: 16, paddingHorizontal: 8, paddingBottom: 16 },
  trashDisc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: { width: 24, height: 24 },
  icon20: { width: 20, height: 20 },
  title: { gap: 4, alignSelf: 'stretch' },
  center: { textAlign: 'center' },
  secondary: { color: C.textSecondary },
  lose: {
    alignSelf: 'stretch',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.subtle,
  },
  loseItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  button: { alignSelf: 'stretch', height: 48 },
  lockedButton: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakRow: { flexDirection: 'row', gap: 4 },
  underline: { textDecorationLine: 'underline' },
});
