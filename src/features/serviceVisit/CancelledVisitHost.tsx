import { useState } from 'react';

import { useBookingRefunds } from '@features/booking';
import type { BookingDetailDto } from '@features/booking';
import { PaymentDetailsSheet, VisitDetailsScreen } from '@features/recurringLive';

import { cancelledVisitModelFrom } from './cancelledVisit';

export interface CancelledVisitHostProps {
  readonly booking: BookingDetailDto;
  readonly onBack: () => void;
  readonly onHelp: () => void;
}

/**
 * A cancelled one-time booking's Visit details (Figma `2165:11853`): the booking, its latest
 * refund (`GET /v1/bookings/:id/refunds`) and the Payment details sheet. Only Payment details and
 * Help remain in the dock (dev note `2226:4224`).
 */
export function CancelledVisitHost({ booking, onBack, onHelp }: CancelledVisitHostProps) {
  const refunds = useBookingRefunds(booking.id);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const refund = refunds.state.status === 'ready' ? (refunds.state.data[0] ?? null) : null;
  const model = cancelledVisitModelFrom(booking, refund, booking.cook?.name ?? null);

  return (
    <>
      <VisitDetailsScreen
        model={model}
        title={booking.slotType === 'instant' ? 'Instant visit' : 'On-time visit'}
        onBack={onBack}
        onPaymentDetails={() => setPaymentOpen(true)}
        onHelp={onHelp}
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
