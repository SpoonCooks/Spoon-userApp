/**
 * The deck's order: a loop of the candidates (`GET /v1/me/cooks/candidates` — cooks who have
 * served the household and are not in its pool). A skip sends the cook to the back, so once every
 * card has been seen the first comes round again, with no reload. An add takes the cook out of
 * the loop: they are in the pool now, which is exactly what makes a cook stop being a candidate.
 * The deck runs out only once every cook in it has been added.
 *
 * Undo skip brings back the last cook skipped, to the front, however many swipes ago that was.
 * A skipped cook later added is no longer theirs to undo.
 *
 * Every move names its cook rather than acting on "the top": a swipe finishing just as Undo
 * lands must move the cook it was about, or the loop and the pool fall out of step.
 */
export interface DeckLoop {
  /** The cooks still to decide, top first. */
  readonly ring: readonly string[];
  /** The cooks skipped, most recent last — what Undo skip walks back through. */
  readonly skipped: readonly string[];
  /** The cook flying back in from the left after an undo, until the next move. */
  readonly enteringId: string | null;
  /**
   * Counts every move. A cook can come round to the top again — even straight away, when they
   * are the only one left — so each deal needs its own identity, not just the cook's.
   */
  readonly turn: number;
}

export function startDeck(cookIds: readonly string[]): DeckLoop {
  return { ring: cookIds, skipped: [], enteringId: null, turn: 0 };
}

/** Sends the cook to the back of the loop. Not in it: unchanged. */
export function skipCook(deck: DeckLoop, cookId: string): DeckLoop {
  if (!deck.ring.includes(cookId)) return deck;
  return {
    ring: [...deck.ring.filter((id) => id !== cookId), cookId],
    skipped: [...deck.skipped, cookId],
    enteringId: null,
    turn: deck.turn + 1,
  };
}

/** Takes the cook out of the loop, and out of Undo's reach. Not in it: unchanged. */
export function addCook(deck: DeckLoop, cookId: string): DeckLoop {
  if (!deck.ring.includes(cookId)) return deck;
  return {
    ring: deck.ring.filter((id) => id !== cookId),
    skipped: deck.skipped.filter((id) => id !== cookId),
    enteringId: null,
    turn: deck.turn + 1,
  };
}

/** Brings the last cook skipped back to the front. Nothing skipped: unchanged. */
export function undoSkip(deck: DeckLoop): DeckLoop {
  const last = deck.skipped[deck.skipped.length - 1];
  if (last === undefined) return deck;
  return {
    ring: [last, ...deck.ring.filter((id) => id !== last)],
    skipped: deck.skipped.slice(0, -1),
    enteringId: last,
    turn: deck.turn + 1,
  };
}
