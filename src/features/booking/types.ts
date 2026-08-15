import type { BookingView } from './state/bookingStatusView';
import type { CookViewModel, DetailRow, StatusTone } from '@ui';

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
  /** Pre-formatted CTA label including any amount. */
  readonly ctaLabel: string;
  readonly paymentDetailsLabel: string;
  readonly taxesInfo: { readonly title: string; readonly body: string };
  /** Present → the sheet is in a blocked state and the duration grid is inert. */
  readonly unavailable?: InstantUnavailableViewModel;
}

export interface BookingSummaryViewModel {
  readonly bannerTitle: string;
  readonly rows: readonly DetailRow[];
  readonly rescheduleLabel: string;
  readonly cancelLabel: string;
  /**
   * Ruling R-3: the client never infers reschedule eligibility. Absent means "the server did not
   * say", which hides the action.
   */
  readonly rescheduleAllowed?: boolean;
}

export interface TrackingViewModel {
  readonly bannerTitle: string;
  readonly bannerMessage: string;
  /** Server verdict, not a client comparison of ETA against the clock. */
  readonly tone: 'positive' | 'warning';
  readonly etaLabel: string;
  readonly noteTitle: string;
  readonly noteBody: string;
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
  /** Absolute server timestamp in epoch ms. The countdown renders from this. */
  readonly endsAtMs: number;
  /** Device/server clock offset supplied by the backend so the countdown corrects for skew. */
  readonly clockSkewMs: number;
  readonly extendCtaLabel: string;
  readonly endCtaLabel: string;
  readonly otpTitle: string;
  readonly otpCaption: string;
  readonly otpCode: string;
  readonly noteTitle: string;
  readonly noteBody: string;
  readonly extendPrompt: string;
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
  readonly ctaLabel: string;
}

export interface TipOptionViewModel {
  readonly id: string;
  readonly label: string;
}

export interface CompletionViewModel {
  readonly bannerTitle: string;
  readonly ratePrompt: string;
  readonly rateCaption: string;
  readonly ratingCaption: string;
  readonly feedbackTitle: string;
  readonly feedbackPlaceholder: string;
  readonly submitLabel: string;
  readonly tipTitle: string;
  readonly tipCaption: string;
  readonly tipOptions: readonly TipOptionViewModel[];
  readonly bookingHeadline: string;
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
  readonly tracking?: TrackingViewModel;
  readonly reassigned?: ReassignedViewModel;
  readonly autoCancelled?: AutoCancelledViewModel;
  readonly arrived?: ArrivedViewModel;
  readonly inService?: InServiceViewModel;
  readonly completion?: CompletionViewModel;
}
