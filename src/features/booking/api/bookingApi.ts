import type { ApiClient, JsonValue } from '@core/api';
import { idempotencyHeader } from '@core/api';

import {
  bookingCreateResponseSchema,
  bookingDetailResponseSchema,
  bookingListResponseSchema,
  cancellationPreviewSchema,
  extensionOptionsResponseSchema,
  extensionQuoteSchema,
  quoteResponseSchema,
  ratingResultSchema,
  tipOrderSchema,
  tipStatusSchema,
  refundListResponseSchema,
  cookContactSchema,
  rescheduleOptionsSchema,
  trackingSchema,
} from './schemas';
import type {
  BookingCreateResponse,
  BookingDetailResponse,
  BookingSummaryDto,
  CancellationPreviewDto,
  QuoteResponse,
  RescheduleOptionsDto,
} from './schemas';

/**
 * Booking endpoints: quote, create, read, cancel, reschedule, refunds.
 *
 * ## Nothing here computes money
 *
 * `quote` asks the server what a booking would cost. `create` sends the same inputs and the
 * server prices it again from its own snapshot. The client never multiplies a duration by a
 * rate, never adds tax, and never compares two prices to decide which is right — if the quote
 * and the booking disagree, the booking wins, because it is the one that will be charged.
 *
 * ## Idempotency scopes
 *
 * `create`, `cancel` and `reschedule` all take a scope naming the INTENT. The booking draft, the
 * cancellation of booking X, the reschedule of booking X. A retry of the same intent must reuse
 * its key: that is what makes an ambiguous timeout safe on an endpoint that takes money.
 */

export const BOOKING_PATHS = {
  quote: '/v1/bookings/quote',
  create: '/v1/bookings',
  detail: (id: string) => `/v1/bookings/${id}`,
  list: '/v1/me/bookings',
  active: '/v1/me/bookings/active',
  myRefunds: '/v1/me/refunds',
  refunds: (id: string) => `/v1/bookings/${id}/refunds`,
  cancellationPreview: (id: string) => `/v1/bookings/${id}/cancellation-preview`,
  cancel: (id: string) => `/v1/bookings/${id}/cancel`,
  rescheduleOptions: (id: string) => `/v1/bookings/${id}/reschedule-options`,
  reschedule: (id: string) => `/v1/bookings/${id}/reschedule`,
  extensionOptions: (id: string) => `/v1/bookings/${id}/extension-options`,
  extensions: (id: string) => `/v1/bookings/${id}/extensions`,
  tracking: (id: string) => `/v1/bookings/${id}/tracking`,
  cookContact: (id: string) => `/v1/bookings/${id}/cook-contact`,
  rating: (id: string) => `/v1/bookings/${id}/rating`,
  tips: (id: string) => `/v1/bookings/${id}/tips`,
  tipsVerify: (id: string) => `/v1/bookings/${id}/tips/verify`,
  extensionVerify: (bookingId: string, extensionId: string) =>
    `/v1/bookings/${bookingId}/extensions/${extensionId}/verify-payment`,
  paymentOrder: (id: string) => `/v1/bookings/${id}/payments/order`,
  paymentVerify: (id: string) => `/v1/bookings/${id}/payments/verify`,
} as const;

export interface BookingRequestInput {
  readonly addressId: string;
  readonly slotType: 'scheduled' | 'instant';
  /** Required for `scheduled`, and must be one of the slot starts availability returned. */
  readonly scheduledStart?: string | null;
  readonly durationMinutes: number;
  readonly mealNotes?: string;
  readonly referenceUrl?: string;
}

function bookingBody(input: BookingRequestInput): JsonValue {
  return {
    addressId: input.addressId,
    slotType: input.slotType,
    durationMinutes: input.durationMinutes,
    ...(input.scheduledStart === undefined || input.scheduledStart === null
      ? {}
      : { scheduledStart: input.scheduledStart }),
    ...(input.mealNotes === undefined ? {} : { mealNotes: input.mealNotes }),
    ...(input.referenceUrl === undefined ? {} : { referenceUrl: input.referenceUrl }),
  };
}

export function createBookingApi(api: ApiClient) {
  return {
    /** `POST /v1/bookings/quote`. No idempotency key — a quote creates nothing. */
    async quote(input: BookingRequestInput, signal?: AbortSignal): Promise<QuoteResponse> {
      return api.request(BOOKING_PATHS.quote, {
        method: 'POST',
        body: bookingBody(input),
        parse: (data) => quoteResponseSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /** `POST /v1/bookings` — 201. Requires an Idempotency-Key scoped to the booking draft. */
    async create(input: BookingRequestInput, scope: string): Promise<BookingCreateResponse> {
      return api.request(BOOKING_PATHS.create, {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: bookingBody(input),
        parse: (data) => bookingCreateResponseSchema.parse(data),
      });
    },

    /**
     * `GET /v1/bookings/:id` — the full lifecycle payload, including `allowedActions`.
     *
     * Returns the envelope rather than just the booking, because `serverTime` is part of what the
     * screen needs: it is measured against the device clock to correct the in-service countdown.
     * Reading it here, at the moment the response arrives, is the only place the two clocks can
     * be compared meaningfully — a `serverTime` carried around and compared later has already
     * lost the round trip it was supposed to measure.
     */
    async detail(bookingId: string, signal?: AbortSignal): Promise<BookingDetailResponse> {
      return api.request(BOOKING_PATHS.detail(bookingId), {
        parse: (data) => bookingDetailResponseSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /** `GET /v1/me/bookings/active`. Drives Home's active-booking card. */
    async active(signal?: AbortSignal): Promise<readonly BookingSummaryDto[]> {
      return api.request(BOOKING_PATHS.active, {
        parse: (data) => bookingListResponseSchema.parse(data).bookings,
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /** `GET /v1/me/bookings`. Past bookings. */
    async history(signal?: AbortSignal): Promise<readonly BookingSummaryDto[]> {
      return api.request(BOOKING_PATHS.list, {
        parse: (data) => bookingListResponseSchema.parse(data).bookings,
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `GET /v1/me/refunds` — the CUSTOMER-level refund list.
     *
     * A dedicated endpoint exists, so the Refunds screen does not fan out over every booking.
     */
    async refunds(signal?: AbortSignal) {
      return api.request(BOOKING_PATHS.myRefunds, {
        parse: (data) => refundListResponseSchema.parse(data).refunds,
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `GET /v1/bookings/:id/refunds` — the refunds raised against ONE booking.
     *
     * The same `RefundRecord` projection `/me/refunds` publishes, from the same mapper, so the
     * two can never describe one refund differently. Read by the auto-cancelled surface, which
     * has to name the amount Spoon is returning and has no other source for it: the booking
     * detail's `cancellation` block carries who cancelled and why, and no figure at all.
     */
    async bookingRefunds(bookingId: string, signal?: AbortSignal) {
      return api.request(BOOKING_PATHS.refunds(bookingId), {
        parse: (data) => refundListResponseSchema.parse(data).refunds,
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `GET /v1/bookings/:id/cancellation-preview`.
     *
     * The band, the percentage, the fee and the refund are ALL server values. The cancellation
     * screen displays them; it does not compute a refund from a percentage, and it does not
     * decide whether cancelling is allowed — `cancellable` says.
     */
    async cancellationPreview(
      bookingId: string,
      signal?: AbortSignal,
    ): Promise<CancellationPreviewDto> {
      return api.request(BOOKING_PATHS.cancellationPreview(bookingId), {
        parse: (data) => cancellationPreviewSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `POST /v1/bookings/:id/cancel`.
     *
     * `reasonDetail` is sent whenever the customer typed one. The catalogue's `requiresDetail`
     * decides whether the field is shown and required; the backend refuses a cancellation that
     * omits a required detail, so the text is never silently discarded.
     */
    async cancel(
      bookingId: string,
      input: { reasonCode: string; reasonDetail?: string },
      scope: string,
    ) {
      return api.request(BOOKING_PATHS.cancel(bookingId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: {
          reasonCode: input.reasonCode,
          ...(input.reasonDetail === undefined || input.reasonDetail.trim().length === 0
            ? {}
            : { reasonDetail: input.reasonDetail.trim() }),
        },
        parse: (data) => data,
      });
    },

    /**
     * `GET /v1/bookings/:id/reschedule-options`.
     *
     * Customer-initiated reschedule is IMPLEMENTED on the backend as of this integration.
     * `reschedulable`, `rescheduleCount` and `maxReschedules` are the authority; the client keeps
     * no reschedule counter of its own.
     */
    async rescheduleOptions(
      bookingId: string,
      signal?: AbortSignal,
    ): Promise<RescheduleOptionsDto> {
      return api.request(BOOKING_PATHS.rescheduleOptions(bookingId), {
        parse: (data) => rescheduleOptionsSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /** `POST /v1/bookings/:id/reschedule`. Atomic on the server; idempotent by key. */
    async reschedule(bookingId: string, scheduledStart: string, scope: string) {
      return api.request(BOOKING_PATHS.reschedule(bookingId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: { scheduledStart },
        parse: (data) => data,
      });
    },
  };
}

export type BookingApi = ReturnType<typeof createBookingApi>;

/**
 * The service-flow endpoints: tracking, extension, rating and tips.
 *
 * Split from `createBookingApi` only for readability; it is the same client and the same rules.
 * Every one of these is gated by `allowedActions` on the booking detail, which the SERVER sets.
 */
export function createServiceApi(api: ApiClient) {
  return {
    /** `GET /v1/bookings/:id/tracking`. The only source of a live ETA. */
    async tracking(bookingId: string, signal?: AbortSignal) {
      return api.request(BOOKING_PATHS.tracking(bookingId), {
        parse: (data) => trackingSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `GET /v1/bookings/:id/cook-contact`. Called ON PRESS, never on render.
     *
     * The response carries a cook's personal number, so it is fetched at the moment the customer
     * chooses to call and is not cached, not stored and not logged. `allowedActions.canCallCook`
     * is what decides whether the button is offered; this read is what supplies the number, and
     * the two agree because the server answers both from the same eligibility.
     */
    async cookContact(bookingId: string, signal?: AbortSignal) {
      return api.request(BOOKING_PATHS.cookContact(bookingId), {
        parse: (data) => cookContactSchema.parse(data).cook,
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /** `GET /v1/bookings/:id/extension-options`. Absent options means no extension is offered. */
    async extensionOptions(bookingId: string, signal?: AbortSignal) {
      return api.request(BOOKING_PATHS.extensionOptions(bookingId), {
        parse: (data) => extensionOptionsResponseSchema.parse(data).options,
        ...(signal === undefined ? {} : { signal }),
      });
    },

    /**
     * `POST /v1/bookings/:id/extensions`.
     *
     * `minutes` is a closed vocabulary the server enumerates. The client sends the minutes of an
     * option the server offered — it never derives a length, and an unpriced length fails closed
     * on the server rather than being priced by inference.
     */
    async createExtension(bookingId: string, minutes: number, scope: string) {
      return api.request(BOOKING_PATHS.extensions(bookingId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: { minutes },
        parse: (data) => extensionQuoteSchema.parse(data),
      });
    },

    /**
     * `POST /v1/bookings/:id/extensions/:extensionId/verify-payment`.
     *
     * The two values come straight from Razorpay's checkout callback and are forwarded untouched
     * to the one party holding the secret that can check them. The client does not parse,
     * validate or trust them, and a 2xx here is the BACKEND's word that the extension was paid -
     * never the SDK's.
     *
     * Extension-scoped, which is why the id from the quote has to survive checkout: the booking's
     * own verify route settles the booking's entitlement, not this.
     *
     * Carries NO idempotency key, matching the route: unlike the tip verify, this operation does
     * not require one, and sending a header the contract does not describe is not the client's
     * call to make.
     */
    async verifyExtensionPayment(
      bookingId: string,
      extensionId: string,
      result: { readonly providerPaymentId: string; readonly signature: string },
    ): Promise<unknown> {
      return api.request(BOOKING_PATHS.extensionVerify(bookingId, extensionId), {
        method: 'POST',
        body: {
          providerPaymentId: result.providerPaymentId,
          signature: result.signature,
        },
        parse: (data) => data,
      });
    },

    /**
     * `PUT /v1/bookings/:id/rating`.
     *
     * `stars` is 1..5 in 0.5 increments — which is exactly the nine chips the completion frame
     * draws. The scale is the server's, enforced at the edge, in the service and by a database
     * constraint; the client sends the value the customer picked.
     *
     * `exceptional` is the `5+` chip: a separate, reachable state in the rating sheet rather than
     * a visual alias of 5, and a field of its own on the wire. Valid ONLY alongside `stars: 5` —
     * the server refuses any other combination and a database CHECK refuses it again — so the
     * caller sends the pair, never the flag alone. It moves no money: the five-plus EARNINGS
     * bonus continues to mean exactly `stars === 5`.
     *
     * Sent only when TRUE. The contract defaults it to `false`, so an ordinary rating stays
     * silent about a chip the customer did not press.
     */
    async rate(
      bookingId: string,
      input: { stars: number; exceptional?: boolean; feedback?: string },
      scope: string,
    ) {
      return api.request(BOOKING_PATHS.rating(bookingId), {
        method: 'PUT',
        headers: idempotencyHeader(scope),
        body: {
          stars: input.stars,
          ...(input.exceptional === true ? { exceptional: true } : {}),
          ...(input.feedback === undefined || input.feedback.trim().length === 0
            ? {}
            : { feedback: input.feedback.trim() }),
        },
        parse: (data) => ratingResultSchema.parse(data),
      });
    },

    /**
     * `POST /v1/bookings/:id/tips`.
     *
     * Any positive integer paise is accepted; the catalogue's `suggestedAmountsPaise` decides
     * only what the sheet OFFERS. No amount is computed here.
     */
    async tip(bookingId: string, amountPaise: number, scope: string) {
      return api.request(BOOKING_PATHS.tips(bookingId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: { amountPaise },
        parse: (data) => tipOrderSchema.parse(data),
      });
    },

    /**
     * `POST /v1/bookings/:id/tips/verify`.
     *
     * Tip-scoped, and deliberately NOT the booking verify: that route settles the booking's own
     * entitlement. The signature is checked server-side against the tip's own provider order and
     * the provider's amount is re-read there, so a mismatch is refused by the party that can
     * actually tell.
     *
     * Idempotent: a duplicate verify returns the captured tip rather than capturing twice, and
     * the Razorpay webhook reaches the same finalization — so a customer who closes the app
     * between checkout and verify still gets reconciled.
     *
     * The idempotency key is REQUIRED by this route (the OpenAPI document omits the parameter;
     * the handler refuses without it), so it is always sent.
     */
    async verifyTip(
      bookingId: string,
      result: { readonly providerPaymentId: string; readonly signature: string },
      scope: string,
    ) {
      return api.request(BOOKING_PATHS.tipsVerify(bookingId), {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: {
          providerPaymentId: result.providerPaymentId,
          signature: result.signature,
        },
        parse: (data) => tipStatusSchema.parse(data),
      });
    },
  };
}

export type ServiceApi = ReturnType<typeof createServiceApi>;
