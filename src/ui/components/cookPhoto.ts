import { cookCardContentFor } from './cookCardContent';

/**
 * THE one place a cook's photograph is resolved. Every surface that draws a cook goes through it.
 *
 * ## Why this exists
 *
 * The same fallback — "the server's photo, else the bundled one for this cook's `profileCode`,
 * else nothing" — was written out by hand at each surface that needed it, and each copy drifted:
 *
 *   * the Home banner read `cutoutPhotoUrl`, which was one SHARED export of Rekha, so it drew her
 *     face over every upcoming booking while the booking screen one tap inside drew the right
 *     cook;
 *   * History read the raw `profileImageUrl`, while the booking adapter read the `photoUrl` the
 *     schema normalises it into — two spellings of one server field, and a surface reading the
 *     wrong one silently gets nothing;
 *   * the card and the completion screen each repeated the chain again.
 *
 * None of those is visible from inside the surface that has it. They are only found by looking at
 * two screens side by side, which is how all of them were in fact found — by a founder testing.
 *
 * A resolver is the fix that makes the class of bug unrepresentable rather than fixing its
 * instances one at a time: there is no second chain to forget to update, and no second field to
 * point at the wrong asset.
 *
 * ## Why there is no separate cut-out
 *
 * There used to be `photoUrl` and `cutoutPhotoUrl`, on the theory that a banner drawing over
 * `#FFF7CC` needs a transparent asset while a card does not. Every bundled export is ALREADY
 * transparent — between 39% and 47% of each PNG is fully clear — so the two fields resolved the
 * same picture and existed only to be got wrong. One field cannot disagree with itself.
 */

/** The shapes the various DTOs carry. Both spellings of the server's field are accepted. */
export interface CookPhotoSource {
  /** As the booking schema normalises it. */
  readonly photoUrl?: string | null | undefined;
  /** As the raw server payload and the history DTO spell it. */
  readonly profileImageUrl?: string | null | undefined;
  /** The stable card identity that resolves a bundled photograph. */
  readonly profileCode?: string | null | undefined;
}

/**
 * The photograph to draw for this cook, or `null` when there is none.
 *
 * A hosted photo always wins: it is the real person as the backend published them. Otherwise the
 * cook's STABLE `profileCode` resolves the bundled export — never the display name, never the
 * phone, never array position, so bundled imagery can never attach to the wrong person.
 *
 * `null` is a real answer and means "draw no photograph". Callers degrade to initials or to no
 * image; none of them may substitute a sample, which is what put one cook's face on another
 * cook's booking.
 */
export function cookPhotoFor(cook: CookPhotoSource | null | undefined): string | null {
  if (cook === null || cook === undefined) return null;
  return (
    cook.photoUrl ?? cook.profileImageUrl ?? cookCardContentFor(cook.profileCode)?.photoUrl ?? null
  );
}
