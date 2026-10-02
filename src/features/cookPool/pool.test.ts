import { DEMO_COOK_POOL } from '@/demo/fixtures/cookPool';

import {
  addCook,
  cookProfile,
  deckCooks,
  emptyPlaces,
  poolSummary,
  removeCook,
  toggleFavouriteDish,
} from './pool';

const SANCHITA = 'demo-pool-sanchita';
const REKHA = 'demo-pool-rekha';

describe('Cook Pool state', () => {
  it('puts the newest cook first, once', () => {
    const one = addCook(DEMO_COOK_POOL, SANCHITA);
    const two = addCook(one, REKHA);
    expect(two.poolIds).toEqual([REKHA, SANCHITA]);
    expect(addCook(two, REKHA)).toBe(two);
  });

  it('only adds cooks who have served the household', () => {
    expect(addCook(DEMO_COOK_POOL, 'someone-else')).toBe(DEMO_COOK_POOL);
  });

  it('takes a cook out of the pool', () => {
    const pooled = addCook(DEMO_COOK_POOL, SANCHITA);
    const removed = removeCook(pooled, SANCHITA);
    expect(removed.poolIds).toEqual([]);
    expect(removeCook(removed, SANCHITA)).toBe(removed);
  });

  it('deals every cook, pooled or not, so the deck never runs out', () => {
    const pooled = addCook(DEMO_COOK_POOL, SANCHITA);
    const deck = deckCooks(pooled);
    expect(deck.map((cook) => cook.cookId)).toEqual(
      DEMO_COOK_POOL.servedCooks.map((cook) => cook.cookId),
    );
    expect(deck.find((cook) => cook.cookId === SANCHITA)?.inPool).toBe(true);
  });

  it('keeps the backend order of cooks, lines and menu', () => {
    expect(deckCooks(DEMO_COOK_POOL).map((cook) => cook.cookId)).toEqual(
      DEMO_COOK_POOL.servedCooks.map((cook) => cook.cookId),
    );
    const profile = cookProfile(DEMO_COOK_POOL, SANCHITA);
    const source = DEMO_COOK_POOL.servedCooks[0];
    expect(profile?.menu.map((section) => section.title)).toEqual(
      source?.menu.map((section) => section.title),
    );
    expect(profile?.stats).toBe(source?.stats);
  });

  it('marks whether a profile is in the pool, and has none for a stranger', () => {
    expect(cookProfile(DEMO_COOK_POOL, SANCHITA)?.inPool).toBe(false);
    expect(cookProfile(addCook(DEMO_COOK_POOL, SANCHITA), SANCHITA)?.inPool).toBe(true);
    expect(cookProfile(DEMO_COOK_POOL, 'someone-else')).toBeUndefined();
  });

  it('summarises the pool with each cook’s short name', () => {
    const summary = poolSummary(addCook(DEMO_COOK_POOL, SANCHITA));
    expect(summary.members).toEqual([
      expect.objectContaining({ cookId: SANCHITA, name: 'Sanchita' }),
    ]);
    expect(summary.minimumSize).toBe(2);
  });

  it('toggles a favourite dish', () => {
    const on = toggleFavouriteDish(DEMO_COOK_POOL, 'dish-1');
    expect(on.favouriteDishIds).toEqual(['dish-1']);
    expect(toggleFavouriteDish(on, 'dish-1').favouriteDishIds).toEqual([]);
  });

  it('keeps empty places up to the minimum, and always one', () => {
    expect(emptyPlaces(0, 2)).toBe(2);
    expect(emptyPlaces(1, 2)).toBe(1);
    expect(emptyPlaces(2, 2)).toBe(1);
    expect(emptyPlaces(7, 3)).toBe(1);
  });
});
