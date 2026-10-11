import { create } from 'zustand';

/**
 * What the map step learned when the server refused a confirmed point, handed to the Not
 * serviceable screen (`2214:4260`) — a separate route. Display only: the verdict itself was the
 * server's, and nothing here is saved as an address (dev note `2214:4364`).
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
  readonly place: NotServiceablePlace | null;
  set: (place: NotServiceablePlace) => void;
}

export const useNotServiceableStore = create<NotServiceableState>((set) => ({
  place: null,
  set: (place) => set({ place }),
}));
