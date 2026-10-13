import { useState } from 'react';

import { useBookingRefunds } from '@features/booking';
import type { BookingDetailDto } from '@features/booking';
import { PaymentDetailsSheet, VisitDetailsScreen } from '@features/recurringLive';

import { cancelledVisitModelFrom, spoonCancelledFrom } from './cancelledVisit';
import type { SpoonCancelledData } from './cancelledVisit';
import { SpoonCancelledCard } from './notices';

export interface CancelledVisitHostProps {
  readonly booking: BookingDetailDto;
  readonly onBack: () => void;
  readonly onHelp: () => void;
  /**
   * Cancelled by Spoon — "Rebook a visit" (`2342:4366`): the booking flow, prefilled with what
   * it can take (the same day and length).
   */
  readonly onRebook: (prefill: SpoonCancelledData['rebook']) => void;
  /** Cancelled by Spoon — "Talk to us" (`2342:4368`): Help chat about this booking. */
  readonly onTalkToUs: () => void;
}

/**
 * A cancelled one-time booking's Visit details (Figma `2165:11853`): the booking, its latest
 * refund (`GET /v1/bookings/:id/refunds`) and the Payment details sheet. Only Payment details and
 * Help remain in the dock (dev note `2226:4224`).
 *
 * Cancelled by Spoon (`2342:4195`, dev note `2342:4405`): the apology card takes the place of the
 * plain "Visit cancelled" card and Payment & refund carries the refund tracker. A booking the
 * customer cancelled is unchanged.
 */
export function CancelledVisitHost({
  booking,
  onBack,
  onHelp,
  onRebook,
  onTalkToUs,
}: CancelledVisitHostProps) {
  const refunds = useBookingRefunds(booking.id);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const refund = refunds.state.status === 'ready' ? (refunds.state.data[0] ?? null) : null;
  const model = cancelledVisitModelFrom(booking, refund, booking.cook?.name ?? null);
  const spoon = spoonCancelledFrom(booking, refund);

  return (
    <>
      <VisitDetailsScreen
        model={model}
        title={booking.slotType === 'instant' ? 'Instant visit' : 'On-time visit'}
        onBack={onBack}
        onPaymentDetails={() => setPaymentOpen(true)}
        onHelp={onHelp}
        cancelledSlot={
          spoon === null ? undefined : (
            <SpoonCancelledCard
              when={spoon.when}
              reason={spoon.reason}
              refundLine={spoon.refundLine}
              onRebook={() => onRebook(spoon.rebook)}
              onTalkToUs={onTalkToUs}
              testID="cancelled-visit-spoon"
            />
          )
        }
        testID="cancelled-visit"
      />
      <PaymentDetailsSheet
        visible={paymentOpen}
        data={model.paymentSheet}
        onClose={() => setPaymentOpen(false)}
      />
    </>
  );
}
