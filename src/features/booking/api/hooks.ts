import { useMutation, useQueryClient } from '@tanstack/react-query';

import { idempotency } from '@core/api';
import { useApiQuery } from '@core/data';
import { observeServerTime } from '@core/time';
import { isAwaitingConfirmation } from '../state/bookingStatusView';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { createBookingApi, createServiceApi } from './bookingApi';
import type { BookingRequestInput } from './bookingApi';
import type { CheckoutLauncher } from '@features/payment';
import { unavailableCheckoutLauncher } from '@features/payment';
import { bookingKeys } from './keys';
import type {
  BookingCreateResponse,
  BookingDetailDto,
  BookingSummaryDto,
  CancellationPreviewDto,
  ExtensionQuoteDto,
  QuoteResponse,
  RatingResultDto,
  RefundDto,
  TipOrderDto,
  RescheduleOptionsDto,
  TrackingDto,
} from './schemas';

/**
 * Booking queries and mutations.
 *
 * ## Invalidation, not optimism
 *
 * No mutation here writes a predicted result into the cache. A cancellation does not set the
 * status to `cancelled`, and an extension does not move `expectedEnd`. Both invalidate and
 * refetch, because the server decides the resulting state and the refund, and a client that
 * guessed would show a number the customer was not actually charged.
 *
 * ## Polling
 *
 * The active booking and tracking refetch on an interval while a booking is live. That is the
 * only "push" this app has until notifications land, and it is deliberately modest: the designed
 * screens show minute-granularity ETAs, so a 30-second poll is already finer than the display.
 */

const LIVE_POLL_MS = 30_000;

export function useBookingDetail(
  bookingId: string | null,
  options: { poll?: boolean } = {},
): ScreenQuery<BookingDetailDto> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery<BookingDetailDto>({
    queryKey: bookingKeys.detail(bookingId ?? 'none'),
    queryFn: async ({ signal }) => {
      const response = await bookings.detail(bookingId ?? '', signal);
      // Measured HERE, against the device clock read at the moment the response landed. Doing it
      // any later folds render delay into the offset (§29). Consumers keep receiving the booking
      // alone — the skew is device-wide state, not a field of this booking.
      observeServerTime(response.serverTime);
      return response.booking;
    },
    enabled: bookingId !== null,
    staleTime: 10_000,
    refetchInterval: options.poll === true ? LIVE_POLL_MS : false,
  });
}

/**
 * How often `433:2290` asks whether the booking has been confirmed.
 *
 * Much tighter than `LIVE_POLL_MS` because the customer is WATCHING this one: they have paid, and
 * every second of the wait is spent on a screen with nothing else on it. It stops the moment the
 * booking settles, so the rate applies to a handful of seconds, not to a session.
 */
const CONFIRMATION_POLL_MS = 2_000;

/**
 * `433:2290` — the read that decides when Page 21 is over.
 *
 * Shares `bookingKeys.detail` with `useBookingDetail`, deliberately: it is the SAME booking, and
 * one cache entry means the lifecycle screen the customer lands on has the payload this screen
 * already fetched rather than a second, possibly older one.
 *
 * The interval is a function of the data, so polling STOPS by itself the moment the server reports
 * anything other than `created`. Nothing here interprets that transition — see
 * `isAwaitingConfirmation`, and see the route for what is done about it.
 */
export function useBookingConfirmation(bookingId: string | null): ScreenQuery<BookingDetailDto> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery<BookingDetailDto>({
    queryKey: bookingKeys.detail(bookingId ?? 'none'),
    queryFn: async ({ signal }) => {
      const response = await bookings.detail(bookingId ?? '', signal);
      observeServerTime(response.serverTime);
      return response.booking;
    },
    enabled: bookingId !== null,
    // No staleness window: this screen exists because the answer is expected to change.
    staleTime: 0,
    refetchInterval: (booking) =>
      booking === undefined || isAwaitingConfirmation(booking.status)
        ? CONFIRMATION_POLL_MS
        : false,
  });
}

export function useActiveBookings(
  options: { enabled?: boolean; poll?: boolean } = {},
): ScreenQuery<readonly BookingSummaryDto[]> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery<readonly BookingSummaryDto[]>({
    queryKey: bookingKeys.active(),
    queryFn: ({ signal }) => bookings.active(signal),
    enabled: options.enabled ?? true,
    staleTime: 10_000,
    refetchInterval: options.poll === false ? false : LIVE_POLL_MS,
  });
}

export function useBookingHistory(): ScreenQuery<readonly BookingSummaryDto[]> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery<readonly BookingSummaryDto[]>({
    queryKey: bookingKeys.history(),
    queryFn: ({ signal }) => bookings.history(signal),
  });
}

/**
 * `GET /v1/bookings/:id/refunds` — one booking's refunds.
 *
 * Read ONLY where a surface names a refund figure. Today that is the auto-cancelled screen
 * (`201:278`), which is why the caller passes `null` for every other lifecycle state rather than
 * adding a request to every booking screen for a number none of them draws.
 */
export function useBookingRefunds(bookingId: string | null): ScreenQuery<readonly RefundDto[]> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery<readonly RefundDto[]>({
    queryKey: bookingKeys.bookingRefunds(bookingId ?? 'none'),
    queryFn: ({ signal }) => bookings.bookingRefunds(bookingId ?? '', signal),
    enabled: bookingId !== null,
  });
}

/** `GET /v1/me/refunds` — the customer-level list, so no N+1 over bookings. */
export function useRefunds() {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery({
    queryKey: bookingKeys.refunds(),
    queryFn: ({ signal }) => bookings.refunds(signal),
  });
}

export function useCancellationPreview(
  bookingId: string | null,
): ScreenQuery<CancellationPreviewDto> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery<CancellationPreviewDto>({
    queryKey: bookingKeys.cancellationPreview(bookingId ?? 'none'),
    queryFn: ({ signal }) => bookings.cancellationPreview(bookingId ?? '', signal),
    enabled: bookingId !== null,
    // The band depends on minutes-to-start, so a stale preview can show the wrong refund.
    staleTime: 0,
  });
}

export function useRescheduleOptions(bookingId: string | null): ScreenQuery<RescheduleOptionsDto> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useApiQuery<RescheduleOptionsDto>({
    queryKey: bookingKeys.rescheduleOptions(bookingId ?? 'none'),
    queryFn: ({ signal }) => bookings.rescheduleOptions(bookingId ?? '', signal),
    enabled: bookingId !== null,
  });
}

export function useTracking(
  bookingId: string | null,
  options: { poll?: boolean } = {},
): ScreenQuery<TrackingDto> {
  const { api } = useRuntime();
  const service = createServiceApi(api);

  return useApiQuery<TrackingDto>({
    queryKey: bookingKeys.tracking(bookingId ?? 'none'),
    queryFn: ({ signal }) => service.tracking(bookingId ?? '', signal),
    enabled: bookingId !== null,
    staleTime: 10_000,
    // The server publishes `refreshAfterSeconds`; polling cadence is its call, not ours.
    // `LIVE_POLL_MS` only covers the first fetch, before any response exists.
    refetchInterval:
      options.poll === false
        ? false
        : (data) =>
            data?.refreshAfterSeconds === undefined || data.refreshAfterSeconds === null
              ? LIVE_POLL_MS
              : data.refreshAfterSeconds * 1000,
  });
}

export function useExtensionOptions(bookingId: string | null) {
  const { api } = useRuntime();
  const service = createServiceApi(api);

  return useApiQuery({
    queryKey: bookingKeys.extensionOptions(bookingId ?? 'none'),
    queryFn: ({ signal }) => service.extensionOptions(bookingId ?? '', signal),
    enabled: bookingId !== null,
  });
}

/**
 * `POST /v1/bookings/quote` as a READ.
 *
 * A quote creates nothing — it asks the server what a booking would cost — so a selection can
 * fire it, and the answer can be cached against that selection. It is a mutation only in HTTP
 * method. The response carries its own `validUntil`; nothing here extends it, and no price on
 * the screen is ever assembled from the catalogue when a quote exists.
 *
 * Disabled until the selection is complete, so an incomplete draft asks for nothing.
 */
export function useQuote(
  input: {
    readonly addressId: string | null;
    readonly slotType: 'instant' | 'scheduled';
    readonly durationMinutes: number | null;
    readonly scheduledStart?: string | null;
  },
  options: { enabled?: boolean } = {},
): ScreenQuery<QuoteResponse> {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  const complete =
    input.addressId !== null &&
    input.durationMinutes !== null &&
    // A scheduled quote without a start is not a quote for anything.
    (input.slotType === 'instant' || (input.scheduledStart ?? null) !== null);

  return useApiQuery<QuoteResponse>({
    queryKey: bookingKeys.quote({
      addressId: input.addressId ?? 'none',
      slotType: input.slotType,
      durationMinutes: input.durationMinutes ?? 0,
      scheduledStart: input.scheduledStart ?? null,
    }),
    queryFn: ({ signal }) =>
      bookings.quote(
        {
          addressId: input.addressId ?? '',
          slotType: input.slotType,
          durationMinutes: input.durationMinutes ?? 0,
          ...(input.scheduledStart === undefined || input.scheduledStart === null
            ? {}
            : { scheduledStart: input.scheduledStart }),
        },
        signal,
      ),
    enabled: complete && options.enabled !== false,
  });
}

/** `POST /v1/bookings/quote`. A quote creates nothing, so it is safe to fire on selection. */
export function useBookingQuote() {
  const { api } = useRuntime();
  const bookings = createBookingApi(api);

  return useMutation<QuoteResponse, Error, BookingRequestInput>({
    mutationFn: (input) => bookings.quote(input),
  });
}

/**
 * `POST /v1/bookings`.
 *
 * The scope names the DRAFT so a retry after an ambiguous failure cannot create two bookings.
 * It is released only on success — the point at which the intent is genuinely spent.
 */
export function useCreateBooking() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const bookings = createBookingApi(api);

  return useMutation<BookingCreateResponse, Error, { input: BookingRequestInput; scope: string }>({
    mutationFn: ({ input, scope }) => bookings.create(input, scope),
    onSuccess(_result, variables) {
      idempotency.release(variables.scope);
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
    },
  });
}

export function useCancelBooking() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const bookings = createBookingApi(api);

  return useMutation<
    unknown,
    Error,
    { bookingId: string; reasonCode: string; reasonDetail?: string; scope: string }
  >({
    mutationFn: ({ bookingId, reasonCode, reasonDetail, scope }) =>
      bookings.cancel(
        bookingId,
        { reasonCode, ...(reasonDetail === undefined ? {} : { reasonDetail }) },
        scope,
      ),
    onSuccess(_result, variables) {
      idempotency.release(variables.scope);
      // The refund and the final state are the server's. Refetch everything a cancel touches.
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
    },
  });
}

export function useRescheduleBooking() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const bookings = createBookingApi(api);

  return useMutation<unknown, Error, { bookingId: string; scheduledStart: string; scope: string }>({
    mutationFn: ({ bookingId, scheduledStart, scope }) =>
      bookings.reschedule(bookingId, scheduledStart, scope),
    onSuccess(_result, variables) {
      idempotency.release(variables.scope);
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
    },
  });
}

/**
 * Extend a live booking, and PAY for it.
 *
 * ## Why this is one mutation and not three
 *
 * The same reason `usePayForBooking` is: the steps are not independently meaningful. An
 * extension without a checkout is capacity reserved in `payment_pending` that nobody ever pays
 * for, and a checkout without a verify is a payment the backend has not accepted. Modelling them
 * as one operation makes "we always try to verify what we opened" structural rather than a rule
 * someone has to remember. The previous version stopped after the first step, which is exactly
 * the dangling state that shape prevents.
 *
 * ## The amount is the server's, always
 *
 * `totalAmountPaise` comes back on the quote and is what checkout opens against. Nothing here
 * multiplies a per-minute rate or adds tax: an unpriced length fails closed on the server rather
 * than being priced by inference, and the 10 PM cutoff and feasibility are decided there too.
 *
 * ## What it does NOT do
 *
 * It does not add minutes to a clock. `onSettled` re-reads the booking and its tracking, and the
 * In-service view re-renders from the server's answer — including when verification FAILED, both
 * because a failed verify can still have moved the booking (the Razorpay webhook arrives
 * independently) and because a customer who closed checkout must not be left looking at a timer
 * the backend never extended.
 *
 * ## `keyId`
 *
 * Checkout needs the public Razorpay key, and the backend now publishes it on this reply exactly
 * as it does for a booking order and a tip. The refusal below is kept anyway and fails CLOSED:
 * opening Razorpay against a fabricated or app-embedded key would either be rejected downstream
 * or take a real payment against the wrong merchant, so an environment that somehow answers
 * without a key must stop here rather than improvise one. The quote is still returned to the
 * caller, so a `processing` order and a missing key stay distinguishable from a transport error.
 */
export function useCreateExtension(launcher: CheckoutLauncher = unavailableCheckoutLauncher) {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const service = createServiceApi(api);

  return useMutation<
    ExtensionQuoteDto,
    Error,
    { bookingId: string; minutes: number; scope: string; description?: string }
  >({
    async mutationFn({ bookingId, minutes, scope, description }) {
      const quote = await service.createExtension(bookingId, minutes, scope);

      // Not ready to pay for: the provider order is still being created upstream. Returned rather
      // than thrown, so the caller can retry the SAME idempotent intent instead of extending
      // twice. The scope is deliberately NOT released here.
      if (quote.providerOrderId === null) return quote;

      const keyId = quote.keyId ?? null;
      if (keyId === null) {
        throw new Error(
          'No Razorpay publishable key was returned with the extension quote, so checkout ' +
            'cannot be opened. The deployed backend is not configured with RAZORPAY_KEY_ID.',
        );
      }

      const result = await launcher.open({
        keyId,
        providerOrderId: quote.providerOrderId,
        amountPaise: quote.totalAmountPaise,
        currency: quote.currency,
        description: description ?? `Extend booking by ${minutes} minutes`,
      });

      // The backend checks the signature. Until this resolves, nothing is paid and the extension
      // stays `payment_pending`.
      await service.verifyExtensionPayment(bookingId, quote.extensionId, result);
      idempotency.release(scope);

      return quote;
    },
    onSettled(_data, _error, variables) {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.bookingId) });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.tracking(variables.bookingId) });
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.extensionOptions(variables.bookingId),
      });
    },
  });
}

export function useRateBooking() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const service = createServiceApi(api);

  return useMutation<
    RatingResultDto,
    Error,
    { bookingId: string; stars: number; exceptional?: boolean; feedback?: string; scope: string }
  >({
    mutationFn: ({ bookingId, stars, exceptional, feedback, scope }) =>
      service.rate(
        bookingId,
        {
          stars,
          ...(exceptional === undefined ? {} : { exceptional }),
          ...(feedback === undefined ? {} : { feedback }),
        },
        scope,
      ),
    onSuccess(_result, variables) {
      idempotency.release(variables.scope);
      // A rating changes the booking's own state (`allowedActions.canRate` flips) and Home
      // selects its banner from the ACTIVE LIST, so both are re-read rather than patched here.
      void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.bookingId) });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
    },
  });
}

/**
 * Tip the cook, and actually take the payment.
 *
 * Same three-steps-as-one shape as `usePayForBooking` and for the same reason: the tip order the
 * backend creates is a real Razorpay order, and one that is never opened or never verified is a
 * tip the cook does not receive. This used to stop after `POST /tips` and discard the reply,
 * which looked like success and moved no money.
 *
 * The amount, the order and the key are ALL the server's. `catalogue.tips.suggestedAmountsPaise`
 * decides only what the sheet offers; the order is created backend-side from the amount sent, and
 * verification re-reads the provider's amount and refuses a mismatch. Nothing here computes a
 * total.
 *
 * `status: 'processing'` (the 202) or a null `providerOrderId` means the upstream order is not
 * ready. Checkout cannot open against an order id that does not exist, so the quote is returned
 * unopened and the caller retries the same idempotent intent — the scope is not released.
 *
 * Success is never announced from here. `onSettled` re-reads the booking, whose `tip` field is
 * the authority on what was actually captured, and the completed screen renders from that.
 */
export function useTipCook(launcher: CheckoutLauncher = unavailableCheckoutLauncher) {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const service = createServiceApi(api);

  return useMutation<
    TipOrderDto,
    Error,
    { bookingId: string; amountPaise: number; scope: string; description?: string }
  >({
    async mutationFn({ bookingId, amountPaise, scope, description }) {
      const order = await service.tip(bookingId, amountPaise, scope);

      if (order.status === 'processing' || order.providerOrderId === null) return order;
      if (order.keyId === null) {
        throw new Error('No Razorpay publishable key is configured for this environment.');
      }

      const result = await launcher.open({
        keyId: order.keyId,
        providerOrderId: order.providerOrderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        description: description ?? 'Tip for your cook',
      });

      await service.verifyTip(bookingId, result, `booking.tip.verify:${bookingId}`);
      idempotency.release(scope);

      return order;
    },
    onSettled(_data, _error, variables) {
      // Refetched regardless of outcome: the webhook can finalize a tip the client never got to
      // verify, so the server's view is re-read either way rather than inferred from the error.
      void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.bookingId) });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
    },
  });
}
