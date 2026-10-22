import type { CtaKind } from './bookingDraft';
import type { DurationOption } from '../types';

/**
 * Which availability applies: "book" is an instant (Now) booking; "schedule" — Later, or Now
 * while instant is unavailable — is judged on slot capacity.
 */
export function isDurationAvailable(duration: DurationOption, cta: CtaKind): boolean {
  return cta === 'book' ? duration.available.now : duration.available.later;
}

/**
 * The tile to centre: the wanted one if bookable, else the nearest bookable one (ties go to the
 * shorter duration), else the wanted one anyway when nothing is bookable.
 */
export function nearestAvailableId(
  durations: readonly DurationOption[],
  wantedId: string,
  cta: CtaKind,
): string {
  const at = durations.findIndex((d) => d.id === wantedId);
  const from = at < 0 ? 0 : at;
  for (let step = 0; step < durations.length; step += 1) {
    for (const index of [from - step, from + step]) {
      const option = durations[index];
      if (option !== undefined && isDurationAvailable(option, cta)) return option.id;
    }
  }
  return durations[from]?.id ?? wantedId;
}

// The tile helpers live with the carousel, which Home now shares with Recurring.
export { liquidHeight, showsMrp, spokenDuration } from '@ui/v2/DurationCarousel';

/**
 * The tile as the current CTA prices it: Instant's price for "Book Now", Scheduled's otherwise.
 * A customer can be priced differently for the two (backend DEC-087), and the tile, the "Book
 * Now · ₹…" label and the booking itself must all agree on which one is meant.
 */
export function forCta(duration: DurationOption, cta: CtaKind): DurationOption {
  const prices = duration.bySlotType?.[cta === 'book' ? 'instant' : 'scheduled'];
  return prices === undefined ? duration : { ...duration, ...prices };
}
