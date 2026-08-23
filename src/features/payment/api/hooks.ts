import { useMutation, useQueryClient } from '@tanstack/react-query';

import { idempotency } from '@core/api';
import { useRuntime } from '@core/runtimeContext';
import { bookingKeys } from '@features/booking';

import { createPaymentApi, unavailableCheckoutLauncher } from './paymentApi';
import type { CheckoutLauncher } from './paymentApi';
import type { PaymentOrderDto } from './schemas';

/**
 * The payment flow, as one mutation.
 *
 * It is deliberately a SINGLE mutation rather than three, because the three steps are not
 * independently meaningful: an order without a checkout is a dangling hold, and a checkout
 * without a verify is a payment the backend has not accepted. Modelling them as one operation
 * makes the invariant — "we always try to verify what we opened" — structural.
 *
 * The final act is a REFETCH, not a state write. What the payment did to the booking is the
 * server's answer; the client asks for it rather than asserting it. That is the whole point of
 * §16's "never treat the client callback as payment truth".
 */
export function usePayForBooking(launcher: CheckoutLauncher = unavailableCheckoutLauncher) {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const payments = createPaymentApi(api);

  return useMutation<
    PaymentOrderDto,
    Error,
    { bookingId: string; description: string; contact?: string; name?: string }
  >({
    async mutationFn({ bookingId, description, contact, name }) {
      // One scope for the whole intent, so an order retried after a timeout is the SAME order.
      const orderScope = `payment:order:${bookingId}`;
      const order = await payments.createOrder(bookingId, orderScope);

      // `processing` means the upstream order is not ready. Opening checkout against a null order
      // id is impossible, so the caller is told to retry rather than shown a broken sheet.
      if (order.status === 'processing' || order.providerOrderId === null) {
        return order;
      }
      if (order.keyId === null) {
        throw new Error('No Razorpay publishable key is configured for this environment.');
      }

      const result = await launcher.open({
        keyId: order.keyId,
        providerOrderId: order.providerOrderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        description,
        ...(contact === undefined && name === undefined
          ? {}
          : {
              prefill: {
                ...(contact === undefined ? {} : { contact }),
                ...(name === undefined ? {} : { name }),
              },
            }),
      });

      // The backend checks the signature. Until this resolves, nothing is paid.
      await payments.verify(bookingId, result, `payment:verify:${bookingId}`);
      idempotency.release(orderScope);

      return order;
    },
    onSettled(_data, _error, variables) {
      // Refetch regardless of outcome: a verify that FAILED still may have moved the booking
      // (the webhook can arrive independently), so the server's view is re-read either way.
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(variables.bookingId),
      });
    },
  });
}
