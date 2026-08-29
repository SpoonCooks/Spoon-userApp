import { useCallback, useMemo, useState } from 'react';

import { formatPaise } from '@core/format';
import { useApiQuery, ready } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';
import { useAddresses } from '@features/address';
import { useInstantAvailability } from '@features/availability';
import { useCatalogue } from '@features/catalogue';
import {
  CheckoutCancelledError,
  razorpayCheckoutLauncher,
  usePayForBooking,
} from '@features/payment';

import {
  bookingDetailFrom,
  extensionIdFor,
  extensionMinutesFrom,
  isLateVerdict,
  tipSheetFrom,
  trackingDetailFrom,
} from './adapters';
import {
  bookingKeys,
  createBookingApi,
  useBookingDetail,
  useBookingRefunds,
  useCreateBooking,
  useCreateExtension,
  useExtensionOptions,
  useQuote,
  useTipCook,
  useTracking,
} from './api';
import type { BookingCreateResponse, QuoteResponse } from './api';
import { viewForBooking } from './state/bookingStatusView';
import type { BookingView } from './state/bookingStatusView';
import {
  DEMO_BOOKING_ARRIVED,
  DEMO_BOOKING_AUTO_CANCELLED,
  DEMO_BOOKING_COMPLETION,
  DEMO_BOOKING_CONFIRMATION,
  DEMO_BOOKING_CONFIRM_REASSIGN,
  DEMO_BOOKING_FEEDBACK_SUBMITTED,
  DEMO_BOOKING_EN_ROUTE,
  DEMO_BOOKING_EN_ROUTE_LATE,
  DEMO_BOOKING_REASSIGNED,
  DEMO_BOOKING_REASSIGNED_LATE,
  DEMO_EXTENSION,
  DEMO_INSTANT_AVAILABLE,
  DEMO_INSTANT_NO_SLOTS,
  DEMO_INSTANT_OUT_OF_SHIFT,
  demoCookingExtendedBooking,
  demoInServiceBooking,
} from '@/demo/fixtures/booking';
import type { BookingDetailViewModel, ExtensionViewModel, InstantViewModel } from './types';

/**
 * Booking data.
 *
 * ## The dev-id seam
 *
 * `DEMO_VIEWS` is keyed by the DEV route names (`enRoute`, `arrived`, …) that the review menu
 * navigates to. A real booking id is a UUID and can never collide with one, so the two paths are
 * disjoint by construction — and the whole fixture branch is behind `__DEV__`, so a release build
 * only ever has the API path.
 *
 * The fixtures are deliberately kept (§27): several lifecycle states are hard to reach on a real
 * backend — a cook must physically arrive, a service must run long — and they remain the fastest
 * way to review those designed screens. What they no longer do is stand in the way of real data.
 *
 * ## Not everything is wired, and the gaps are real
 *
 * `bookingDetailFrom` fills the status, the address, the price, the schedule rows and
 * `allowedActions` from the payload. The live half — the ETA and the SERVICE OTP the customer
 * reads out — is not on that payload; it comes from `GET /v1/bookings/:id/tracking` and is
 * layered on by `trackingDetailFrom`. Tracking is only polled in the states where the server has
 * anything to say, so a confirmed-but-not-yet-assigned booking makes no tracking request.
 */

/**
 * The designed COPY for each lifecycle view — not a data source.
 *
 * ## The defect this replaces
 *
 * This table used to be keyed by VIEW names (`confirmation`, `enRoute`, `arrived`, `completion`)
 * and indexed by BACKEND STATUSES (`created`, `assigned`, `cook_en_route`, `cook_arrived`,
 * `cooking`, `completed`, `cancelled`). Only `cancelled` collided, by accident. Every other real
 * booking missed and fell back to the confirmation copy, so:
 *
 *   `cook_en_route`  drew Confirmation instead of En route — no ETA, no tracking body
 *   `cook_arrived`   drew Confirmation instead of Arrived  — no Start OTP, no Start Service
 *   `cooking`        was explicitly rewritten to `enRoute`  — no timer, no End OTP, no Extend
 *   `completed`      drew Confirmation instead of Completion — no rating, no tip
 *
 * and because the confirmation copy carries none of `tracking` / `arrived` / `inService` /
 * `completion`, the host's `switch` then hit its `undefined` guard and rendered the generic
 * "This booking is being updated" fallback. Every live booking landed there.
 *
 * ## What it is keyed by now
 *
 * The RESOLVED VIEW, from `viewForBooking` — the same pure function `bookingDetailFrom` calls with
 * the same inputs, so the copy and the view can never disagree. The two payload facts that a
 * status alone cannot express are inputs to it: `reassignment.occurred` (8a → 8b) and the SERVER's
 * `timingVerdict` (9a → 9b, 10a → 10b), which selects between the two drawn punctuality variants
 * rather than the client comparing an ETA against its own clock.
 *
 * ## Why fixtures supply copy at all
 *
 * Banner titles, note text, CTA labels and section headings have no endpoint and are not domain
 * state. They were transcribed from the audited frames and live in `demo/fixtures` because that is
 * where the transcription is auditable against Figma. What the fixtures must NOT supply is
 * business truth, and `bookingDetailFrom` overwrites every such field — cook name, timer target,
 * arrival time, OTP digits, refund amount, schedule line — from the DTO before anything renders.
 */
function lifecycleCopyFor(input: {
  readonly view: BookingView;
  readonly reassigned: boolean;
  readonly late: boolean;
  readonly startedAtMs: number;
}): BookingDetailViewModel {
  switch (input.view) {
    // 8a, and 8b (`289:6607`) once the server reports the assignment changed.
    case 'confirmation':
      return input.reassigned ? DEMO_BOOKING_CONFIRM_REASSIGN : DEMO_BOOKING_CONFIRMATION;

    // 9a `3:1381` / 9b `99:1413`. The variant is the backend's `timingVerdict`, never a clock.
    case 'enRoute':
      return input.late ? DEMO_BOOKING_EN_ROUTE_LATE : DEMO_BOOKING_EN_ROUTE;

    // 10a `201:100` / 10b `209:747`.
    case 'reassigned':
      return input.late ? DEMO_BOOKING_REASSIGNED_LATE : DEMO_BOOKING_REASSIGNED;

    // 11 `3:1658`.
    case 'arrived':
      return DEMO_BOOKING_ARRIVED;

    /**
     * 12a `101:1812`. The factory's `nowMs` only seeds the sample end time, which
     * `bookingDetailFrom` immediately replaces with `timing.expectedEnd`; it is passed a stable
     * value so the object identity does not churn on every render.
     *
     * 12b `292:1197` (Cooking extended) is the same screen plus `292:1399`, and its notice is a
     * SERVER report. No field on `GET /v1/bookings/:id` says "an extension took effect", so the
     * notice is not synthesised here — recorded as a backend gap rather than guessed at from a
     * moved `expectedEnd`, which would also fire for a late start.
     */
    case 'inService':
      return demoInServiceBooking(input.startedAtMs);

    // 14a `299:1424`, and 14b `319:3191` — which `bookingDetailFrom` selects from
    // `allowedActions.canRate` rather than from a second copy object.
    case 'completion':
      return DEMO_BOOKING_COMPLETION;

    // 8e `201:278`.
    case 'autoCancelled':
      return DEMO_BOOKING_AUTO_CANCELLED;

    /**
     * A CUSTOMER cancellation and an unrecognised status.
     *
     * `201:278` is the apology Spoon owes for cancelling, and showing it for a cancellation the
     * customer chose would apologise for their own decision — the same reasoning `homeBannerView`
     * applies when it draws no banner for one. No other cancelled surface is designed, so the host
     * renders its safe fallback; only the shared header copy is taken from here.
     *
     * Recorded as a UI gap in `docs/USER_APP_BACKEND_CONNECTIVITY_CLOSURE.md`, not papered over.
     */
    case 'cancelled':
    case 'unknown':
      return DEMO_BOOKING_CONFIRMATION;
  }
}

/** Development-only variants, so every lifecycle surface is reachable for visual review. */
const DEMO_VIEWS: Readonly<Record<string, BookingDetailViewModel>> = {
  confirmation: DEMO_BOOKING_CONFIRMATION,
  confirmReassign: DEMO_BOOKING_CONFIRM_REASSIGN,
  enRoute: DEMO_BOOKING_EN_ROUTE,
  enRouteLate: DEMO_BOOKING_EN_ROUTE_LATE,
  arrived: DEMO_BOOKING_ARRIVED,
  completion: DEMO_BOOKING_COMPLETION,
  feedbackSubmitted: DEMO_BOOKING_FEEDBACK_SUBMITTED,
  // Server-reported states. Nothing in this app can navigate INTO them on its own.
  reassigned: DEMO_BOOKING_REASSIGNED,
  reassignedLate: DEMO_BOOKING_REASSIGNED_LATE,
  autoCancelled: DEMO_BOOKING_AUTO_CANCELLED,
};

function isDevBookingId(bookingId: string): boolean {
  return (
    __DEV__ &&
    (bookingId in DEMO_VIEWS || bookingId === 'inService' || bookingId === 'cookingExtended')
  );
}

/**
 * The two checkout-backed service actions, with the REAL launcher bound.
 *
 * They exist for the same reason `useBookingSubmission` binds it rather than the route: which
 * payment SDK is installed is a property of this build, not of a screen, and
 * `unavailableCheckoutLauncher` stays the fail-closed default so a host without the native
 * module refuses instead of pretending. The mutations themselves take a launcher so they remain
 * testable without one.
 *
 * Nothing else changes for the caller: same variables, same `isPending`, same errors.
 */
export function useTipCheckout() {
  return useTipCook(razorpayCheckoutLauncher);
}

export function useExtensionCheckout() {
  return useCreateExtension(razorpayCheckoutLauncher);
}

/**
 * The default address.
 *
 * Availability, pricing and serviceability are all properties of a SPECIFIC address, so every
 * booking read below needs one. The customer's default is used until a screen owns an address
 * picker; before any address exists this is `null` and the dependent reads stay disabled rather
 * than asking about nowhere.
 */
function useDefaultAddressId(): string | null {
  const addresses = useAddresses();

  return useMemo(() => {
    if (addresses.state.status !== 'ready') return null;
    const list = addresses.state.data;
    return (list.find((address) => address.isDefault) ?? list[0])?.id ?? null;
  }, [addresses.state]);
}

/**
 * `1:728` / `275:4938` — how a duration is WRITTEN on a tile.
 *
 * The frames draw "30 min", "45 min", "1 hr", "1.5 hr", "2 hr", "2.5 hrs": anything of an hour or
 * more is written in HOURS, including the half-hours, and only the sub-hour durations stay in
 * minutes. The previous rule converted only exact multiples of 60, so the server's 90 and 150
 * minute options were drawn "90 min" and "150 min" against the file's "1.5 hr" and "2.5 hrs".
 *
 * Presentation only — the duration itself, and which are offered, remain the catalogue's.
 */
export function durationLabelFor(durationMinutes: number): string {
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const hours = durationMinutes / 60;
  // The frame writes the plural only past two hours ("2 hr", then "2.5 hrs"), which is the file's
  // own inconsistency and is reproduced rather than tidied.
  const unit = hours > 2 ? 'hrs' : 'hr';
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${unit}`;
}

/**
 * The struck "was" price on the duration tiles (pricing sheet, 2026-08-27).
 *
 * The backend publishes ONLY the amount actually charged (`serviceAmountPaise`); the struck
 * figure is the sheet's Base column — a flat ₹5/min anchor — COMPUTED from that rate and the
 * server's own price, never transcribed per tile. A price change therefore moves the strike with
 * it, and the strike disappears for any duration the anchor no longer undercuts (a real price at
 * or above ₹5/min draws a plain tile, not a ₹0-off promo).
 */
const ANCHOR_RATE_PAISE_PER_MINUTE = 500;

export function durationMerchandisingFor(duration: {
  readonly durationMinutes: number;
  readonly serviceAmountPaise: number;
}): { readonly strikePrice?: string } {
  const anchorPaise = duration.durationMinutes * ANCHOR_RATE_PAISE_PER_MINUTE;

  if (anchorPaise <= duration.serviceAmountPaise || duration.serviceAmountPaise === 0) {
    return {};
  }

  return { strikePrice: formatPaise(anchorPaise) };
}

/** `dur-90` <-> 90. The id is the client's own handle for a server duration, not a server id. */
const DURATION_ID_PREFIX = 'dur-';

export function durationIdFor(durationMinutes: number): string {
  return `${DURATION_ID_PREFIX}${durationMinutes}`;
}

function durationMinutesFrom(durationId: string | null): number | null {
  if (durationId === null || !durationId.startsWith(DURATION_ID_PREFIX)) return null;
  const minutes = Number.parseInt(durationId.slice(DURATION_ID_PREFIX.length), 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

/**
 * Instant unavailability reasons -> the two DESIGNED blocked states.
 *
 * The vocabulary is open (see the availability schema), so this maps the reason that has its own
 * artwork and lets everything else fall to the general "no instant slots" state — which is true
 * whatever the reason was. The client does not interpret a reason beyond choosing which designed
 * frame answers it, and never decides availability itself.
 */
function blockedIconFor(reason: string | undefined): 'moon' | 'calendar' {
  return reason === 'OUTSIDE_OPERATING_WINDOW' ? 'moon' : 'calendar';
}

/**
 * The Instant sheet.
 *
 *  - `GET /v1/catalogue` -> the durations, their prices and the arrival promise
 *  - `GET /v1/availability/instant` -> whether a cook can actually come now, and why not
 *  - `POST /v1/bookings/quote` -> the CTA amount, once a duration is chosen
 *
 * The CTA carries a TOTAL, and the only total is the quote's: the catalogue publishes a service
 * amount, and the quote is what adds the tax the server actually charges. Until a duration is
 * selected there is no quote, and the designed label stands.
 *
 * Availability is asked about the customer's default address and the selected duration. With no
 * address or no selection there is nothing to ask, and the sheet renders the catalogue's grid
 * without claiming that a cook is available.
 */
export function useInstantData(
  selection: { durationId?: string | null } = {},
): ScreenQuery<InstantViewModel> {
  const catalogue = useCatalogue();
  const addressId = useDefaultAddressId();
  const durationMinutes = durationMinutesFrom(selection.durationId ?? null);

  const availability = useInstantAvailability({ addressId, durationMinutes });
  const quote = useQuote({ addressId, slotType: 'instant', durationMinutes });

  const state = useMemo(() => {
    /**
     * Before the catalogue answers, the sheet draws its designed chrome and NO PRICES.
     *
     * It used to return `DEMO_INSTANT_AVAILABLE` whole, which is six duration tiles carrying the
     * frame's transcribed ₹69 / ₹99 / ₹129 / ₹189 / ₹259 / ₹319 — and a struck-through "was"
     * price beside each one. Both are inventions: the amounts are a snapshot of a pricing policy
     * that moves without a release, and DEC-071 is explicit that V0 has no promo engine and no
     * backend `strikePrice` authority at all, so the struck-through figures correspond to no
     * money anyone was ever charged. A customer on a slow connection saw all twelve numbers as
     * though they were real, and one of them could differ from what the quote then charged.
     *
     * Withholding them costs a moment of an empty grid on a cold start and nothing else: the
     * server's own prices arrive immediately after, and the CTA was already unpriced until a
     * quote existed.
     */
    if (catalogue.state.status !== 'ready') {
      return ready<InstantViewModel>({ ...DEMO_INSTANT_AVAILABLE, durations: [], etaLabel: '' });
    }

    const data = catalogue.state.data;
    const live = availability.state.status === 'ready' ? availability.state.data : null;
    const priced = quote.state.status === 'ready' ? quote.state.data : null;

    const base: InstantViewModel = {
      ...DEMO_INSTANT_AVAILABLE,
      // The arrival PROMISE, not an ETA. `25:1751` draws it as "Arriving in 18 mins". Once
      // availability answers, its own target supersedes the catalogue's.
      etaLabel: `${live?.arrivalTargetMinutes ?? data.instant.arrivalPromiseMinutes} mins`,
      durations: data.durations.map((duration) => ({
        id: durationIdFor(duration.durationMinutes),
        label: durationLabelFor(duration.durationMinutes),
        price: formatPaise(duration.serviceAmountPaise),
        ...durationMerchandisingFor(duration),
      })),
      // `Book NOW • ₹198` — the amount is the quote's total, tax included, never assembled here.
      ...(priced === null
        ? {}
        : { ctaLabel: `Book NOW • ${formatPaise(priced.quote.totalAmountPaise)}` }),
    };

    // `available: false` is the SERVER refusing, and it is the only thing that blocks the sheet.
    if (live === null || live.available) return ready(base);

    const icon = blockedIconFor(live.reason);
    const blocked =
      icon === 'moon' ? DEMO_INSTANT_OUT_OF_SHIFT.unavailable : DEMO_INSTANT_NO_SLOTS.unavailable;
    if (blocked === undefined) return ready(base);

    return ready<InstantViewModel>({ ...base, unavailable: { ...blocked, icon } });
  }, [catalogue.state, availability.state, quote.state]);

  return {
    state,
    refetch: () => {
      catalogue.refetch();
      availability.refetch();
      quote.refetch();
    },
  };
}

/** A complete booking selection — everything `POST /v1/bookings` needs, and nothing more. */
export interface BookingSelection {
  readonly slotType: 'instant' | 'scheduled';
  readonly durationId: string | null;
  /** A start the SERVER returned in the availability grid. Never a client-generated instant. */
  readonly scheduledStart?: string | null;
}

/**
 * How the payment attempt ENDED — never what the booking now is.
 *
 * Deliberately not a boolean and deliberately not "paid". Razorpay's callback is a message from
 * an SDK on the customer's device, and the webhook reaches the backend independently of it, so
 * the only authority on whether a booking is paid is the booking itself. This value exists to
 * decide what the SCREEN does next (stay put, or move on and let the server say), and nothing
 * downstream is allowed to treat `verified` as proof.
 */
export type PaymentOutcome =
  /** The backend accepted the signature. The booking is still re-read to learn what that did. */
  | 'verified'
  /** The customer dismissed checkout. An ordinary choice, not an error to report at them. */
  | 'cancelled'
  /** Checkout or verification failed. The booking stays on hold until it expires. */
  | 'failed'
  /** The order is not ready upstream yet; checkout never opened. Retry is safe and idempotent. */
  | 'processing';

export interface BookingSubmissionResult {
  readonly booking: BookingCreateResponse;
  readonly payment: PaymentOutcome;
}

export interface BookingSubmission {
  /** The live quote for the current selection: the CTA amount and its expiry. */
  readonly quote: ScreenQuery<QuoteResponse>;
  /** False while the selection is incomplete — the CTA has nothing to submit. */
  readonly canSubmit: boolean;
  readonly submitting: boolean;
  /**
   * Creates the booking, then opens checkout for it.
   *
   * Resolves with the created booking and how the payment attempt ended. It rejects only if the
   * BOOKING could not be created — a payment that failed or was cancelled still resolves,
   * because the booking exists (on hold) and the customer must be shown its real state rather
   * than being left on a sheet that implies nothing happened.
   */
  readonly submit: () => Promise<BookingSubmissionResult>;
}

/**
 * Quote -> create, for both booking modes.
 *
 * ## What this does not do
 *
 * It does not price anything, does not decide whether a slot is bookable, and does not confirm a
 * booking. `POST /v1/bookings` returns a booking on HOLD (`holdExpiresAt`); that hold becomes a
 * confirmed booking only when payment is verified SERVER-side. Nothing here treats a created
 * booking as paid.
 *
 * ## Idempotency
 *
 * The key is scoped to the SELECTION, so a retry after a timeout replays the same intent instead
 * of creating a second booking, while a genuinely different selection is a different intent.
 * `@core/api`'s `idempotency` owns the lifetime; `useCreateBooking` releases the scope on success.
 */
export function useBookingSubmission(selection: BookingSelection): BookingSubmission {
  const addressId = useDefaultAddressId();
  const durationMinutes = durationMinutesFrom(selection.durationId);
  const scheduledStart = selection.scheduledStart ?? null;

  const quote = useQuote({
    addressId,
    slotType: selection.slotType,
    durationMinutes,
    scheduledStart,
  });
  const create = useCreateBooking();
  // The REAL launcher. `unavailableCheckoutLauncher` (the fail-closed default) stays the export
  // for hosts with no native module, but the app itself now has one.
  const pay = usePayForBooking(razorpayCheckoutLauncher);

  const canSubmit =
    addressId !== null &&
    durationMinutes !== null &&
    (selection.slotType === 'instant' || scheduledStart !== null);

  const submit = useCallback(async (): Promise<BookingSubmissionResult> => {
    if (addressId === null || durationMinutes === null) {
      throw new Error('Booking submitted without a complete selection');
    }

    const booking = await create.mutateAsync({
      input: {
        addressId,
        slotType: selection.slotType,
        durationMinutes,
        ...(scheduledStart === null ? {} : { scheduledStart }),
      },
      scope: [
        'booking.create',
        addressId,
        selection.slotType,
        String(durationMinutes),
        scheduledStart ?? 'now',
      ].join(':'),
    });

    // The booking now exists on HOLD. Payment is a SEPARATE operation against it, which is why
    // a failure below does not unmake the booking and is not thrown: the hold is real, the
    // server will expire it if nothing pays, and the customer is entitled to see that state.
    try {
      const order = await pay.mutateAsync({
        bookingId: booking.booking.id,
        description: 'Spoon cooking service',
      });

      // `usePayForBooking` returns the order without opening checkout when the upstream order is
      // not ready. Nothing was charged and the same idempotency key retries the SAME order.
      if (order.status === 'processing' || order.providerOrderId === null) {
        return { booking, payment: 'processing' };
      }
      return { booking, payment: 'verified' };
    } catch (error) {
      // Dismissing checkout is a choice, not a fault. It is separated here only so the caller
      // can avoid showing an error for something the customer did on purpose.
      return {
        booking,
        payment: error instanceof CheckoutCancelledError ? 'cancelled' : 'failed',
      };
    }
  }, [create, pay, addressId, durationMinutes, scheduledStart, selection.slotType]);

  return { quote, canSubmit, submitting: create.isPending || pay.isPending, submit };
}

/**
 * The extension sheet — `3:2002` / `275:4189`.
 *
 * ## Two sources, in priority order, and neither is the frame
 *
 * `GET /v1/bookings/:id/extension-options` is the authority when a booking is live: it prices
 * THIS service's extensions, carries the tax and the total the customer will actually be charged,
 * and states each option's `newExpectedEnd`. `GET /v1/catalogue` publishes the same SKUs without
 * a booking to price them against, and is the fallback for the moment before the per-booking read
 * lands (and for the review route, which has no booking at all).
 *
 * An empty option list is the server saying no extension is offered — the sheet then draws its
 * designed `275:4283` fallback block and the CTA is inert, rather than offering minutes nobody
 * will sell.
 *
 * ## The CTA amount
 *
 * `275:4265` draws "Extend • ₹16" — the pill CARRIES the price, so the price is business truth on
 * a control that takes money. It is composed from the selected option's `totalAmountPaise`, which
 * is the tax-inclusive figure the checkout order is created for, and never from the frame's
 * transcribed ₹16 or from base + a rate applied here.
 *
 * Before either source answers the label falls back to the drawn UNPRICED wording — the CTA says
 * what it can honestly say, exactly as the Instant sheet's "Book NOW" does before a quote exists.
 *
 * The option TILES keep drawing `pricePaise`, the pre-tax SKU amount, because that is what
 * `143:372`'s compact tiles draw; the tax is disclosed by `275:4272`'s explainer and charged on
 * the total the CTA names.
 */
export function useExtensionData(
  selection: { bookingId?: string | null; optionId?: string | null } = {},
): ScreenQuery<ExtensionViewModel> {
  const catalogue = useCatalogue();
  const bookingOptions = useExtensionOptions(selection.bookingId ?? null);
  const optionId = selection.optionId ?? null;

  const state = useMemo(() => {
    const live = bookingOptions.state.status === 'ready' ? bookingOptions.state.data : null;
    const published =
      catalogue.state.status === 'ready' ? (catalogue.state.data.extension?.options ?? null) : null;

    // Neither source has answered. The sheet keeps its designed copy, and every price on it is
    // withheld rather than transcribed — `options: []` draws the fallback block, not a price list.
    if (live === null && published === null) {
      return ready<ExtensionViewModel>(unofferedExtension());
    }

    /**
     * The per-booking read wins wherever it exists.
     *
     * Both sources publish `pricePaise` (the tile amount) and `totalAmountPaise` (the tax-inclusive
     * CTA amount), so either can price the sheet honestly. The per-booking read is preferred
     * because it prices THIS service — it also states each option's `newExpectedEnd` and omits any
     * option the assigned cook's schedule cannot absorb, neither of which a catalogue can know.
     */
    const options = (live ?? published ?? []).map((option) => ({
      minutes: option.minutes,
      pricePaise: option.pricePaise,
      totalAmountPaise: option.totalAmountPaise,
    }));

    if (options.length === 0) {
      return ready<ExtensionViewModel>(unofferedExtension());
    }

    /**
     * `143:381` draws "10 mins" selected. The DRAWN default is matched against what the server
     * actually offers rather than assumed: if operations stops selling 10 minutes the sheet opens
     * on the first option the server does offer, which is the designed "something is selected"
     * state without preselecting a length nobody published.
     */
    const drawnDefault = extensionMinutesFrom(DEMO_EXTENSION.defaultOptionId ?? null);
    const defaultOption =
      options.find((option) => option.minutes === drawnDefault) ?? options[0] ?? null;

    const chosenMinutes = extensionMinutesFrom(optionId) ?? defaultOption?.minutes ?? null;
    const chosen = options.find((option) => option.minutes === chosenMinutes) ?? defaultOption;

    const base: ExtensionViewModel = {
      ...DEMO_EXTENSION,
      options: options.map((option) => ({
        id: extensionIdFor(option.minutes),
        label: `${option.minutes} mins`,
        price: formatPaise(option.pricePaise),
      })),
      ...(defaultOption === null ? {} : { defaultOptionId: extensionIdFor(defaultOption.minutes) }),
    };

    // `275:4265` — the amount is the server's tax-inclusive total for the option in play.
    return ready<ExtensionViewModel>(
      chosen === null || chosen === undefined
        ? withoutCtaPrice(base)
        : { ...base, ctaLabel: `Extend • ${formatPaise(chosen.totalAmountPaise)}` },
    );
  }, [catalogue.state, bookingOptions.state, optionId]);

  return {
    state,
    refetch: () => {
      catalogue.refetch();
      bookingOptions.refetch();
    },
  };
}

/**
 * The sheet with NOTHING offered — no options, no preselection, no price on the bar.
 *
 * The drawn `275:4283` fallback block ("Not able to extend at the moment?") is what this state
 * renders, which is the design's own answer to it.
 *
 * `defaultOptionId` has to go with the options. `143:381` preselects "10 mins" because the frame
 * had ten minutes to sell; carrying that id over an EMPTY option list left the CTA live and
 * pre-selected against a length the server had not offered — one tap from `POST /extensions` with
 * minutes nobody quoted. The sheet gates its CTA on `selectedOptionId`, so dropping the default is
 * what makes "no options" mean "nothing to buy".
 */
function unofferedExtension(): ExtensionViewModel {
  const { defaultOptionId: _dropped, ...rest } = DEMO_EXTENSION;
  return withoutCtaPrice({ ...rest, options: [] });
}

/**
 * The drawn CTA wording with the transcribed amount removed.
 *
 * `275:4265` reads "Extend • ₹16" because the frame had a priced option selected. The words are
 * the design's; the figure is the server's, and where there is no server figure the button says
 * "Extend" rather than a price nobody quoted — the same rule the Instant sheet's "Book NOW"
 * already follows.
 */
function withoutCtaPrice(model: ExtensionViewModel): ExtensionViewModel {
  return { ...model, ctaLabel: model.ctaLabel.split('•')[0]?.trim() ?? model.ctaLabel };
}

export function useBookingDetailData(bookingId: string): ScreenQuery<BookingDetailViewModel> {
  // Captured once so the DEV sample's seeded end time does not move on every render.
  const [startedAtMs] = useState(() => Date.now());
  const { logger } = useRuntime();
  const isDev = isDevBookingId(bookingId);
  // `306:2997` — the tip amounts are the catalogue's, never the frame's transcription (§16).
  const catalogue = useCatalogue();

  /**
   * Polled, so the screen follows the booking without being reopened.
   *
   * A cook departing, arriving, starting and finishing are all SERVER transitions the customer is
   * sitting in front of. The detail read owns the status, so polling it is what moves 8a → 9a →
   * 11 → 12a → 14a in place. Tracking polls separately at the cadence the server publishes.
   */
  const remote = useBookingDetail(isDev ? null : bookingId, { poll: true });

  /**
   * Tracking is a LIVE read and is asked for only in the states where the server produces one:
   * a cook is travelling, has arrived, or is cooking. Outside those, the endpoint 404s, and
   * polling it would turn an expected absence into a screenful of errors.
   */
  const trackedStatus = remote.state.status === 'ready' ? remote.state.data.status : null;
  const trackable =
    trackedStatus === 'cook_en_route' ||
    trackedStatus === 'cook_arrived' ||
    trackedStatus === 'cooking';
  const tracking = useTracking(isDev || !trackable ? null : bookingId);

  /**
   * The refund behind `201:278`.
   *
   * Fetched ONLY for a Spoon-side cancellation, which is the one surface that names an amount.
   * Every other lifecycle state passes `null` and makes no request.
   */
  const autoCancelled =
    remote.state.status === 'ready' &&
    remote.state.data.status === 'cancelled' &&
    remote.state.data.cancellation?.cancelledBy === 'system';
  const refunds = useBookingRefunds(isDev || !autoCancelled ? null : bookingId);

  const devSample = useMemo(() => {
    if (!isDev) return null;
    return (
      DEMO_VIEWS[bookingId] ??
      (bookingId === 'inService'
        ? demoInServiceBooking(startedAtMs)
        : bookingId === 'cookingExtended'
          ? demoCookingExtendedBooking(startedAtMs)
          : DEMO_BOOKING_EN_ROUTE)
    );
  }, [isDev, bookingId, startedAtMs]);

  const state = useMemo(() => {
    if (devSample !== null) return ready(devSample);
    if (remote.state.status !== 'ready') return remote.state;

    const dto = remote.state.data;
    const tracked = tracking.state.status === 'ready' ? tracking.state.data : null;

    /**
     * The designed screen for the state the SERVER reported.
     *
     * `viewForBooking` is called with exactly the inputs `bookingDetailFrom` will call it with, so
     * the copy chosen here and the `view` the host switches on are the same answer. Resolving it
     * twice is cheap and pure; passing a pre-resolved view into the adapter would let a caller
     * hand it a view its own DTO does not support.
     */
    const resolution = viewForBooking({
      status: dto.status,
      cancelledBy: dto.cancellation?.cancelledBy ?? null,
      reassigned: dto.reassignment?.occurred === true,
    });

    const base = lifecycleCopyFor({
      view: resolution.view,
      reassigned: dto.reassignment?.occurred === true,
      // The SERVER's punctuality verdict picks 9b over 9a. Absent tracking means no verdict yet,
      // which is not "late" — the on-time frame stands until the backend says otherwise.
      late: isLateVerdict(tracked?.timingVerdict),
      startedAtMs,
    });

    const detail = bookingDetailFrom({
      base,
      dto,
      refunds: refunds.state.status === 'ready' ? refunds.state.data : null,
      onUnknownStatus: (status) =>
        logger.warn('Unmapped booking status from server', { status: String(status) }),
    });

    const withTracking =
      tracked === null ? detail : trackingDetailFrom({ base: detail, dto: tracked });

    // Until the catalogue is in, the sheet keeps its designed copy rather than showing an empty
    // amount row — and it cannot be opened to a wrong figure, because the amounts only appear
    // once the server's have arrived.
    if (catalogue.state.status !== 'ready' || withTracking.tip === undefined) {
      return ready(withTracking);
    }

    return ready<BookingDetailViewModel>({
      ...withTracking,
      tip: tipSheetFrom({
        base: withTracking.tip,
        suggestedAmountsPaise: catalogue.state.data.tips.suggestedAmountsPaise,
        formatAmount: formatPaise,
      }),
    });
  }, [
    devSample,
    remote.state,
    tracking.state,
    refunds.state,
    logger,
    catalogue.state,
    startedAtMs,
  ]);

  return {
    state,
    refetch: () => {
      remote.refetch();
      tracking.refetch();
      refunds.refetch();
      catalogue.refetch();
    },
  };
}

/** Re-exported so a host can prefetch a booking before navigating to it. */
export { bookingKeys, createBookingApi, useApiQuery };
