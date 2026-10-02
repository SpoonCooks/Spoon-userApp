import { useMemo, useSyncExternalStore } from 'react';

import { failed, useDevFixture } from '@core/data';
import type { DataState, ScreenQuery } from '@core/data';
import { fromStatus } from '@core/errors';

import { DEMO_COOK_POOL } from '@/demo/fixtures/cookPool';
import {
  addCook,
  cookProfile,
  deckCooks,
  poolSummary,
  removeCook,
  toggleFavouriteDish,
} from './pool';
import type { CookPoolState } from './pool';
import type { CookPoolSummary, CookProfile } from './types';

/**
 * The Cook Pool's data seam.
 *
 * TODO(backend-contract): no endpoint serves the deck (the cooks who have served the household,
 * with their menus), a cook's profile, or dish favourites, so the whole feature reads a local
 * store seeded from `DEMO_COOK_POOL`. `GET/POST/DELETE /v1/me/cooks` exist on V0 but carry
 * neither a menu nor dish images; `docs/COOK_POOL_BACKEND.md` lists what has to be added. When it
 * lands, each read below becomes a `useApiQuery` and each action a mutation that invalidates
 * them — the screens already render from `DataState` and do not change.
 *
 * Every change is applied the moment it is made, the way the landing expects each swipe to be
 * saved (`844:5842`'s note): the deck adds a cook as its card leaves, and the landing, deck and
 * profile all read the same store, so each shows the change on return.
 */

let current: CookPoolState = DEMO_COOK_POOL;
const listeners = new Set<() => void>();

function update(next: CookPoolState) {
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function usePoolState(): CookPoolState {
  return useSyncExternalStore(subscribe, () => current);
}

/** The landing (`719:1507`): the household's pool and its minimum size. */
export function useCookPool(): ScreenQuery<CookPoolSummary> {
  const state = usePoolState();
  return useDevFixture(useMemo(() => poolSummary(state), [state]));
}

/** The deck (`755:2333`): the cooks who have served the household and are not in its pool. */
export function useCookPoolDeck(): ScreenQuery<readonly CookProfile[]> {
  const state = usePoolState();
  return useDevFixture(useMemo(() => deckCooks(state), [state]));
}

/** One cook's profile (`719:1568`). A cook the household has never had is a 404. */
export function useCookProfile(cookId: string): ScreenQuery<CookProfile> {
  const state = usePoolState();
  const profile = useMemo(() => cookProfile(state, cookId) ?? null, [state, cookId]);
  const query = useDevFixture(profile);
  const result = useMemo<DataState<CookProfile>>(() => {
    if (query.state.status !== 'ready') return query.state;
    return query.state.data === null
      ? failed(fromStatus(404, { code: 'RESOURCE_NOT_FOUND', message: 'Cook not found' }))
      : { status: 'ready', data: query.state.data };
  }, [query.state]);
  return { state: result, refetch: query.refetch };
}

/** The dishes the household has hearted (`848:7809`). */
export function useFavouriteDishIds(): ReadonlySet<string> {
  const state = usePoolState();
  return useMemo(() => new Set(state.favouriteDishIds), [state]);
}

export interface CookPoolActions {
  readonly addCook: (cookId: string) => void;
  readonly removeCook: (cookId: string) => void;
  readonly toggleFavouriteDish: (dishId: string) => void;
}

const ACTIONS: CookPoolActions = {
  addCook: (cookId) => update(addCook(current, cookId)),
  removeCook: (cookId) => update(removeCook(current, cookId)),
  toggleFavouriteDish: (dishId) => update(toggleFavouriteDish(current, dishId)),
};

export function useCookPoolActions(): CookPoolActions {
  return ACTIONS;
}

/**
 * Development only: starts the store over, optionally with cooks already in the pool — the dev
 * preview's way to open on `719:1507` rather than the new-user `844:5842`.
 */
export function resetCookPoolDemo(poolIds: readonly string[] = []) {
  update({ ...DEMO_COOK_POOL, poolIds });
}
