import type { RatingSelection } from '@ui';

import type { BookingStatus } from '@features/booking';

/**
 * The Home booking banner, as a typed state machine — Figma `367:71` "Banner cards" (task §6/§7).
 *
 * ## The rule this file exists to enforce
 *
 * The banner is chosen by what the SERVER says about the booking. Not by a timer, not by
 * comparing the device clock to a scheduled start, not by remembering what the last render
 * showed. Every discriminator below is a field on a payload; where a field does not exist, the
 * state is NOT SYNTHESISED — it is declared underivable and recorded in
 * `docs/FINAL_FIGMA_BACKEND_GAPS.md`. That is the whole of §7's "do not manufacture backend
 * state in production".
 *
 * ## Eleven drawn cards, eight distinct presentations
 *
 * `367:71` draws eleven cards. Three pairs differ ONLY in which cook is pictured — `337:4307`
 * and `394:1235` are both "Arrived", `337:4330` and `394:1257` are both "Live booking",
 * `337:4495` and `394:1279` are both "Share your rating!" — so the cook is DATA, not a variant.
 * Reassignment changes the drawn TITLE in exactly two places (`394:1210` "Reassigned" where
 * `337:4261` says "Upcoming booking", `393:1050` "Reassigned" where `337:4284` says "Arriving"),
 * which is why only those two carry a distinct variant here.
 *
 * Collapsing the pairs is not a simplification of the design; drawing them as separate variants
 * would be a mis-reading of it, and would produce two code paths that must stay identical
 * forever.
 *
 * ## Destination
 *
 * Every banner leads to the SAME route — the booking lifecycle host `/booking/[id]` — because
 * every Figma page named in §7 (8a, 8b, 8c, 9a, 9b, 10a, 10b, 11, 12a, 12b, 14a) is a VIEW of
 * that one screen, selected there by server state. `figmaPage` is recorded so the mapping is
 * auditable, but the banner does NOT tell the destination which view to draw: doing so would let
 * a stale Home decide what a fresh booking read should render.
 */

/** The drawn presentations. `reassigned*` are selected from backend assignment history. */
export type HomeBannerVariant =
  | 'confirmed'
  | 'reassignedConfirmed'
  | 'cancelled'
  | 'arriving'
  | 'reassignedArriving'
  | 'arrived'
  | 'live'
  | 'rate';

/**
 * The Figma page each variant leads to, per §7. Documentation with a type — it is asserted in
 * tests so the table cannot drift from the brief silently.
 */
export const BANNER_DESTINATION_PAGE: Record<HomeBannerVariant, string> = Object.freeze({
  confirmed: '8a',
  reassignedConfirmed: '8b',
  cancelled: '8c',
  arriving: '9a/9b',
  reassignedArriving: '10a/10b',
  arrived: '11',
  live: '12a/12b',
  rate: '14a',
});

export interface HomeBannerDestination {
  /** The lifecycle host. One route, many views. */
  readonly route: '/booking/[id]';
  readonly bookingId: string;
  /** Which Figma page the server state is expected to resolve to. Audit trail, not an instruction. */
  readonly figmaPage: string;
}

export interface HomeBannerRating {
  readonly description: string;
  /**
   * A value the SERVER already holds.
   *
   * Typed as `RatingSelection` — the nine numerals OR `5+` — because `383:765` draws `5+` as a
   * finished state of this very card, so a card rendering a stored rating must be able to show
   * it. Whether the server can currently STORE it is a separate question, answered in
   * `docs/FINAL_FIGMA_BACKEND_GAPS.md`.
   */
  readonly value?: RatingSelection;
}

export interface HomeBannerViewModel {
  readonly variant: HomeBannerVariant;
  readonly bookingId: string;
  /** `337:4356` — the brand-yellow title. */
  readonly title: string;
  /** `337:4366` / `337:4367` / `337:4368`. Absent on `cancelled`, which draws no cook block. */
  readonly dateLabel?: string;
  readonly timeLabel?: string;
  readonly cookName?: string;
  readonly cookPhotoUrl?: string;
  /** `337:4412` — "Arriving in" / "Arrived at" / "Time left". Absent on the block-badge forms. */
  readonly badgeCaption?: string;
  /** `337:4370` — "Confirmed!" / "Completed!" / "12 mins" / "1:12 PM". Absent on `cancelled`. */
  readonly badgeValue?: string;
  /** `393:1202` — the apology row, the only body the cancelled card draws. */
  readonly notice?: string;
  /** `336:4235` — present only when the server says the booking may be rated. */
  readonly rating?: HomeBannerRating;
  readonly destination: HomeBannerDestination;
}

/**
 * What the banner needs to know. Every field maps to a real response field; the server remains the
 * authority for lifecycle state, reassignment, arrival time, ETA and rateability.
 */
export interface HomeBannerInput {
  readonly bookingId: string;
  readonly status: BookingStatus;
  /** `GET /v1/bookings/:id` → `cook.name` / `cook.photoUrl`. */
  readonly cookName?: string | null;
  readonly cookPhotoUrl?: string | null;
  /** Preformatted by `adapters.ts` from `scheduledStart`. Presentation of a server instant. */
  readonly dateLabel: string;
  readonly timeLabel: string;
  /** `GET /v1/bookings/:id/tracking` → `eta.estimatedArrivalAt`, already turned into minutes. */
  readonly etaMinutes?: number | null;
  /** `timing.expectedEnd` turned into minutes. The ONLY authority for "Time left". */
  readonly minutesLeft?: number | null;
  /**
   * "Arrived at 1:12 PM" (`337:4307`).
   *
   * `timing.arrivedAt`, persisted by the backend arrival transition. `actualStart` is when service
   * started and is intentionally not used for this label.
   */
  readonly arrivedAtLabel?: string | null;
  /** `allowedActions.canRate`. The server decides rateability; this never re-derives it. */
  readonly canRate?: boolean;
  /** `cancellation.cancelledBy === 'system'` distinguishes 8c from a customer cancellation. */
  readonly cancelledBy?: string | null;
  /**
   * Whether this booking's cook was reassigned.
   *
   * Derived from the backend's durable replacement-assignment history. An absent field remains
   * backward-compatible and never becomes a guessed reassignment.
   */
  readonly reassigned?: boolean;
  /** `336:4239` — server copy for the 5+ legend. */
  readonly ratingPrompt?: string;
}

/** The drawn copy. Labels on a card; no endpoint serves them and none is expected to. */
const COPY = {
  confirmed: 'Upcoming booking',
  reassigned: 'Reassigned',
  cancelled: 'Cancelled',
  arriving: 'Arriving',
  arrived: 'Arrived',
  live: 'Live booking',
  rate: 'Share your rating!',
  cancelledNotice: 'We sincerely apologize for cancelling this booking',
  captionArrivingIn: 'Arriving in',
  captionArrivedAt: 'Arrived at',
  captionTimeLeft: 'Time left',
  badgeConfirmed: 'Confirmed!',
  badgeCompleted: 'Completed!',
  /** Shown where a number is designed but the server supplied none. Never a guessed figure. */
  badgeArrived: 'Arrived',
  badgeUnknown: '—',
} as const;

function minutesBadge(minutes: number | null | undefined, fallback: string): string {
  return minutes === null || minutes === undefined ? fallback : `${minutes} mins`;
}

/**
 * Selects the banner for one active booking, or `null` when the design draws none.
 *
 * Returns `null` — rather than a card with invented copy — for a status the file has no card for.
 * Today the only such case is a booking the CUSTOMER cancelled: `393:1072` is the apology Spoon
 * owes for cancelling, and showing it for a cancellation the customer chose would apologise for
 * their own decision.
 */
export function homeBannerFor(input: HomeBannerInput): HomeBannerViewModel | null {
  const variant = variantFor(input);
  if (variant === null) return null;

  const destination: HomeBannerDestination = {
    route: '/booking/[id]',
    bookingId: input.bookingId,
    figmaPage: BANNER_DESTINATION_PAGE[variant],
  };

  if (variant === 'cancelled') {
    // `393:1072` draws NO cook block and NO badge — an apology row is its entire body.
    return {
      variant,
      bookingId: input.bookingId,
      title: COPY.cancelled,
      notice: COPY.cancelledNotice,
      destination,
    };
  }

  const identity = {
    bookingId: input.bookingId,
    dateLabel: input.dateLabel,
    timeLabel: input.timeLabel,
    cookName: input.cookName ?? '',
    ...(input.cookPhotoUrl === null || input.cookPhotoUrl === undefined
      ? {}
      : { cookPhotoUrl: input.cookPhotoUrl }),
    destination,
  };

  switch (variant) {
    case 'confirmed':
      return { ...identity, variant, title: COPY.confirmed, badgeValue: COPY.badgeConfirmed };

    case 'reassignedConfirmed':
      return { ...identity, variant, title: COPY.reassigned, badgeValue: COPY.badgeConfirmed };

    case 'arriving':
      return {
        ...identity,
        variant,
        title: COPY.arriving,
        badgeCaption: COPY.captionArrivingIn,
        badgeValue: minutesBadge(input.etaMinutes, COPY.badgeUnknown),
      };

    case 'reassignedArriving':
      return {
        ...identity,
        variant,
        title: COPY.reassigned,
        badgeCaption: COPY.captionArrivingIn,
        badgeValue: minutesBadge(input.etaMinutes, COPY.badgeUnknown),
      };

    case 'arrived':
      return {
        ...identity,
        variant,
        title: COPY.arrived,
        badgeCaption: COPY.captionArrivedAt,
        // The persisted arrival instant is used; `actualStart` is intentionally not substituted.
        badgeValue: input.arrivedAtLabel ?? COPY.badgeArrived,
      };

    case 'live':
      return {
        ...identity,
        variant,
        title: COPY.live,
        badgeCaption: COPY.captionTimeLeft,
        badgeValue: minutesBadge(input.minutesLeft, COPY.badgeUnknown),
      };

    case 'rate':
      return {
        ...identity,
        variant,
        title: COPY.rate,
        badgeValue: COPY.badgeCompleted,
        rating: {
          description:
            input.ratingPrompt ??
            'Reward the cook with a 5+ rating if the service exceeded your expectations & keep them motivated!',
        },
      };
  }
}

/**
 * Status (plus the two payload facts that statuses cannot express) → variant.
 *
 * `created` and `assigned` are one card: from the customer's side the booking is confirmed
 * either way, and whether a cook has been matched shows as the presence of the cook block, not
 * as a different banner.
 */
function variantFor(input: HomeBannerInput): HomeBannerVariant | null {
  const reassigned = input.reassigned === true;

  switch (input.status) {
    case 'created':
    case 'assigned':
      return reassigned ? 'reassignedConfirmed' : 'confirmed';

    case 'cook_en_route':
      return reassigned ? 'reassignedArriving' : 'arriving';

    case 'cook_arrived':
      return 'arrived';

    case 'cooking':
      return 'live';

    case 'completed':
      // The rate card is offered only when the SERVER says the booking may be rated. A completed
      // booking already rated draws no banner, which is what `allowedActions.canRate` is for.
      return input.canRate === true ? 'rate' : null;

    case 'cancelled':
      // Only Spoon's own cancellation apologises. `cancelledBy` is the server's word for who did
      // it; absence is treated as NOT-system, so a customer cancellation never shows the apology.
      return input.cancelledBy === 'system' ? 'cancelled' : null;
  }
}
