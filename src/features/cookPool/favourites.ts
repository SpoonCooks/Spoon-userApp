import { useSyncExternalStore } from 'react';

/**
 * Dish favourites — the dish card's heart (`848:7809`).
 *
 * LOCAL AND PER SESSION, ON PURPOSE: the backend has no favourites endpoint (dropped in V2,
 * DEC-085), so a heart lives in memory until the app is closed and is never sent anywhere.
 * Favourites are keyed by the backend's `dishKey`, so the same dish is hearted on every cook who
 * cooks it — whether a favourite is per household or per cook is still open
 * (`docs/COOK_POOL_BACKEND.md` §5).
 */

let favourites: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function toggleFavouriteDish(dishId: string): void {
  const next = new Set(favourites);
  if (next.has(dishId)) next.delete(dishId);
  else next.add(dishId);
  favourites = next;
  listeners.forEach((listener) => listener());
}

/** The dishes hearted this session. */
export function useFavouriteDishIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => favourites);
}
