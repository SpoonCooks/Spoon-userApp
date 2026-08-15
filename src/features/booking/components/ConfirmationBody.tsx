import { Pressable, StyleSheet, View } from 'react-native';

import { CookCard, DetailRows, StatusBanner, Text, lightTheme } from '@ui';
import type { CookViewModel } from '@ui';

import type { BookingSummaryViewModel } from '../types';

/**
 * Confirmation — Figma `3:1041`.
 *
 * Layout, verbatim from the frame:
 *   banner    `40:5346` — the STACKED lime banner: a 64pt `#CFFF04` disc over a Livvic Black
 *                         20/28 title, centred. Not the icon-beside-title row it was before.
 *   cook      `94:906`  — the shared cook card
 *   summary   `3:1095`  — a `#FFF7CC` card at a 16pt radius, 19.889pt padding, 6pt row gap
 *   actions   `3:1145`  — ONE white bar (1pt `#E2E8F0`, radius 16) holding
 *                         "Reschedule Booking" `#BB4D00` | "Cancel Booking & Refund" `#EC003F`,
 *                         split by a `#CAD5E2` pipe. They are not two separate buttons.
 *
 * Boundary:
 *  - every summary row, including Total, is a server value rendered verbatim (no arithmetic);
 *  - ruling R-3: the Reschedule action renders only when the SERVER says the booking is still
 *    eligible. `rescheduleAllowed` absent means "the server did not say", which hides it;
 *  - the Cancel action is present in the design but its handler stays unwired until blocker
 *    B-11 resolves where cancellation is entered from (PRODUCT_PENDING).
 */
export interface ConfirmationBodyProps {
  readonly summary: BookingSummaryViewModel;
  readonly cook?: CookViewModel;
  readonly onCallCook?: () => void;
  readonly onReschedule?: () => void;
  readonly onCancel?: () => void;
}

export function ConfirmationBody({
  summary,
  cook,
  onCallCook,
  onReschedule,
  onCancel,
}: ConfirmationBodyProps) {
  const canReschedule = summary.rescheduleAllowed === true && onReschedule !== undefined;
  const showActions = canReschedule || onCancel !== undefined;

  return (
    <View style={styles.container} testID="confirmation-body">
      <StatusBanner
        title={summary.bannerTitle}
        tone="positive"
        layout="stacked"
        icon="checkCircle"
        testID="confirmation-banner"
      />

      {cook === undefined ? null : (
        <CookCard
          cook={cook}
          {...(onCallCook === undefined ? {} : { onCallCook })}
          testID="confirmation-cook"
        />
      )}

      <View style={styles.summary} testID="confirmation-summary">
        <DetailRows rows={summary.rows} testID="confirmation-rows" />
      </View>

      {showActions ? (
        <View style={styles.actions}>
          {canReschedule ? (
            <Pressable
              onPress={onReschedule}
              accessibilityRole="button"
              accessibilityLabel={summary.rescheduleLabel}
              hitSlop={10}
              testID="confirmation-reschedule"
            >
              <Text variant="bodyBold" color="textReschedule">
                {summary.rescheduleLabel}
              </Text>
            </Pressable>
          ) : null}

          {canReschedule && onCancel !== undefined ? (
            <Text variant="body" color="border">
              |
            </Text>
          ) : null}

          {onCancel === undefined ? null : (
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={summary.cancelLabel}
              hitSlop={10}
              testID="confirmation-cancel"
            >
              <Text variant="bodyBold" color="textDestructive">
                {summary.cancelLabel}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: lightTheme.space.s10 },
  /** `3:1095` — `#FFF7CC`, 16pt radius, 19.889pt padding, `0 0 2 rgba(0,0,0,0.15)`. */
  summary: {
    padding: 19.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  /** `3:1145` — a single white bar carrying both actions. */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: lightTheme.space.md,
    paddingHorizontal: 11.889,
    paddingVertical: lightTheme.space.s10,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
  },
});
