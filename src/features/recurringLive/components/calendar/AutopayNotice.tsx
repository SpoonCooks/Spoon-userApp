import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The Live booking tab's Autopay notice. NO FIGMA FRAME: the page draws a booking whose Autopay
 * works, and the backend also returns ones that are saved but never approved (`pending_mandate`)
 * and ones whose mandate was paused, revoked or expired (`banner.action: REAPPROVE_MANDATE`).
 * Without approval no visit can be charged, so its cook is never confirmed — the customer has to
 * be told and given the way back to checkout. Built from the page's tokens until a frame lands.
 */
export type AutopayNoticeKind =
  'pending' | 'MANDATE_PAUSED' | 'MANDATE_REVOKED' | 'MANDATE_EXPIRED';

const COPY: Record<AutopayNoticeKind, { title: string; body: string; action: string }> = {
  pending: {
    title: 'Approve UPI Autopay',
    body: 'Your visits are saved. Approve Autopay so each visit can be charged 3 hours before it starts and your cook confirmed.',
    action: 'Approve UPI Autopay',
  },
  MANDATE_PAUSED: {
    title: 'Autopay is paused',
    body: 'Your next visits can’t be charged until you approve Autopay again.',
    action: 'Re-approve Autopay',
  },
  MANDATE_REVOKED: {
    title: 'Autopay was turned off',
    body: 'Your next visits can’t be charged until you approve Autopay again.',
    action: 'Re-approve Autopay',
  },
  MANDATE_EXPIRED: {
    title: 'Autopay has expired',
    body: 'Your next visits can’t be charged until you approve Autopay again.',
    action: 'Re-approve Autopay',
  },
};

export interface AutopayNoticeProps {
  readonly kind: AutopayNoticeKind;
  readonly busy: boolean;
  readonly onApprove: () => void;
  readonly testID?: string;
}

export function AutopayNotice({
  kind,
  busy,
  onApprove,
  testID = 'autopay-notice',
}: AutopayNoticeProps) {
  const copy = COPY[kind];
  return (
    <View style={styles.card} testID={testID}>
      <Text variant="spoonEmphasis" color="textPrimary">
        {copy.title}
      </Text>
      <Text variant="spoonCaption" color="textSecondarySoft">
        {copy.body}
      </Text>
      <Button
        label={copy.action}
        onPress={onApprove}
        loading={busy}
        disabled={busy}
        flat
        labelVariant="spoonButton"
        style={styles.action}
        testID={`${testID}-approve`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: lightTheme.space.xs,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderNotice,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  action: {
    marginTop: lightTheme.space.sm,
    minHeight: 48,
    borderRadius: lightTheme.radius.pill,
  },
});
