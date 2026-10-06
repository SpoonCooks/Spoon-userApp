import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { MandateVerifyDto, RecurringBookingDto } from '../api';
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
 */
export interface RecurringBookedScreenProps {
  readonly booking: RecurringBookingDto;
  readonly mandate: MandateVerifyDto;
  readonly onDone: () => void;
  readonly testID?: string;
}

export function RecurringBookedScreen({
  booking,
  mandate,
  onDone,
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
      footer={<RecurringFooter label="Done" onPress={onDone} testID={`${testID}-done`} />}
    >
      <RecurringScrollBody contentStyle={styles.content} testID={`${testID}-body`}>
        <View style={styles.section}>
          <Text variant="headingSection" color="textPrimary" testID={`${testID}-title`}>
            {confirmed ? 'Your Recurring booking is confirmed' : 'Waiting for your bank'}
          </Text>
          <Text variant="body" color="textPrimary">
            {confirmed
              ? 'UPI Autopay is set up. Each visit is charged only shortly before it starts.'
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
