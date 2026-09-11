import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Button, Screen, Text, lightTheme } from '@ui';
import { formatPaise } from '@core/format';

/**
 * Payment Failed — the sibling of `ConfirmationLoading` (Page 21, `433:2290`): checkout came
 * back with nothing to confirm, so instead of the "in progress" wait this is what runs.
 *
 * Boundary, same rule as everywhere else in the flow: the amount is the price SNAPSHOT the
 * booking was created with, never recomputed here, and "Cancel booking" is offered only when
 * `allowedActions.canCancel` says so — a control this screen has no authority to invent.
 *
 * Plain white, no map or other art behind it — the mock draws no background here.
 */

/** The exported mark, `89.72 × 91.28` in Figma. */
const PAYMENT_FAILED_MARK =
  require('../../../../assets/figma/payment/payment-failed.png') as ImageSourcePropType;

export interface PaymentFailedBodyProps {
  readonly amountPaise: number;
  readonly retrying: boolean;
  readonly onRetry: () => void;
  readonly cancelAllowed: boolean;
  readonly cancelling: boolean;
  readonly onCancel: () => void;
}

export function PaymentFailedBody({
  amountPaise,
  retrying,
  onRetry,
  cancelAllowed,
  cancelling,
  onCancel,
}: PaymentFailedBodyProps) {
  return (
    <Screen
      tone="plain"
      testID="payment-failed-body"
      {...(cancelAllowed
        ? {
            footer: (
              <Button
                label="Cancel booking"
                onPress={onCancel}
                variant="outlineSoft"
                size="bar"
                fullWidth
                disabled={cancelling}
                testID="payment-failed-cancel"
              />
            ),
          }
        : {})}
    >
      <View style={styles.block}>
        <Image
          source={PAYMENT_FAILED_MARK}
          style={styles.mark}
          resizeMode="contain"
          accessible
          accessibilityLabel="Payment failed"
          accessibilityIgnoresInvertColors
        />

        <View style={styles.copy}>
          <Text variant="headingScreen" color="textPrimary" align="center">
            Your payment failed
          </Text>
          <Text variant="headingBold" color="textPrimary" align="center">
            Don’t worry, we’ll hold your slot while you try again
          </Text>
        </View>

        <Button
          label={`Retry payment • ${formatPaise(amountPaise)}`}
          onPress={onRetry}
          variant="bright"
          size="bar"
          fullWidth
          loading={retrying}
          testID="payment-failed-retry"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.xl,
  },
  /** `89.72 × 91.28` in Figma, scaled up from that for on-device legibility. */
  mark: { width: 120, height: 123 },
  copy: { alignSelf: 'stretch', gap: lightTheme.space.sm },
});
