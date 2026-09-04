import { formatPaise, promisedArrivalAt } from '@core/format';
import type { CookViewModel, DetailRow } from '@ui';
import { cookCardContentFor } from '@ui/components/cookCardContent';
import { cookPhotoFor } from '@ui/components/cookPhoto';

import { currentSkewMs } from '@core/time';

import type { BookingDetailDto, RefundDto, TrackingDto } from './api';
import { viewForBooking } from './state/bookingStatusView';
import type {
  BookingDetailViewModel,
  BookingSummaryViewModel,
  InServiceViewModel,
  TipSheetViewModel,
  TrackingViewModel,
} from './types';
import type { BookingDetailsViewModel } from './components/BookingDetailsSheet';

/**
 * Booking DTO -> lifecycle view model.
 *
 * ## What comes from the server
 *
 * The status (and therefore the SCREEN), the price snapshot, the address, the cook, the service
 * timing and — decisively — `allowedActions`. Whether Cancel, Reschedule, Extend, Rate, Tip or
 * Call are offered is read from that block and never re-derived from status and clock.
 *
 * ## What comes from the design
 *
 * All copy. Banner titles, note text, CTA labels and section headings have no endpoint and are
 * not domain state; they are supplied as `base` and selected by status.
 *
 * ## What is NOT here, and why
 *
 * `clockSkewMs` is no longer invented and no longer stuck at zero: the booking read publishes
 * `serverTime`, which `useBookingDetail` measures against the device clock at the seam and files
 * in the central skew store (§29). This adapter reads that ONE observation rather than taking a
 * timestamp of its own, so every countdown in the app agrees about what time it is.
 *
 * The service OTP is NOT here either, but for a different reason: it is not on the booking read.
 * It arrives on `GET /v1/bookings/:id/tracking` and is applied by `trackingDetailFrom` below.
 */

/** `3:1095` — Date / Start time / Duration / End Time, formatted from server instants. */
export function bookingRowsFrom(dto: BookingDetailDto): readonly DetailRow[] {
  const start = dto.scheduledStart === null ? null : new Date(dto.scheduledStart);
  const scheduledEnd =
    dto.timing.scheduledEnd === null || dto.timing.scheduledEnd === undefined
      ? start === null || Number.isNaN(start.getTime())
        ? null
        : new Date(start.getTime() + dto.durationMinutes * 60_000)
      : new Date(dto.timing.scheduledEnd);
  // Before the Start OTP the session has no `expectedEnd`; show the booking's planned end in the
  // details sheet. Once the session exists, `expectedEnd` remains the authoritative actual end.
  const end = dto.timing.expectedEnd === null ? scheduledEnd : new Date(dto.timing.expectedEnd);

  /**
   * ONE CLOCK for both ends of the row.
   *
   * `End Time` switches to the real end the moment the Start OTP is verified, while `Start time`
   * stayed on the booked slot — so a service booked for 2:00 that actually began at 1:54 read
   * "2:00 PM ... 2:24 PM" beside "Duration 30 mins". Twenty-four minutes labelled thirty: the two
   * rows were measuring from different starts, and the arithmetic on the customer's screen did
   * not add up.
   *
   * Once cooking has begun, `actualStart` is what `expectedEnd` was computed from, so reading
   * both from it makes the three rows agree. Before it, there is no actual start and the booked
   * time is the only honest answer — which is also what the customer is waiting for.
   */
  const actualStart = dto.timing.actualStart === null ? null : new Date(dto.timing.actualStart);
  const displayStart =
    actualStart !== null && !Number.isNaN(actualStart.getTime()) ? actualStart : start;

  const time = (date: Date | null) =>
    date === null || Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const duration =
    dto.durationMinutes % 60 === 0
      ? `${dto.durationMinutes / 60} hr`
      : `${dto.durationMinutes} mins`;

  return [
    {
      label: 'Date',
      value:
        start === null || Number.isNaN(start.getTime())
          ? '—'
          : start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    },
    { label: 'Start time', value: time(displayStart) },
    { label: 'Duration', value: duration },
    { label: 'End Time', value: time(end) },
  ];
}

/** `257:3439` — Booking amount / Taxes / Total paid, straight off the immutable snapshot. */
export function paymentRowsFrom(dto: BookingDetailDto): readonly DetailRow[] {
  return [
    { label: 'Booking amount', value: formatPaise(dto.price.serviceAmountPaise) },
    {
      // The rate is the server's, in basis points. Rendering it is not computing it.
      label: `Taxes @${dto.price.taxRateBps / 100}%`,
      value: formatPaise(dto.price.taxAmountPaise),
    },
    { label: 'Total paid', value: formatPaise(dto.price.totalAmountPaise), emphasis: 'total' },
  ];
}

/** `250:2861` — the booking-details sheet. */
export function detailsSheetFrom(input: {
  readonly base: BookingDetailsViewModel;
  readonly dto: BookingDetailDto;
}): BookingDetailsViewModel {
  return {
    ...input.base,
    bookingRows: bookingRowsFrom(input.dto),
    paymentRows: paymentRowsFrom(input.dto),
  };
}

/** `250:2951` — "Today, Aug 5 • 12:00 PM • 1 hr". Formatting, not assembly of domain facts. */
export function scheduleLineFrom(dto: BookingDetailDto, now: Date = new Date()): string {
  const duration =
    dto.durationMinutes % 60 === 0
      ? `${dto.durationMinutes / 60} hr`
      : `${dto.durationMinutes} mins`;

  if (dto.scheduledStart === null) return duration;
  const start = new Date(dto.scheduledStart);
  if (Number.isNaN(start.getTime())) return duration;

  const sameDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  const day = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const dayLabel = sameDay ? `Today, ${day}` : day;
  const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return `${dayLabel} • ${time} • ${duration}`;
}

export function summaryFrom(input: {
  readonly base: BookingSummaryViewModel;
  readonly dto: BookingDetailDto;
}): BookingSummaryViewModel {
  const recoveryHandoff = input.dto.recovery?.state === 'support_handoff';

  /**
   * `687:92` — the Rescheduled flow's own confirmation, which is the same frame as the confirmed
   * one with a different word in the banner.
   *
   * Read from the SERVER's `rescheduleCount`, never inferred from having just come through the
   * reschedule screen: reopening the booking later must still say what happened to it, and a
   * navigation flag would forget. A pre-revision deployment omits the field, and the banner then
   * reads "Booking confirmed!" exactly as before.
   *
   * The handoff banner still wins — a booking that needs attention has something more urgent to
   * say than how it was last moved.
   */
  const rescheduled = (input.dto.rescheduleCount ?? 0) > 0;

  return {
    ...input.base,
    scheduleLine: scheduleLineFrom(input.dto),
    rows: bookingRowsFrom(input.dto),
    rescheduleAllowed: input.dto.allowedActions.canReschedule,
    ...(() => {
      const n = rescheduleBlockedNoteFrom(input.dto.allowedActions.rescheduleBlockedReason);
      return n === undefined ? {} : { rescheduleBlockedNote: n };
    })(),
    ...(() => {
      const n = cancelBlockedNoteFrom(input.dto.allowedActions.cancelBlockedReason);
      return n === undefined ? {} : { cancelBlockedNote: n };
    })(),
    ...(rescheduled ? { bannerTitle: 'Rescheduled!' } : {}),
    ...(recoveryHandoff
      ? { bannerTitle: 'This booking needs attention', tone: 'warning' as const }
      : {}),
  };
}

/**
 * The header address line.
 *
 * `headerSubtitle` is the address the cook is coming to, which the booking payload carries in
 * full — so the header does not have to read the address list.
 */
export function headerSubtitleFrom(dto: BookingDetailDto): string {
  return [dto.address.flat, dto.address.society, dto.address.street, dto.address.city]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join(', ');
}

/**
 * The cook's name as the drawn banner titles carry it.
 *
 * `40:5364` reads "Cook Rekha is arriving in", `201:100` "Cook Jyoti is arriving" and `3:1658`
 * "Cook Rekha has arrived" — three DIFFERENT sentences that share one leading `Cook <name>`. The
 * name in each is sample data; the rest is the design.
 *
 * So the name is substituted and nothing else is: the sentence keeps its own wording, its own
 * "in"/no-"in" ending and its own line breaks, and only the person changes. Rebuilding the titles
 * from a template here would have to pick ONE of the three phrasings and would silently rewrite
 * the other two.
 *
 * A title that does not open with `Cook <word>` is returned untouched, and so is a booking with no
 * cook yet — there is no drawn nameless variant, and inventing one would be a UI change.
 */
function withCookName(title: string, cookName: string | null): string {
  if (cookName === null || cookName.trim().length === 0) return title;
  return title.replace(/^Cook\s+\S+/u, `Cook ${cookFirstNameFrom(cookName.trim())}`);
}

/** `Cook Rekha` -> `Rekha`. The backend may or may not carry the honorific; both are handled. */
function cookFirstNameFrom(name: string): string {
  return name.replace(/^Cook\s+/iu, '');
}

/**
 * The assigned-cook card, built ENTIRELY from the payload plus the bundled content the
 * payload's own `profileCode` resolves.
 *
 * Nothing here falls back to sample data. The card used to spread a designed fixture cook
 * underneath the payload, which meant a real cook rendered with Rekha's home state, dish chips,
 * trust badges and — when the backend sent no photo — Rekha's photograph. Every field below is
 * now either the server's value or honestly absent, and the card degrades exactly as it was
 * built to: initials instead of a photograph, attribute rows dropped, no specialty grid.
 *
 * The bundled content — the photographs and the two designed dish-chip lists with their
 * Figma-named glyphs — is resolved by the STABLE `profileCode` and by nothing else: not the
 * display name, not the phone, not array order. A cook without a published code gets no bundled
 * content, so sample imagery can never attach to the wrong person.
 *
 * Badges render only from the server's attested flags, fail-closed: absent or false is no
 * badge. The whole block is omitted when nothing is attested, which keeps the drawn no-badge
 * degradation reachable.
 */
function cookViewModelFrom(
  cook: NonNullable<BookingDetailDto['cook']> & { readonly name: string },
  bookingId: string,
): CookViewModel {
  const content = cookCardContentFor(cook.profileCode);
  const photoUrl = cookPhotoFor(cook);
  const languages = cook.languages ?? [];
  const cuisine = cook.cuisines?.[0];
  const anyBadge =
    cook.spoonTrained === true || cook.backgroundVerified === true || cook.hygieneVerified === true;
  return {
    id: cook.id ?? bookingId,
    displayName: cook.name,
    firstName: cookFirstNameFrom(cook.name),
    ...(photoUrl === undefined || photoUrl === null ? {} : { photoUrl }),
    ...(cook.gender === null || cook.gender === undefined ? {} : { gender: cook.gender }),
    ...(cuisine === undefined ? {} : { cuisine }),
    ...(cook.region === null || cook.region === undefined ? {} : { homeState: cook.region }),
    // The frames draw the language glyph with no label when there is nothing to say, which is
    // how an empty list renders — by dropping the row, not by inventing a value.
    ...(languages.length === 0 ? {} : { languages }),
    ...(content === undefined
      ? {}
      : {
          specialties: content.specialties,
          pureVegSpecialties: content.pureVegSpecialties,
        }),
    ...(anyBadge
      ? {
          badges: {
            spoonTrained: cook.spoonTrained === true,
            backgroundVerified: cook.backgroundVerified === true,
            hygienic: cook.hygieneVerified === true,
          },
        }
      : {}),
    ...(cook.profileVariant === null || cook.profileVariant === undefined
      ? {}
      : { profileVariant: cook.profileVariant }),
  };
}

/** `veg` draws the card's pure-veg dish list; `mixed` (or absent) the standard one. */
export function cookCardVariantFor(
  profileVariant: CookViewModel['profileVariant'],
): 'standard' | 'pureVeg' {
  return profileVariant === 'veg' ? 'pureVeg' : 'standard';
}

/**
 * `timingVerdict` -> the drawn presentation.
 *
 * `ON_TIME | LATE | UNKNOWN`, measured by the backend against DEC-049's `customer_commitment_at`.
 * The contract is explicit that a client must NOT derive this by comparing an ETA to its own
 * clock, so nothing here does. `UNKNOWN` is not a synonym for on time: it keeps whichever
 * presentation the copy already carried rather than asserting punctuality nobody has established.
 */
export function isLateVerdict(timingVerdict: string | null | undefined): boolean {
  return timingVerdict === 'LATE';
}

/** The absolute instant a service ends, from the SERVER. Never `start + duration`. */
function expectedEndMsFrom(expectedEnd: string | null): number | null {
  if (expectedEnd === null) return null;
  const at = new Date(expectedEnd);
  return Number.isNaN(at.getTime()) ? null : at.getTime();
}

/**
 * `201:278` Page 8e — the refund figure on the auto-cancelled surface.
 *
 * `GET /v1/bookings/:id/refunds` is the authority. The booking detail's `cancellation` block does
 * NOT carry an amount (the backend projects `cancelledAt`, `cancelledBy`, `reasonCode`,
 * `reasonLabel`, `reasonDetail` and stops), so the figure has to come from the refund record —
 * and until it does, the row shows the em dash the rest of this adapter uses for an absent server
 * value rather than the frame's transcribed ₹135.
 *
 * Nothing is summed and nothing is subtracted from the total paid: a refund is a durable record,
 * not `paid − fee` (task §10).
 */
function refundAmountLabelFrom(refunds: readonly RefundDto[] | null): string | null {
  if (refunds === null || refunds.length === 0) return null;
  const amountPaise = refunds[0]?.amountPaise;
  return amountPaise === undefined ? null : formatPaise(amountPaise);
}

/**
 * Composes the lifecycle view model from a real booking.
 *
 * `base` is the designed screen for the resolved view: its copy, its notes, its CTA labels. The
 * DTO supplies the facts. Surfaces whose required server field does not exist yet keep the base
 * copy unchanged, which is why this returns the base's own sub-models rather than fabricating
 * them.
 *
 * ## Every figure the frame transcribed is overwritten here
 *
 * The design fixtures carry sample prices, times, ETAs, refund amounts and OTP digits, because
 * they were transcribed from frames that had to draw something. Not one of them may survive into
 * a real booking, so each is replaced by its server field or blanked:
 *
 *   cook name in the banner title  <- `cook.name`
 *   in-service countdown target    <- `timing.expectedEnd`
 *   arrival clock time             <- `timing.arrivedAt`
 *   Start / End OTP digits         <- `tracking.serviceOtp` ONLY (blanked here)
 *   refund amount                  <- `GET /bookings/:id/refunds`
 *   completion headline            <- `scheduledStart` + `durationMinutes`
 *   reassignment notice presence   <- `reassignment.occurred`
 */
export function bookingDetailFrom(input: {
  readonly base: BookingDetailViewModel;
  readonly dto: BookingDetailDto;
  readonly refunds?: readonly RefundDto[] | null;
  readonly onUnknownStatus?: (status: string | null) => void;
}): BookingDetailViewModel {
  const { base, dto } = input;

  /** `reassignment.occurred` is the SERVER's word for it; nothing here infers a reassignment. */
  const reassigned = dto.reassignment?.occurred === true;

  const resolution = viewForBooking({
    status: dto.status,
    cancelledBy: dto.cancellation?.cancelledBy ?? null,
    reassigned,
    ...(input.onUnknownStatus === undefined ? {} : { onUnknown: input.onUnknownStatus }),
  });

  const cookName = dto.cook?.name ?? null;
  const arrivedAtLabel = arrivedAtLabelFrom(dto.timing.arrivedAt);
  const refundAmount = refundAmountLabelFrom(input.refunds ?? null);

  /**
   * The en-route / arrived / reassigned banner, with the real cook in it.
   *
   * `rescheduleAllowed` is ruling R-3 — the SERVER decides whether Reschedule is offered — and it
   * is applied to every one of these surfaces rather than only to `tracking`, because 8c/8d draw
   * the same action pair 9a/9b do.
   */
  const trackingLike = <T extends TrackingViewModel>(surface: T): T => ({
    ...surface,
    bannerTitle: withCookName(surface.bannerTitle, cookName),
    rescheduleAllowed: dto.allowedActions.canReschedule,
    ...(() => {
      const n = rescheduleBlockedNoteFrom(dto.allowedActions.rescheduleBlockedReason);
      return n === undefined ? {} : { rescheduleBlockedNote: n };
    })(),
    ...(() => {
      const n = cancelBlockedNoteFrom(dto.allowedActions.cancelBlockedReason);
      return n === undefined ? {} : { cancelBlockedNote: n };
    })(),
  });

  /**
   * `292:201` — page 8b's ONE structural difference from 8a.
   *
   * Present only while the server reports a reassignment. Dropped otherwise, so a confirmation
   * rendered from copy that happens to carry the notice cannot apologise for something that
   * never happened.
   */
  const summary =
    base.summary === undefined
      ? undefined
      : reassigned
        ? summaryFrom({ base: base.summary, dto })
        : omitReassignNotice(summaryFrom({ base: base.summary, dto }));

  /**
   * The design fixture's sample cook is STRUCTURALLY excluded, not merely overridden.
   *
   * `base` is a designed screen and some designed screens carry a sample cook. Spreading it
   * whole meant an unassigned or cancelled booking — where the server sends `cook: null` —
   * silently inherited that sample: a real customer shown Rekha's card for a booking that has
   * no cook, and a reassigned booking briefly showing the PREVIOUS design sample. Dropping the
   * key before the spread makes "the server sent no cook" render as no cook, always.
   */
  const { cook: _designSampleCook, ...baseWithoutCook } = base;

  return {
    ...baseWithoutCook,
    view: resolution.view,
    headerSubtitle: headerSubtitleFrom(dto),
    ...(summary === undefined ? {} : { summary }),
    ...(base.details === undefined
      ? {}
      : { details: detailsSheetFrom({ base: base.details, dto }) }),
    ...(dto.cook === null || dto.cook.name === undefined
      ? {}
      : { cook: cookViewModelFrom({ ...dto.cook, name: dto.cook.name }, dto.id) }),
    /**
     * The countdown target is `timing.expectedEnd` and nothing else.
     *
     * It moves when a service starts late and when an extension is paid for, which is exactly why
     * `scheduledStart + durationMinutes` is not it. `null` (a status that has no session yet)
     * leaves `useCountdown` with nothing to count, which renders the panel at zero instead of
     * counting down to a moment this client invented.
     *
     * The skew is the offset measured when this very payload arrived (§29), so only the "now" the
     * server's instant is compared against is corrected.
     *
     * The End OTP is BLANKED. It lives on tracking, and `trackingDetailFrom` puts the server's
     * code back; leaving the fixture's `111` here would show the customer a code that ends
     * nothing — and would show it in the one place they are being asked to read digits aloud.
     */
    /*
     * 12a `101:1812`, and 12b `292:1197` when the server reports an extension.
     *
     * The notice used to be unreachable: the detail carried no extension field, so nothing could
     * populate it, and the fixture's copy was deliberately not inherited. It is a SERVER report --
     * `extension.minutes` -- and never inferred from a moved `expectedEnd`, which also moves when
     * a service merely starts late and would have apologised for an extension nobody bought.
     *
     * Dropped when absent rather than left in place, the same rule `omitReassignNotice` applies:
     * a screen rendered from designed copy must not announce something that never happened.
     */
    ...(base.inService === undefined
      ? {}
      : {
          inService: {
            ...omitExtendedNotice(base.inService),
            endsAtMs: expectedEndMsFrom(dto.timing.expectedEnd),
            clockSkewMs: currentSkewMs(),
            otpCode: '',
            ...(dto.extension == null
              ? {}
              : {
                  extendedNotice: {
                    title: 'Booking extended!',
                    body: `End time extended by ${dto.extension.minutes} mins`,
                  },
                }),
          },
        }),
    // Arrival is backend-confirmed state. The customer message and displayed clock time must not
    // come from the design fixture once the real booking says `cook_arrived`. The Start OTP is
    // blanked for the same reason the End OTP is.
    ...(base.arrived === undefined
      ? {}
      : {
          arrived: {
            ...trackingLike(base.arrived),
            bannerMessage: 'Cook has arrived at your location',
            etaLabel: arrivedAtLabel ?? '—',
            otpCode: '',
          },
        }),
    /**
     * `319:3191` (`14b`) — Completion's SUBMITTED state.
     *
     * `allowedActions.canRate` is the server's answer to "may this booking still be rated", so a
     * completed booking that may NO LONGER be rated is one that already has been. That is the
     * whole derivation: no local "I just pressed Submit" flag, which would show the thank-you
     * state after a request that failed, and would lose it on the next app launch.
     *
     * `bookingHeadline` is the same schedule line the summary draws, so `143:207` names the
     * booking that was actually completed rather than the frame's "12th April • 1:15 PM • 1 hr".
     */
    ...(base.completion === undefined
      ? {}
      : {
          completion: {
            ...base.completion,
            bookingHeadline: scheduleLineFrom(dto),
            submitted: !dto.allowedActions.canRate,
          },
        }),
    // Ruling R-3 — the SERVER decides whether Reschedule is offered.
    ...(base.tracking === undefined ? {} : { tracking: trackingLike(base.tracking) }),
    // 8c / 8d. The notice is the design's; the cook in the title and the action gate are the
    // server's, exactly as on 9a / 9b.
    ...(base.reassigned === undefined
      ? {}
      : { reassigned: { ...trackingLike(base.reassigned), notice: base.reassigned.notice } }),
    /**
     * `201:278` — the terminal auto-cancelled surface.
     *
     * The rows are this booking's, and the refund amount is the refund RECORD's. Where the server
     * has published no refund yet the row shows an em dash rather than the frame's ₹135: a figure
     * nobody owes is worse than a figure nobody has stated.
     */
    ...(base.autoCancelled === undefined
      ? {}
      : {
          autoCancelled: {
            ...base.autoCancelled,
            rows: bookingRowsFrom(dto),
            refundAmount: refundAmount ?? '—',
          },
        }),
    // The same ruling for Call Cook. Pressing it fetches a cook's personal number from a
    // separate endpoint that enforces this identical eligibility, so offering the control on
    // any other basis would only produce a failed call — and, worse, would imply the customer
    // is entitled to the number at a moment the server says they are not.
    callCookAllowed: dto.allowedActions.canCallCook,
    cancelAllowed: dto.allowedActions.canCancel,
    // §11 — instant draws no Cancel / Reschedule. Passed through verbatim; not interpreted here.
    slotType: dto.slotType,
  };
}

/**
 * Exact-optional-safe removal, so a designed screen's own extension notice cannot survive onto a
 * booking that was never extended. The sibling of `omitReassignNotice`, for the same reason.
 */
function omitExtendedNotice(inService: InServiceViewModel): InServiceViewModel {
  if (inService.extendedNotice === undefined) return inService;
  const { extendedNotice: _dropped, ...rest } = inService;
  return rest;
}

/** Exact-optional-safe removal: the key is dropped, never set to `undefined`. */
function omitReassignNotice(summary: BookingSummaryViewModel): BookingSummaryViewModel {
  if (summary.reassignNotice === undefined) return summary;
  const { reassignNotice: _dropped, ...rest } = summary;
  return rest;
}

/**
 * Tracking DTO -> the live fields of the lifecycle view model.
 *
 * Layered ON TOP of `bookingDetailFrom` rather than folded into it, because the two reads have
 * different lifetimes: the booking detail is stable, tracking polls at the interval the server
 * asks for. Keeping them separate means a tracking refresh does not rebuild the whole screen's
 * copy.
 *
 * ## The service OTP
 *
 * `dto.serviceOtp.start` / `.end` are the codes the customer reads out to the cook. The server
 * decides when each one exists — it returns `null` outside that code's window and once the code
 * has been consumed. So:
 *
 *   - a code the server supplies is shown verbatim;
 *   - a code the server withholds leaves the panel EMPTY. `bookingDetailFrom` has already blanked
 *     the fixture's digits, and `OtpDisplay` renders an empty code as the panel with no tiles —
 *     the designed geometry, no placeholder, and nothing that could be mistaken for a real code.
 *
 * Nothing here derives, caches or remembers a code, and no code is ever logged.
 *
 * ## The ETA and the verdict
 *
 * `eta.estimatedArrivalAt` is the server's arrival instant. It is formatted for display and never
 * compared against the clock to assert lateness — `timingVerdict` is the server's verdict and the
 * only thing allowed to make that claim, which is why `tone` is set from it here and the
 * late/on-time COPY is selected by the caller from the two drawn variants.
 *
 * After arrival the backend nulls the ETA (tracking terminates at the gate), so the en-route
 * label stops updating by construction: there is no ETA left to render and nothing here
 * substitutes one.
 */
export function trackingDetailFrom(input: {
  readonly base: BookingDetailViewModel;
  readonly dto: TrackingDto;
  /** The booking's own start. The arrival shown to a customer is never earlier than this. */
  readonly scheduledStartIso?: string | null;
}): BookingDetailViewModel {
  const { base, dto } = input;

  const start = dto.serviceOtp?.start;
  const end = dto.serviceOtp?.end;
  const etaLabel = etaLabelFrom(dto.eta.estimatedArrivalAt, input.scheduledStartIso);
  const arrivedAtLabel = arrivedAtLabelFrom(dto.arrivedAt);
  const late = isLateVerdict(dto.timingVerdict);
  const knownVerdict = dto.timingVerdict === 'ON_TIME' || dto.timingVerdict === 'LATE';
  const safeEtaLabel = etaLabel ?? '—';

  /** The server's punctuality answer, applied to whichever travelling surface is drawn. */
  const trackingSurface = <T extends TrackingViewModel>(surface: T): T => ({
    ...surface,
    etaLabel: safeEtaLabel,
    ...(knownVerdict && etaLabel !== null
      ? { tone: late ? ('warning' as const) : ('positive' as const) }
      : {
          tone: 'neutral' as const,
          bannerMessage:
            etaLabel === null
              ? 'Cook arrival time is not available yet.'
              : 'Cook arrival status is being updated.',
        }),
  });

  return {
    ...base,
    ...(base.tracking === undefined
      ? {}
      : {
          tracking: {
            ...trackingSurface(base.tracking),
          },
        }),
    ...(base.reassigned === undefined
      ? {}
      : {
          reassigned: {
            ...trackingSurface(base.reassigned),
          },
        }),
    ...(base.arrived === undefined
      ? {}
      : {
          arrived: {
            ...base.arrived,
            etaLabel: arrivedAtLabel ?? etaLabel ?? '—',
            ...(start === null || start === undefined ? {} : { otpCode: start }),
          },
        }),
    ...(base.inService === undefined
      ? {}
      : {
          inService: {
            ...base.inService,
            ...(end === null || end === undefined ? {} : { otpCode: end }),
          },
        }),
  };
}

/**
 * The arrival instant as the banner draws it. `null` when the server has no ETA, which leaves the
 * designed copy in place instead of rendering an empty or invented time.
 */
function etaLabelFrom(
  estimatedArrivalAt: string | null,
  scheduledStartIso?: string | null,
): string | null {
  if (estimatedArrivalAt === null) return null;
  const projected = new Date(estimatedArrivalAt);
  if (Number.isNaN(projected.getTime())) return null;

  /*
   * Never earlier than the booking itself.
   *
   * The projection answers "when would she get there if she left now", and a cook who sets off
   * early gets there early: at 11:06 for an 11:30 booking the customer was told the cook arrives
   * in 2 MINUTES. True about the walk, and useless as a promise -- nobody is at the door at 11:08,
   * and a customer who believes it goes and waits.
   *
   * The booking is what the customer was sold, so the soonest they are told to expect anyone is
   * the time they chose. A LATE arrival is unaffected: it is after the start, so the projection
   * still wins and the delay is reported honestly.
   */
  // The clamp lives in `core/format/arrival` because Home draws the same number, and the two
  // disagreed on screen when only this one applied it.
  const at = promisedArrivalAt(projected, scheduledStartIso);

  /*
   * MINUTES REMAINING, because that is what the label above it promises.
   *
   * `9a` reads "Cook is arriving in" over "16 mins". This returned a clock time, so the screen
   * said "Cook Test Cook is arriving in / 7:38 AM" -- the wrong quantity, and a sentence that does
   * not finish. Seen on the handset on 2026-09-02.
   *
   * `Date.now() + currentSkewMs()` is the SERVER's clock as this device best knows it, the same
   * correction the in-service countdown uses. A handset minutes out would otherwise report a
   * remaining time nobody else agrees with, off one correct arrival instant.
   */
  const remainingMs = at.getTime() - (Date.now() + currentSkewMs());
  /*
   * ROUNDED, because the Home banner (`minutesUntil`) and the Cook App both round, and a customer
   * comparing the two screens must not see different numbers for one arrival. This briefly used
   * `Math.ceil`, which is why the booking page said "3 mins" while Home and the cook's own card
   * both said 2.
   */
  const minutes = Math.round(remainingMs / 60_000);

  /*
   * FIGMA_PENDING: the frames draw only a positive number, because a projected arrival is normally
   * still ahead. An ETA that has passed without an arrival is reachable — a stalled cook, a late
   * refresh — and printing "0 mins" or a negative reads as broken rather than imminent. The
   * banner's own late copy carries the story; this says only that the wait is short.
   *
   * It must also FIT. `94:1097` is a fixed 122pt panel and the label is `numberOfLines={1}`, so
   * anything wider than about "16 mins" is silently ellipsised — which is exactly what happened to
   * the "Any moment" this used to return: the banner read "Any mo…", which says nothing at all.
   * Seven characters is the working budget, and this stays inside it while keeping the minutes
   * register the positive case uses.
   */
  if (minutes <= 0) return '< 1 min';
  return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
}

/** The persisted backend arrival instant, never a handset detection time or an ETA. */
function arrivedAtLabelFrom(arrivedAt: string | null | undefined): string | null {
  if (arrivedAt === null || arrivedAt === undefined) return null;
  const at = new Date(arrivedAt);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * The tip sheet's amounts (`306:2997`), from the catalogue.
 *
 * Ruling R-1 and task §16: a monetary value is the SERVER's. `catalogue.tips.suggestedAmountsPaise`
 * is what the tip endpoint expects, so the sheet offers exactly those and nothing is computed on
 * the client. The previous build drew the four amounts transcribed from the frame
 * (25/50/100/150) while the catalogue published 20/50/100/150 — so the sheet could offer an
 * amount the customer then did not pay.
 *
 * The id CARRIES the amount (`tip-5000`) for the same reason a duration id carries its minutes:
 * the sheet reports a chosen id, and the caller must be able to turn that back into the paise it
 * sends without a lookup table that could drift.
 */
const TIP_ID_PREFIX = 'tip-';

export function tipIdFor(amountPaise: number): string {
  return `${TIP_ID_PREFIX}${amountPaise}`;
}

export function tipAmountPaiseFrom(optionId: string | null): number | null {
  if (optionId === null || !optionId.startsWith(TIP_ID_PREFIX)) return null;
  const paise = Number.parseInt(optionId.slice(TIP_ID_PREFIX.length), 10);
  return Number.isFinite(paise) && paise > 0 ? paise : null;
}

/**
 * `ext-30` -> 30, the same id-carries-its-value convention as tips and durations.
 *
 * `useExtensionData` mints these from the catalogue's published `minutes`, and
 * `POST /v1/bookings/:id/extensions` takes minutes — so this is a decode of a value the SERVER
 * supplied, never a duration this client chose. `null` for anything else, which the caller reads
 * as "no extension to request" and refuses to send.
 */
const EXTENSION_ID_PREFIX = 'ext-';

/** The inverse. Minted from a length the SERVER published, never from one this client chose. */
export function extensionIdFor(minutes: number): string {
  return `${EXTENSION_ID_PREFIX}${minutes}`;
}

export function extensionMinutesFrom(optionId: string | null): number | null {
  if (optionId === null || !optionId.startsWith(EXTENSION_ID_PREFIX)) return null;
  const minutes = Number.parseInt(optionId.slice(EXTENSION_ID_PREFIX.length), 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

/**
 * `306:2885` draws ₹50 preselected and its CTA already reads "Tip • ₹50".
 *
 * The catalogue publishes no default, so the DRAWN one is matched against the published amounts
 * rather than invented: if operations stops offering ₹50 the sheet opens with nothing chosen,
 * which is the designed "omit it" behaviour, not a silently different preselection.
 */
const DRAWN_DEFAULT_TIP_PAISE = 5000;

/**
 * `306:3060` — the tip CTA names the amount it will charge.
 *
 * Exported because the SHEET has to rebuild it: the label was composed once here from the
 * preselected amount and then rendered verbatim, so choosing ₹20 left the button reading
 * "Tip • ₹50" — and pressing it charged ₹20, which is worse than the wrong number alone. Both
 * sides now format through this, so the button and the selection cannot name different prices.
 */
export function tipCtaLabelFor(amountLabel: string): string {
  return `Tip • ${amountLabel}`;
}

export function tipSheetFrom(input: {
  readonly base: TipSheetViewModel;
  readonly suggestedAmountsPaise: readonly number[];
  readonly formatAmount: (paise: number) => string;
}): TipSheetViewModel {
  const { base, suggestedAmountsPaise, formatAmount } = input;
  if (suggestedAmountsPaise.length === 0) return base;

  const options = suggestedAmountsPaise.map((paise) => ({
    id: tipIdFor(paise),
    label: formatAmount(paise),
  }));

  const preselected = suggestedAmountsPaise.includes(DRAWN_DEFAULT_TIP_PAISE)
    ? DRAWN_DEFAULT_TIP_PAISE
    : null;

  return {
    ...base,
    options,
    ...(preselected === null ? {} : { defaultOptionId: tipIdFor(preselected) }),
    // `306:3060` — the CTA carries the amount. Recomputed from the SAME server figure the
    // preselection uses, so the button can never name a price the sheet does not offer.
    ...(preselected === null ? {} : { ctaLabel: tipCtaLabelFor(formatAmount(preselected)) }),
  };
}

/**
 * The one line that explains a Reschedule button the customer cannot see.
 *
 * The button is hidden rather than disabled, so when cancellation is closed too the whole action
 * row disappears and the screen accounts for none of it. Only the two reasons a customer cannot
 * work out for themselves get a line. COOK_DISPATCHED and the terminal states do not: the banner
 * above already says the cook has arrived, or that the booking is over.
 */
/**
 * The line that explains a Cancel button the customer cannot see.
 *
 * An instant booking is the only kind the pilot places, and it closes to cancellation the
 * moment it has a cook — so without this the control simply disappears and the screen offers
 * no account of itself. WhatsApp is named because something has usually gone wrong by the
 * time somebody is looking for this, and the support handoff is the real next step.
 */
export function cancelBlockedNoteFrom(reason: string | null | undefined): string | undefined {
  if (reason === 'INSTANT_CONFIRMED') {
    return 'An instant booking sends a cook out straight away, so it cannot be cancelled or moved to another time. Message us on WhatsApp if something has gone wrong.';
  }
  if (reason === 'COOK_DISPATCHED') {
    return 'Your cook has arrived, so this can no longer be cancelled here. Message us on WhatsApp if something has gone wrong.';
  }
  return undefined;
}

export function rescheduleBlockedNoteFrom(reason: string | null | undefined): string | undefined {
  if (reason === 'INSTANT_NOT_RESCHEDULABLE') {
    return 'An instant booking brings a cook out now, so it cannot be moved to another time. Message us on WhatsApp if something has gone wrong.';
  }
  if (reason === 'ALREADY_RESCHEDULED') {
    return 'This booking has already been moved once. Cancel it and book again if the time no longer works.';
  }
  return undefined;
}
