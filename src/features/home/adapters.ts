import type { HomeBannerViewModel } from './state/homeBannerView';
import type { HomeViewModel } from './types';

/**
 * Home adapters — active booking, address header.
 *
 * ## What this may and may not decide
 *
 * It FORMATS, and nothing else. Choosing which of the eleven drawn banners to show moved to
 * `state/homeBannerView.ts` this pass, so the two concerns are no longer tangled: this file turns
 * server instants into the strings the card prints, and that file turns server STATE into a
 * variant. Neither decides whether a booking is active — the `/me/bookings/active` list decides
 * that by containing it.
 */

/** `337:4366` — "Tomorrow, Aug 5". Presentation of a server instant, in the device's locale. */
export function formatDateLabel(iso: string | null, now: Date = new Date()): string {
  if (iso === null) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (sameDay(date, now)) return `Today, ${day}`;
  if (sameDay(date, tomorrow)) return `Tomorrow, ${day}`;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** `337:4367` — "1:15 PM • 1 hr". The duration is the server's; only the wording is ours. */
export function formatTimeLabel(iso: string | null, durationMinutes: number): string {
  const duration =
    durationMinutes % 60 === 0
      ? `${durationMinutes / 60} hr`
      : durationMinutes < 60
        ? `${durationMinutes} mins`
        : `${(durationMinutes / 60).toFixed(1)} hr`;

  if (iso === null) return duration;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return duration;

  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${time} • ${duration}`;
}

/** A persisted server instant rendered as the local clock time, without inventing a date. */
export function formatClockLabel(iso: string | null | undefined): string | null {
  if (iso === null || iso === undefined) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Minutes from now until `iso`, or null when there is nothing to count.
 *
 * Used ONLY to render a badge the server already decided should say "Arriving in". It is display
 * arithmetic over a server-supplied instant, not a prediction: if the server sends no ETA, the
 * badge shows the status word instead of a number this app invented.
 */
export function minutesUntil(
  iso: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (iso === null || iso === undefined) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const minutes = Math.round((target.getTime() - now.getTime()) / 60_000);
  return minutes < 0 ? 0 : minutes;
}

/**
 * Composes the Home view model.
 *
 * `base` is the STATIC screen definition — the promo panels, the two booking tiles, the cuisine
 * mosaic, the reasons grid, the duration matrix, the exclusions and the promise. None of that is
 * domain state and none of it has an endpoint; it is marketing content, and its ownership is
 * still an open product question (PRODUCT_DECISION_PENDING).
 *
 * What IS real: the address in the header, and the active booking.
 */
export function homeFrom(input: {
  readonly base: HomeViewModel;
  readonly addressLabel?: string | null;
  readonly addressLine?: string | null;
  readonly activeBooking?: HomeBannerViewModel | undefined;
}): HomeViewModel {
  const { base } = input;
  const { activeBooking: _ignored, ...rest } = base;

  return {
    ...rest,
    header: {
      ...base.header,
      // Written UNCONDITIONALLY, including when null. Spreading them in only when present is
      // what caused FE-6: absence left `base.header`'s value — which comes from the static
      // screen definition — so an account with no saved address rendered the demo address.
      // The customer's address is domain state; the static definition has no authority over it.
      addressLabel: input.addressLabel ?? null,
      addressLine: input.addressLine ?? null,
    },
    ...(input.activeBooking === undefined ? {} : { activeBooking: input.activeBooking }),
  };
}
