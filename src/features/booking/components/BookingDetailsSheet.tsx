import { StyleSheet, View } from 'react-native';

import { BottomSheet, DetailRows, Text, lightTheme } from '@ui';
import type { DetailRow } from '@ui';

/**
 * Booking details — Figma `250:2861` "Page 7b- Booking details". NEW in the current file.
 *
 * It is a SHEET, not a screen: `250:2878` is a 496pt white panel with 20pt top corners over an
 * `rgba(0,0,0,0.8)` scrim, reached from Confirmation's "View booking details" row (`250:2966`).
 *
 * Layout, verbatim:
 *   header   `250:2879` — white, pt 16 / pb 6 / px 16, a 45pt band holding a 32pt back disc and
 *                         "Booking details" at Livvic Black 20/28
 *   body     `250:2888` — p 16, 16pt between the two sections
 *   §1       `257:3499` — py 6, 12pt gap: "Booking details" at Livvic Bold 14/20, then `3:1095`,
 *                         a `#FFF7CC` card at a 16pt radius with 19.889pt padding, a 6pt row gap,
 *                         `0 0 2 rgba(0,0,0,0.15)` and `#FFEF99` rules
 *   §2       `257:3501` — py 6, 10pt gap: "Payment details", then `257:3439`, the same card in
 *                         lime at 70 % with `0 0 4 rgba(0,0,0,0.15)` and `#CFFF04` rules
 *
 * `3:1095` is the SAME node that used to sit inline on Confirmation. It did not get copied here —
 * it moved, which is why Confirmation lost 47 nodes.
 *
 * BOUNDARY: every row on both tables is a pre-formatted server string. This component performs no
 * arithmetic — it does not derive the tax line from the amount, does not sum the total, and does
 * not know the tax rate. "Taxes @5%" is a LABEL the server supplies, not a rate the client
 * applies (FRONTEND_FOUNDATION_PLAN.md §20). Pricing and tax configuration stay backend-owned.
 */
export interface BookingDetailsViewModel {
  /** `250:2881` — "Booking details". */
  readonly title: string;
  /** `257:3500` — the first section's heading. */
  readonly bookingSectionTitle: string;
  /** `3:1095` — Date / Start time / Duration / End Time, verbatim. */
  readonly bookingRows: readonly DetailRow[];
  /** `257:3502` — "Payment details". */
  readonly paymentSectionTitle: string;
  /** `257:3439` — Booking amount / Taxes / Total paid, verbatim. */
  readonly paymentRows: readonly DetailRow[];
}

export interface BookingDetailsSheetProps {
  readonly visible: boolean;
  readonly details: BookingDetailsViewModel;
  readonly onClose: () => void;
  readonly testID?: string;
}

export function BookingDetailsSheet({
  visible,
  details,
  onClose,
  testID = 'booking-details-sheet',
}: BookingDetailsSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={details.title}
      onBack={onClose}
      backVariant="outlined"
      headerVariant="screen"
      bodyStyle={styles.body}
      testID={testID}
    >
      <View style={styles.section}>
        <Text variant="title" color="textPrimary" accessibilityRole="header">
          {details.bookingSectionTitle}
        </Text>
        <View style={styles.bookingCard}>
          <DetailRows
            rows={details.bookingRows}
            variant="booking"
            testID={`${testID}-booking-rows`}
          />
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text variant="title" color="textPrimary" accessibilityRole="header">
          {details.paymentSectionTitle}
        </Text>
        <View style={styles.paymentCard}>
          <DetailRows
            rows={details.paymentRows}
            variant="payment"
            testID={`${testID}-payment-rows`}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  /** `250:2888` — p 16 with 16pt between the two sections. */
  body: {
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.lg,
    gap: lightTheme.space.lg,
  },
  /** `257:3499` — py 6, 12pt between the heading and the card. */
  section: { paddingVertical: lightTheme.space.s6, gap: lightTheme.space.md },
  /** `257:3501` — the payment section closes to a 10pt gap. */
  paymentSection: { paddingVertical: lightTheme.space.s6, gap: lightTheme.space.s10 },
  /** `3:1095` — `#FFF7CC`, 16pt radius, 19.889pt padding, `0 0 2 rgba(0,0,0,0.15)`. */
  bookingCard: {
    padding: 19.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
    ...lightTheme.elevation.soft,
  },
  /**
   * `257:3439` — lime at 70 % over white, so it uses the PRE-COMPOSITED token: the card carries
   * `0 0 4 rgba(0,0,0,0.15)`, and on Android an elevation shadow shows through a translucent
   * fill (see `palette.limeTrust`). Its lift is a step stronger than the yellow card's.
   */
  paymentCard: {
    padding: 19.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceTrust,
    ...lightTheme.elevation.tile,
  },
});
