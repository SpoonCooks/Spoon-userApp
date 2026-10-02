import type {
  CookMenuSection,
  CookPoolImage,
  CookPoolSummary,
  CookProfile,
  CookProfileLine,
} from './types';

/**
 * The Cook Pool's state while it has no backend, and the reads the screens take from it.
 *
 * Shaped after what the backend will hold: the cooks who have served the household, which of them
 * are in its pool, and the dishes it has favourited. Every read keeps the order the lists arrive
 * in; nothing here sorts.
 */

/** A cook who has served the household, as the backend would send them. */
export interface ServedCook {
  readonly cookId: string;
  /** The profile's title — "Cook Sanchita". */
  readonly name: string;
  /** The pool grid's caption — "Sanchita". */
  readonly shortName: string;
  readonly photo?: CookPoolImage | undefined;
  readonly details: readonly CookProfileLine[];
  readonly stats: readonly CookProfileLine[];
  readonly menu: readonly CookMenuSection[];
}

export interface CookPoolState {
  readonly minimumSize: number;
  /** Every cook who has served the household — the deck's order. */
  readonly servedCooks: readonly ServedCook[];
  /** The pool, newest first (`GET /v1/me/cooks`'s order). */
  readonly poolIds: readonly string[];
  readonly favouriteDishIds: readonly string[];
}

/** Puts a cook in the pool, newest first. Already there: unchanged. */
export function addCook(state: CookPoolState, cookId: string): CookPoolState {
  if (state.poolIds.includes(cookId)) return state;
  if (!state.servedCooks.some((cook) => cook.cookId === cookId)) return state;
  return { ...state, poolIds: [cookId, ...state.poolIds] };
}

/** Takes a cook out of the pool. Not there: unchanged. */
export function removeCook(state: CookPoolState, cookId: string): CookPoolState {
  if (!state.poolIds.includes(cookId)) return state;
  return { ...state, poolIds: state.poolIds.filter((id) => id !== cookId) };
}

export function toggleFavouriteDish(state: CookPoolState, dishId: string): CookPoolState {
  const favourites = state.favouriteDishIds.includes(dishId)
    ? state.favouriteDishIds.filter((id) => id !== dishId)
    : [...state.favouriteDishIds, dishId];
  return { ...state, favouriteDishIds: favourites };
}

/** The landing's pool grid. */
export function poolSummary(state: CookPoolState): CookPoolSummary {
  const byId = new Map(state.servedCooks.map((cook) => [cook.cookId, cook]));
  return {
    minimumSize: state.minimumSize,
    members: state.poolIds.flatMap((cookId) => {
      const cook = byId.get(cookId);
      return cook === undefined ? [] : [{ cookId, name: cook.shortName, photo: cook.photo }];
    }),
  };
}

/**
 * The deck: every cook who has served the household, in the pool or not — the deck is a loop and
 * never runs out (`deck.ts`). A cook already in the pool is dealt like any other.
 */
export function deckCooks(state: CookPoolState): readonly CookProfile[] {
  return state.servedCooks.map((cook) => toProfile(cook, state.poolIds.includes(cook.cookId)));
}

export function cookProfile(state: CookPoolState, cookId: string): CookProfile | undefined {
  const cook = state.servedCooks.find((entry) => entry.cookId === cookId);
  return cook === undefined ? undefined : toProfile(cook, state.poolIds.includes(cookId));
}

/**
 * How many empty places the landing's grid keeps after the pool's cooks: enough to reach the
 * minimum, and always one — the "Add" place that opens the deck.
 */
export function emptyPlaces(memberCount: number, minimumSize: number): number {
  return Math.max(1, minimumSize - memberCount);
}

function toProfile(cook: ServedCook, inPool: boolean): CookProfile {
  return {
    cookId: cook.cookId,
    name: cook.name,
    photo: cook.photo,
    details: cook.details,
    stats: cook.stats,
    menu: cook.menu,
    inPool,
  };
}
