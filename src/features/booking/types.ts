import type { BookingDetailsViewModel } from './components/BookingDetailsSheet';
import type { BookingView } from './state/bookingStatusView';
import type { CookViewModel, DetailRow, DurationHelpContent, StatusTone } from '@ui';

/**
 * Booking view models — UI shape only. TODO(backend-contract) applies to every field.
 *
 * Boundary reminders encoded by these shapes:
 *  - prices and CTA labels arrive PRE-FORMATTED (`"Book Now • ₹198"`); nothing is computed;
 *  - availability arrives as `disabled` flags on options; the client generates no slots;
 *  - the lifecycle `view` is chosen from server state through the (currently empty) registry in
 *    `state/bookingStatusView.ts`; the client never advances it.
 */

export interface DurationOptionViewModel {
  /** Opaque server id. */
  readonly id: string;
  readonly label: string;
  /** Pre-formatted, server-provided. */
  readonly price: string;
  readonly strikePrice?: string;
  /** Merchandising flag from the server (e.g. "Popular"), not a client heuristic. */
  readonly badge?: string;
  readonly disabled?: boolean;
}

/** The blocked states of the Instant sheet — `25:1327` out of shift, `44:5378` no slots. */
export interface InstantUnavailableViewModel {
  readonly icon: 'moon' | 'calendar';
  /** e.g. "Slots open at 6 AM today" — embeds a server-configured time. */
  readonly message: string;
  readonly ctaLabel: string;
  /**
   * TODO(designer): the same Schedule CTA is yellow on `25:1327` and lime on `44:5378`
   * (defect D-7). The tone is supplied as data so neither value is hardcoded here.
   */
  readonly ctaTone: 'primary' | 'accent';
}

export interface InstantViewModel {
  readonly title: string;
  /** e.g. "18 mins" — a server ETA, rendered, never computed. */
  readonly etaLabel: string;
  readonly etaCaption: string;
  readonly durations: readonly DurationOptionViewModel[];
  /**
   * `381:286` — the "Duration" label above the grid, which the sheet previously did not draw at
   * all, and `381:287` "Help me pick" right-aligned on the same row (task §9).
   */
  readonly durationSectionTitle?: string;
  readonly durationHelp?: DurationHelpContent;
  /** Pre-formatted CTA label including any amount. */
  readonly ctaLabel: string;
  readonly paymentDetailsLabel: string;
  readonly taxesInfo: { readonly title: string; readonly body: string };
  /** Present → the sheet is in a blocked state and the duration grid is inert. */
  readonly unavailable?: InstantUnavailableViewModel;
}

export interface BookingSummaryViewModel {
  readonly bannerTitle: string;
  /** Server-projected recovery handoff changes the banner from confirmation to attention. */
  readonly tone?: 'positive' | 'warning';
  /**
   * `250:2951` — "Today, Aug 5 • 12:00 PM • 1 hr", the one-line schedule summary now drawn under
   * the banner title. PRE-FORMATTED by the server: the client does not assemble it from the rows,
   * does not format a date and does not join the parts.
   */
  readonly scheduleLine: string;
  /**
   * `383:747` / `383:760` — NEW on `8a` and `8b`: "Share recipe/ special requests".
   *
   * A second outlined row beside "View booking details", carrying the `383:755` recipe-book mark
   * and a WhatsApp disc instead of a chevron, because it LEAVES the app. The founder's ruling
   * (task §15) sends it to the same Spoon line as every other WhatsApp control.
   *
   * Optional: only the two confirmation frames draw it, so a view model without it draws nothing.
   */
  readonly shareRecipeLabel?: string;

  /**
   * The Date / Start time / Duration / End time rows. `3:1041` no longer draws them inline — they
   * moved behind the "View booking details" row (`250:2966`) onto `250:2861`. They stay on this
   * view model because that screen renders them verbatim.
   */
  readonly rows: readonly DetailRow[];
  /** `250:2947` / `250:2948` — the "Note before starting" card. Product content, supplied. */
  readonly note: LifecycleNoticeViewModel;
  /** `250:2969` — "View booking details". */
  readonly viewDetailsLabel: string;
  readonly rescheduleLabel: string;
  readonly cancelLabel: string;
  /**
   * Ruling R-3: the client never infers reschedule eligibility. Absent means "the server did not
   * say", which hides the action.
   */
  readonly rescheduleAllowed?: boolean;
  /**
   * `292:201` — Confirm reassign (`289:6607`) inserts ONE notice between the banner and the cook
   * card. Its PRESENCE is the server reporting a reassignment; the client never decides that one
   * happened and never models the matching that produced the new cook (task §7).
   */
  readonly reassignNotice?: LifecycleNoticeViewModel;
}

export interface TrackingViewModel {
  readonly bannerTitle: string;
  readonly bannerMessage: string;
  /** Server verdict, not a client comparison of ETA against the clock. */
  readonly tone: 'positive' | 'warning' | 'neutral';
  readonly etaLabel: string;
  readonly noteTitle: string;
  readonly noteBody: string;
  /** `292:237` — "View booking details". The row renders only when a host wires the seam. */
  readonly viewDetailsLabel: string;
  /** `292:243` / `292:245` — the action pair `3:1381` and `201:100` now draw. */
  readonly cancelLabel: string;
  readonly rescheduleLabel: string;
  /** Ruling R-3: absent means "the server did not say", which hides Reschedule. */
  readonly rescheduleAllowed?: boolean;
}

/**
 * The reassignment notice on `208:553` — Page 8c/8d's ONLY structural difference from En route.
 *
 * BOUNDARY: presence of this object is the server saying "a reassignment happened". The client
 * does not know when a reassignment occurs, cannot cause one, and does not model the matching
 * that produced the new cook (task §7).
 */
export interface LifecycleNoticeViewModel {
  readonly title: string;
  readonly body: string;
}

export interface ReassignedViewModel extends TrackingViewModel {
  readonly notice: LifecycleNoticeViewModel;
}

/**
 * `201:278` Page 8e — a TERMINAL, server-reported state.
 *
 * Every figure is pre-formatted and supplied. `refundAmount` in particular is NOT derived from
 * the summary's Total: the client never computes a refund (task §10).
 */
export interface AutoCancelledViewModel {
  readonly title: string;
  readonly rows: readonly DetailRow[];
  readonly apologyTitle: string;
  readonly apologyBody: string;
  readonly refundTitle: string;
  readonly refundBody: string;
  readonly refundAmountLabel: string;
  /** Server-supplied. Never `paid − fee`. */
  readonly refundAmount: string;
  readonly refundDestination: string;
  readonly refundTimeframe: string;
  readonly rebookPrompt: string;
  readonly rebookAcceptLabel: string;
  readonly rebookDeclineLabel: string;
}

export interface ArrivedViewModel extends TrackingViewModel {
  readonly startCtaLabel: string;
  readonly otpTitle: string;
  readonly otpCaption: string;
  /** Server-generated. Never logged, never client-generated. */
  readonly otpCode: string;
}

export interface InServiceViewModel {
  readonly statusTitle: string;
  readonly statusMessage: string;
  /**
   * Absolute server timestamp in epoch ms — `timing.expectedEnd`. The countdown renders from this.
   *
   * `null` where the server has published no session end. `useCountdown` treats that as "nothing
   * to count" rather than counting to an invented moment, which is the only honest rendering: a
   * client that substituted `scheduledStart + durationMinutes` would be wrong for every service
   * that started late or was extended, and those are exactly the ones a customer watches.
   */
  readonly endsAtMs: number | null;
  /** Device/server clock offset supplied by the backend so the countdown corrects for skew. */
  readonly clockSkewMs: number;
  readonly extendCtaLabel: string;
  readonly endCtaLabel: string;
  readonly otpTitle: string;
  readonly otpCaption: string;
  readonly otpCode: string;
  /**
   * `101:1812` draws NO note card, but the copy is kept on the model: it is the same server
   * string the En route and Arrived frames show, and dropping the field would make re-adding the
   * block a contract change rather than a layout one.
   */
  readonly noteTitle: string;
  readonly noteBody: string;
  readonly extendPrompt: string;
  /** `292:1189` — "View booking details". */
  readonly viewDetailsLabel: string;
  /**
   * `292:1399` — present ONLY when the server reports that an extension took effect. The new end
   * time arrives with it (and in `endsAtMs`); the client never adds the chosen option to a clock.
   */
  readonly extendedNotice?: LifecycleNoticeViewModel;
}

export interface ExtensionOptionViewModel {
  readonly id: string;
  readonly label: string;
  /** Pre-formatted, server-provided. Extension pricing is never computed client-side. */
  readonly price: string;
  readonly disabled?: boolean;
}

export interface ExtensionViewModel {
  readonly title: string;
  readonly sectionTitle: string;
  readonly options: readonly ExtensionOptionViewModel[];
  readonly notes: readonly { readonly id: string; readonly title: string; readonly body: string }[];
  readonly fallbackTitle: string;
  readonly fallbackBody: string;
  readonly fallbackCtaLabel: string;
  /** `275:4265` — pre-formatted, including the amount ("Extend • ₹16"). */
  readonly ctaLabel: string;
  /**
   * `143:381` — the option the sheet OPENS on. `3:2002` draws "10 mins" selected and the CTA
   * already carries an amount, so the default and the pre-formatted label are one server
   * decision. Omit it and the sheet opens with nothing chosen.
   */
  readonly defaultOptionId?: string;
  /** `275:4267` — the underlined link under the CTA. Omit it and no link is drawn. */
  readonly paymentDetailsLabel?: string;
  /**
   * `275:4272` — the dialog the link opens (frame `275:4189`, "Page 13b- Extension taxes"). Its
   * copy differs from the Instant sheet's `25:1585`: "What is Taxes and Fee?" and a 5% GST line,
   * not 2.5% CGST + 2.5% SGST. Two dialogs, not one.
   */
  readonly taxesInfo?: { readonly title: string; readonly body: string };
}

export interface TipOptionViewModel {
  readonly id: string;
  readonly label: string;
}

export interface CompletionViewModel {
  readonly bannerTitle: string;
  readonly ratePrompt: string;
  /** `306:2883` — "Your rating helps us assign more suitable cooks to you!". */
  readonly rateCaption: string;
  /** `143:256` — the "5+" legend copy before a rating is in. */
  readonly ratingCaption: string;
  /** `319:3228` — what the legend says once one is. */
  readonly ratedCaption: string;
  readonly feedbackTitle: string;
  readonly feedbackPlaceholder: string;
  /** `319:3252` — "Thanks for sharing your feedback!". */
  readonly feedbackAcknowledgement: string;
  readonly submitLabel: string;
  /** `308:3125` — "Would you like to tip the cook?". */
  readonly tipRowLabel: string;
  readonly bookingHeadline: string;
  /**
   * `319:3191` — a SERVER fact: the rating and feedback are already recorded. The component never
   * sets this from a button press; pressing Submit reports upward and the next payload decides.
   */
  readonly submitted?: boolean;
}

/**
 * `306:2885` "Page 15- Tip pop out" — the tip sheet, opened from Completion's `308:3121` row.
 *
 * BOUNDARY: amounts are server-supplied options rendered verbatim, the CTA label is pre-formatted
 * ("Tip • ₹50"), and choosing one takes no payment (ruling R-1).
 */
export interface TipSheetViewModel {
  /** `306:2989` — the sheet title. */
  readonly title: string;
  /** `306:2997` — "Share an amount". */
  readonly sectionTitle: string;
  readonly options: readonly TipOptionViewModel[];
  /**
   * `306:3050` — the option the sheet OPENS on. `306:2885` draws ₹50 selected and the CTA already
   * reads "Tip • ₹50", so the default and the pre-formatted label are one server decision, not
   * something the client picks (ruling R-1). Omit it and the sheet opens with nothing chosen.
   */
  readonly defaultOptionId?: string;
  /** `306:3023` / `306:3024` — the reassurance block under the chips. */
  readonly note: LifecycleNoticeViewModel;
  /** `306:3043` — pre-formatted, including the amount, and consistent with `defaultOptionId`. */
  readonly ctaLabel: string;
}

/** What the lifecycle host renders. `view` is resolved from server state, never derived here. */
export interface BookingDetailViewModel {
  readonly view: BookingView;
  readonly headerTitle: string;
  readonly headerSubtitle: string;
  readonly helpLabel: string;
  readonly cook?: CookViewModel;
  readonly statusTone?: StatusTone;
  readonly summary?: BookingSummaryViewModel;
  /** `250:2861` — the sheet behind Confirmation's "View booking details" row. */
  readonly details?: BookingDetailsViewModel;
  readonly tracking?: TrackingViewModel;
  readonly reassigned?: ReassignedViewModel;
  readonly autoCancelled?: AutoCancelledViewModel;
  readonly arrived?: ArrivedViewModel;
  readonly inService?: InServiceViewModel;
  readonly completion?: CompletionViewModel;
  /** `306:2885` — the sheet behind Completion's tip row. */
  readonly tip?: TipSheetViewModel;
  /**
   * `allowedActions.canCallCook` — the SERVER's answer to whether Call Cook is offered.
   *
   * Ruling R-3's shape, applied to the second gated action. The client does not re-derive this
   * from status, from whether a cook is assigned, or from the clock: the same eligibility gates
   * `GET /v1/bookings/:id/cook-contact`, so a button offered on any other basis would simply
   * fail there. Absent means not offered — a booking whose payload predates the field does not
   * get a control that leaks a phone number.
   */
  readonly callCookAllowed?: boolean;
  /**
   * `GET /v1/bookings/:id` -> `slotType`.
   *
   * Carried because task §11 makes it a RENDERING rule, not only a permission one: an INSTANT
   * booking draws no Cancel and no Reschedule at all — not disabled versions of them. A cook is
   * already on the way, so there is nothing to move and the cancellation flow (`7a`..`7d`, which
   * quotes a notice-period refund band) does not describe what would happen.
   *
   * This does NOT replace `allowedActions`. The server still decides whether a SCHEDULED booking
   * may be cancelled or moved; this only removes the controls the design never draws for instant.
   */
  readonly slotType?: 'scheduled' | 'instant';

  /**
   * `allowedActions.canCancel` — the SERVER's answer to whether Cancel is offered.
   *
   * Blocker B-11 recorded that no live-booking frame drew a Cancel control. The newer file does:
   * `3:1041` draws the Reschedule/Cancel pair under the summary, and `292:241` draws it on the
   * en-route and reassigned frames. So the flow has an entry point, and what gates it is the
   * server — not the status, and not whether the screen happens to be one that draws the pair.
   */
  readonly cancelAllowed?: boolean;
}
