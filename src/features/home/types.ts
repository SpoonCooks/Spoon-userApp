import type { BookingCardViewModel } from '@ui';

/**
 * Home view models — UI shape only.
 *
 * Ruling R-2: ONE Home with booking-state variants. `activeBooking` being present is what
 * selects the active variant (`59:520`); its absence renders the pre-booking Home (`1:455`).
 * The client does not decide whether a booking is active — it renders what it is given.
 *
 * TODO(backend-contract): every field below awaits a real payload. Nothing here is computed.
 */

export interface HomeHeaderViewModel {
  /** e.g. "Spoon in 18 mins" — a server-provided headline, never a client ETA calculation. */
  readonly etaHeadline: string;
  readonly addressLabel: string;
  readonly addressLine: string;
}

export interface HomePromoViewModel {
  readonly badge: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  readonly slideCount: number;
  readonly activeSlide: number;
}

export interface HomeBookingTileViewModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  /**
   * Trailing emphasised run of the subtitle. `1:585` sets "Get a cook in" at Livvic SemiBold 12/16
   * and " 18 mins" at Livvic **Bold 14/20** inside the SAME paragraph, so the emphasis has to be a
   * separate value rather than a substring the client hunts for.
   *
   * TODO(backend-contract): this is server copy — the "18 mins" figure is an operational promise,
   * never a client-side ETA.
   */
  readonly subtitleEmphasis?: string;
  readonly tone: 'positive' | 'accent';
  readonly icon: 'instant' | 'calendar';
  readonly disabled?: boolean;
}

/**
 * @deprecated Page 3a has no three-item trust row — the six-tile "Reasons to rely on Spoon cooks"
 * grid (`135:71`) occupies that role. Retained only so a future payload can reintroduce one
 * without a type break; nothing renders it today.
 */
export interface HomeTrustItemViewModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
}

export interface HomeMediaTileViewModel {
  readonly id: string;
  readonly label: string;
  readonly imageUrl?: string;
}

export interface HomeDurationGuideRow {
  readonly people: string;
  readonly dish: string;
  readonly time: string;
}

/** The long-form marketing stack that exists only on the pre-booking Home. */
export interface HomeMarketingViewModel {
  readonly cuisinesTitle: string;
  readonly cuisines: readonly HomeMediaTileViewModel[];
  readonly reasonsTitle: string;
  readonly reasons: readonly HomeMediaTileViewModel[];
  readonly durationGuideTitle: string;
  readonly durationGuideColumns: readonly [string, string, string];
  readonly durationGuide: readonly HomeDurationGuideRow[];
  readonly exclusionsTitle: string;
  readonly exclusions: readonly HomeMediaTileViewModel[];
  readonly promiseTitle: string;
}

export interface HomeViewModel {
  readonly header: HomeHeaderViewModel;
  readonly promo?: HomePromoViewModel;
  readonly tiles: readonly HomeBookingTileViewModel[];
  /** @deprecated Not present in Page 3a. See `HomeTrustItemViewModel`. */
  readonly trust?: readonly HomeTrustItemViewModel[];
  /** Present → active-booking variant. Absent → pre-booking variant. */
  readonly activeBooking?: BookingCardViewModel;
  /** Present on the pre-booking variant only. */
  readonly marketing?: HomeMarketingViewModel;
}
