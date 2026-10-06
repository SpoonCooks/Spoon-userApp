import { addCook, skipCook, startDeck, undoSkip } from './deck';
import type { DeckLoop } from './deck';

/** The deck's own moves always name the card on top. */
const skipTop = (deck: DeckLoop) => skipCook(deck, deck.ring[0] ?? '');
const addTop = (deck: DeckLoop) => addCook(deck, deck.ring[0] ?? '');

describe('Cook Pool deck loop', () => {
  it('sends a skipped cook to the back and comes round to the first again', () => {
    let deck = startDeck(['a', 'b', 'c']);
    deck = skipTop(deck);
    deck = skipTop(deck);
    deck = skipTop(deck);
    expect(deck.ring).toEqual(['a', 'b', 'c']);
    deck = skipTop(deck);
    expect(deck.ring).toEqual(['b', 'c', 'a']);
  });

  it('takes an added cook out of the loop — they are no longer a candidate', () => {
    let deck = addTop(startDeck(['a', 'b', 'c']));
    expect(deck.ring).toEqual(['b', 'c']);
    deck = skipTop(skipTop(deck));
    expect(deck.ring).toEqual(['b', 'c']);
  });

  it('runs out only once every cook is added', () => {
    let deck = startDeck(['a', 'b']);
    deck = skipTop(deck);
    expect(deck.ring).toEqual(['b', 'a']);
    deck = addTop(addTop(deck));
    expect(deck.ring).toEqual([]);
  });

  it('deals a lone cook again as a new turn', () => {
    const deck = startDeck(['a']);
    const again = skipTop(deck);
    expect(again.ring).toEqual(['a']);
    expect(again.turn).not.toBe(deck.turn);
  });

  it('brings the last skipped cook back to the front, flying in', () => {
    let deck = skipTop(skipTop(startDeck(['a', 'b', 'c'])));
    expect(deck.ring).toEqual(['c', 'a', 'b']);
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['b', 'c', 'a']);
    expect(deck.enteringId).toBe('b');
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['a', 'b', 'c']);
    expect(deck.enteringId).toBe('a');
    expect(undoSkip(deck)).toBe(deck);
  });

  it('undoes a skip across an add made since', () => {
    let deck = skipTop(startDeck(['a', 'b', 'c']));
    deck = addTop(deck);
    expect(deck.ring).toEqual(['c', 'a']);
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['a', 'c']);
  });

  it('undoes a skip made on an earlier lap', () => {
    let deck = startDeck(['a', 'b']);
    deck = skipTop(skipTop(skipTop(deck)));
    expect(deck.ring).toEqual(['b', 'a']);
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['a', 'b']);
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['b', 'a']);
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['a', 'b']);
    expect(deck.skipped).toEqual([]);
  });

  it('forgets the skip of a cook later added', () => {
    let deck = startDeck(['a', 'b']);
    deck = skipTop(skipTop(deck));
    deck = addTop(deck);
    expect(deck.ring).toEqual(['b']);
    expect(deck.skipped).toEqual(['b']);
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['b']);
    expect(deck.skipped).toEqual([]);
  });

  it('stops the fly-in at the next move', () => {
    const deck = undoSkip(skipTop(startDeck(['a', 'b'])));
    expect(deck.enteringId).toBe('a');
    expect(skipTop(deck).enteringId).toBeNull();
    expect(addTop(deck).enteringId).toBeNull();
  });

  it('leaves a cook already gone untouched', () => {
    const deck = startDeck(['a', 'b']);
    expect(skipCook(deck, 'z')).toBe(deck);
    expect(addCook(deck, 'z')).toBe(deck);
    expect(addTop(startDeck([])).ring).toEqual([]);
  });

  it('adds the cook it names even when Undo has moved another to the top', () => {
    // `a` is added while its fly-off was racing an undo that brought `b` back to the front.
    let deck = skipTop(startDeck(['b', 'a', 'c']));
    deck = undoSkip(deck);
    expect(deck.ring).toEqual(['b', 'a', 'c']);
    deck = addCook(deck, 'a');
    expect(deck.ring).toEqual(['b', 'c']);
  });
});
