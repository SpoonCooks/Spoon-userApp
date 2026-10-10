import { StyleSheet, View } from 'react-native';

import {
  BOOKING_NOTE_REFUND_ART,
  CancelledHero,
  DetailRows,
  NoticeCard,
  RefundDestinationRow,
  Text,
  lightTheme,
} from '@ui';

import { RefundTracker } from '@features/refunds';

import type { CustomerCancelledViewModel } from '../types';

/**
 * Customer cancelled — Figma `606:4895` ("Page 8d- User cancelled"). A TERMINAL state: the
 * customer cancelled this booking themselves, and the screen exists only to confirm it and show
 * the refund.
 *
 * `606:4910` stacks the hero and the refund notice 24pt apart, then the booking-details block
 * sits below at the same gap:
 *   hero     `606:4911` — the SAME white 24pt-radius card `CancelledHero` already draws for
 *                         `115:2716` and `201:66`: 116 × 72 artwork over the title, centred
 *   refund   `606:4927` — the SAME outlined notice `AutoCancelledBody`'s refund block uses
 *                         (`201:467`), minus the apology card above it — nothing here apologises
 *                         for a cancellation the customer made themselves
 *   details  `606:4945` — "Booking details" over the SAME `#FFF7CC` table `BookingDetailsSheet`
 *                         draws (`3:1095`), not the older `summary` variant `AutoCancelledBody`
 *                         still uses — this node was read fresh off the current file
 *
 * BOUNDARY (task §10, §20, FRONTEND_FOUNDATION_PLAN.md §20), identical to `AutoCancelledBody`:
 *  - **nothing here computes a refund.** `refundAmount` is rendered exactly as supplied; the
 *    client never derives `paid − fee`. The same rule governs every figure in the table.
 *  - nothing here decides that a booking was customer-cancelled, when that happens, or what the
 *    cancellation reason was. The screen renders a state the server has already reached.
 *
 * No apology block and no rebook prompt: `606:4895` draws neither, unlike `201:278`. A customer
 * who chose to cancel is not owed an apology for their own decision, and the frame offers no
 * "book again?" prompt the way the auto-cancelled one does.
 */
export interface CustomerCancelledBodyProps {
  readonly cancelled: CustomerCancelledViewModel;
  /** A failed refund's "Contact support" (DEC-090) — WhatsApp with the message prefilled. */
  readonly onContactSupport?: (message: string) => void;
}

export function CustomerCancelledBody({ cancelled, onContactSupport }: CustomerCancelledBodyProps) {
  return (
    <View style={styles.container} testID="customer-cancelled-body">
      {/* `606:4911` is byte-identical to `201:66` and `115:2716`. */}
      <CancelledHero title={cancelled.title} testID="customer-cancelled-hero" />

      {/* The tracker (DEC-090) once the server sends it; the designed notice before. */}
      {cancelled.refundTracker === undefined ? (
        <NoticeCard
          title={cancelled.refundTitle}
          body={cancelled.refundBody}
          art={BOOKING_NOTE_REFUND_ART}
          testID="customer-cancelled-refund"
        >
          <View style={styles.refundFigures}>
            <View style={styles.refundRow}>
              <Text variant="bodyStrong" color="textPrimary">
                {cancelled.refundAmountLabel}
              </Text>
              {/* Server-supplied and rendered verbatim. Never `paid − fee`. */}
              <Text variant="headingCta" color="textPrimary" align="right">
                {cancelled.refundAmount}
              </Text>
            </View>

            <RefundDestinationRow
              destination={cancelled.refundDestination}
              timeframe={cancelled.refundTimeframe}
              testID="customer-cancelled-destination"
            />
          </View>
        </NoticeCard>
      ) : (
        <RefundTracker
          refund={cancelled.refundTracker}
          onContactSupport={onContactSupport ?? noop}
          testID="customer-cancelled-refund-tracker"
        />
      )}

      <View style={styles.details} testID="customer-cancelled-details">
        <Text variant="title" color="textPrimary" accessibilityRole="header">
          {cancelled.detailsTitle}
        </Text>
        <View style={styles.detailsCard}>
          <DetailRows rows={cancelled.rows} variant="booking" testID="customer-cancelled-rows" />
        </View>
      </View>
    </View>
  );
}

function noop() {
  // A host that wires no support handler gets an inert Contact support, not an invented route.
}

const styles = StyleSheet.create({
  /** `606:4910` — 24pt between the hero, the refund notice and the details block. */
  container: { gap: lightTheme.space.xl },
  /** `201:478` — 16pt between the figures and the destination row, matching the refund card. */
  refundFigures: { gap: lightTheme.space.lg, paddingVertical: lightTheme.space.s6 },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  /** `606:4945` — 12pt between the heading and the table. */
  details: { gap: lightTheme.space.md },
  /** `3:1095` as drawn on `250:2861` — `#FFF7CC`, 16pt radius, 19.889pt padding. Same style as
   *  `BookingDetailsSheet`'s `bookingCard`. */
  detailsCard: {
    padding: 19.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
    ...lightTheme.elevation.soft,
  },
});
