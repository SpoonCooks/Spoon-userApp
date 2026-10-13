import { useEffect } from 'react';
import { create } from 'zustand';

import { readTriedPlace, writeTriedPlace } from '@core/auth';

/**
 * What the map step learned when the server refused a confirmed point, handed to the Not
 * serviceable screen (`2214:4260`) — a separate route. Display only: the verdict itself was the
 * server's, and nothing here is saved as an address (dev note `2214:4364`). The server keeps its
 * own record of the attempt (`unserviceable_area_attempts`, written by the serviceability check),
 * which is what Ops reads.
 *
 * The place is also REMEMBERED on this device, per customer: a customer with no saved address who
 * was refused lands on Home's inactive-pincode variant (`1302:3539`) for that place — after the
 * redirect and on every later launch — instead of being sent back to the map in a loop.
 */
export interface NotServiceablePlace {
  /** The pinned place's name and line, as the map sheet showed them. */
  readonly title: string;
  readonly line: string;
  /** The neighbourhood named back: the server's, else the geocoder's, else null. */
  readonly locality: string | null;
  /** Where Spoon is live, from the serviceability response. */
  readonly liveAreas: readonly string[];
  /** Other customers refused at the same pincode. */
  readonly neighbours: number;
}

interface NotServiceableState {
  /** The place just refused, for the Not serviceable screen. */
  readonly place: NotServiceablePlace | null;
  /**
   * The last place this customer was refused at, read back from the device. `undefined` until
   * `hydrateTriedPlace` has answered for the signed-in customer; `null` when there is none.
   */
  readonly tried: NotServiceablePlace | null | undefined;
  /** Whose place `tried` is — another customer signing in on this device never sees it. */
  readonly triedFor: string | null;
  set: (place: NotServiceablePlace) => void;
}

export const useNotServiceableStore = create<NotServiceableState>((set) => ({
  place: null,
  tried: undefined,
  triedFor: null,
  set: (place) => set({ place }),
}));

/** Remembers a refused place for this customer, and shows it at once. Best effort. */
export async function rememberTriedPlace(
  userId: string,
  place: NotServiceablePlace,
): Promise<void> {
  useNotServiceableStore.setState({ tried: place, triedFor: userId });
  try {
    await writeTriedPlace(userId, JSON.stringify(place));
  } catch {
    // A device that cannot store it simply falls back to the map on the next launch.
  }
}

/** Reads this customer's remembered place into the store. */
export async function hydrateTriedPlace(userId: string): Promise<void> {
  try {
    const raw = await readTriedPlace(userId);
    useNotServiceableStore.setState({
      tried: raw === null ? null : parsePlace(raw),
      triedFor: userId,
    });
  } catch {
    useNotServiceableStore.setState({ tried: null, triedFor: userId });
  }
}

/**
 * This customer's remembered place: `undefined` while it is read (or before their id is known),
 * `null` when there is none. Reads it from the device the first time it is asked for a customer.
 */
export function useTriedPlace(userId: string | null): NotServiceablePlace | null | undefined {
  const tried = useNotServiceableStore((store) => store.tried);
  const triedFor = useNotServiceableStore((store) => store.triedFor);
  const current = userId !== null && triedFor === userId;
  useEffect(() => {
    if (userId !== null && !current) void hydrateTriedPlace(userId);
  }, [userId, current]);
  return current ? tried : undefined;
}

function parsePlace(raw: string): NotServiceablePlace | null {
  try {
    const value = JSON.parse(raw) as Partial<NotServiceablePlace>;
    if (typeof value.title !== 'string') return null;
    return {
      title: value.title,
      line: typeof value.line === 'string' ? value.line : '',
      locality: typeof value.locality === 'string' ? value.locality : null,
      liveAreas: Array.isArray(value.liveAreas)
        ? value.liveAreas.filter((area): area is string => typeof area === 'string')
        : [],
      neighbours: typeof value.neighbours === 'number' ? value.neighbours : 0,
    };
  } catch {
    return null;
  }
}
