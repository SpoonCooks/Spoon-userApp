import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { MandateVerifyDto, RecurringBookingDto } from '../api';
import { formatPaiseGrouped } from '@core/format';

import { summaryFromBooking } from '../autopay/summary';
import { editDateLabel } from '../data';
import { RecurringFooter } from '../components/RecurringFooter';
import { RecurringScrollBody } from '../components/RecurringScrollBody';

/**
 * Recurring setup — the confirmation after UPI Autopay (DEC-086 Step 8: "one confirmation screen
 * follows"). NO FIGMA FRAME, like the Autopay step: built from the flow's own components and
 * named tokens; replace its layout when a frame lands.
 *
 * Two outcomes, both the server's word, never the device's:
 * - the mandate is `confirmed` and the booking `active`: the booking is confirmed.
 * - the bank is still confirming (UPI often answers `initiated`): the Cooks stay held while it
 *   does, and the Recurring booking updates by itself when the bank's answer arrives.
 *
 * Either way no Cook is named: a visit's Cook is confirmed and revealed at its T−3h.
 *
 * Confirmed, it also says what Autopay will do, the way the UPI Autopay sheet's Active state does
 * (Figma `2317:4009`): the per-visit price before tax, the per-charge limit and the masked UPI
 * handle; and, given `onViewPlan`, its CTA is "View my plan" (note 2317:13617) instead of "Done".
 * This screen is the Checkout fallback's confirmation; the UPI Intent flow ends on the sheet.
 */
export interface RecurringBookedScreenProps {
  readonly booking: RecurringBookingDto;
  readonly mandate: MandateVerifyDto;
  readonly onDone: () => void;
  /** Confirmed only: opens the live booking ("View my plan"). */
  readonly onViewPlan?: () => void;
  readonly testID?: string;
}

export function RecurringBookedScreen({
  booking,
  mandate,
  onDone,
  onViewPlan,
  testID = 'recurring-booked-screen',
}: RecurringBookedScreenProps) {
  const confirmed = mandate.status === 'confirmed' || mandate.bookingStatus === 'active';
  const days = booking.plans.reduce((sum, plan) => sum + plan.days.length, 0);
  const visits = booking.counts.toGo;
  const first = booking.upNext;
  // The reveal lead, read off the visit itself rather than written into the copy.
  const leadHours =
    first === null
      ? null
      : Math.round((Date.parse(first.start) - Date.parse(first.cookConfirmBy)) / 3_600_000);

  return (
    <Screen
      tone="plain"
      padded={false}
      testID={testID}
      header={<ScreenHeader density="nav" title="Recurring" testID={`${testID}-header`} />}
      footer={
        confirmed && onViewPlan !== undefined ? (
          <RecurringFooter
            label="View my plan"
            onPress={onViewPlan}
            testID={`${testID}-view-plan`}
          />
        ) : (
          <RecurringFooter label="Done" onPress={onDone} testID={`${testID}-done`} />
        )
      }
    >
      <RecurringScrollBody contentStyle={styles.content} testID={`${testID}-body`}>
        <View style={styles.section}>
          <Text variant="headingSection" color="textPrimary" testID={`${testID}-title`}>
            {confirmed ? 'Your Recurring booking is confirmed' : 'Waiting for your bank'}
          </Text>
          <Text variant="body" color="textPrimary">
            {confirmed
              ? 'UPI Autopay is set up. You are charged 3 hrs before your first visit of the day.'
              : 'Your bank is confirming UPI Autopay. Your cooks stay held meanwhile, and your booking updates as soon as the bank answers.'}
          </Text>
        </View>
        <View style={styles.section}>
          <Text variant="body" color="textSecondary" testID={`${testID}-summary`}>
            {days} days · {visits} visits · {editDateLabel(booking.window.startDate)} onwards
          </Text>
          {first === null ? null : (
            <Text variant="body" color="textSecondary" testID={`${testID}-first`}>
              First visit: {editDateLabel(first.date)}
            </Text>
          )}
          {confirmed ? (
            <>
              <Text variant="body" color="textSecondary" testID={`${testID}-per-visit`}>
                Per visit: {summaryFromBooking(booking).priceWithTax}
              </Text>
              {booking.mandate === null ? null : (
                <Text variant="body" color="textSecondary" testID={`${testID}-limit`}>
                  Up to {formatPaiseGrouped(booking.mandate.maxAmountPaise)} per charge
                </Text>
              )}
            </>
          ) : null}
          {mandate.handleMasked === null ? null : (
            <Text variant="body" color="textSecondary" testID={`${testID}-handle`}>
              Autopay from {mandate.handleMasked}
            </Text>
          )}
          <Text variant="body" color="textSecondary">
            {leadHours === null
              ? 'Your cook for each visit is confirmed shortly before it starts.'
              : `Your cook for each visit is confirmed ${String(leadHours)} hours before it starts.`}
          </Text>
        </View>
      </RecurringScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
  section: { gap: lightTheme.space.md },
});
