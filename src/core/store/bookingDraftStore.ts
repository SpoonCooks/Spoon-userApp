import { create } from 'zustand';

/**
 * The pre-submission booking draft — the only genuinely client-owned booking state.
 * (FRONTEND_FOUNDATION_PLAN.md §7, §20)
 *
 * The moment a booking is submitted, ownership transfers to the server and this store is cleared.
 * That boundary is the whole point of this file.
 *
 * Every identifier here is OPAQUE and originates from a server-supplied list (durations, start
 * slots, addresses). The client does not generate, validate or interpret them, and it performs no
 * slot generation, availability or pricing logic.
 * TODO(backend-contract): id types are `string` until the contract defines them.
 */

/** Booking mode as presented in the UI (confirmed by the audit: Instant vs Schedule tiles). */
export type BookingMode = 'instant' | 'scheduled';

/**
 * Time-of-day grouping shown as chips on the Scheduled screen (Morning / Afternoon / Evening).
 * A display grouping only — the authoritative start-time slots come from the server.
 */
export type TimePeriod = 'morning' | 'afternoon' | 'evening';

export interface BookingDraft {
  readonly mode: BookingMode | null;
  readonly addressId: string | null;
  /** Server-supplied day identifier, not a client-computed date. */
  readonly dayId: string | null;
  readonly period: TimePeriod | null;
  /** Server-supplied duration option id. Never a client-side price or minute calculation. */
  readonly durationOptionId: string | null;
  /** Server-supplied start-slot id. Never a client-generated time. */
  readonly startSlotId: string | null;
}

export const EMPTY_BOOKING_DRAFT: BookingDraft = {
  mode: null,
  addressId: null,
  dayId: null,
  period: null,
  durationOptionId: null,
  startSlotId: null,
};

interface BookingDraftState {
  readonly draft: BookingDraft;
  setMode: (mode: BookingMode) => void;
  select: (patch: Partial<BookingDraft>) => void;
  clear: () => void;
}

export const useBookingDraftStore = create<BookingDraftState>((set) => ({
  draft: EMPTY_BOOKING_DRAFT,
  setMode: (mode) =>
    // Changing mode invalidates every downstream selection.
    set({ draft: { ...EMPTY_BOOKING_DRAFT, mode } }),
  select: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
  clear: () => set({ draft: EMPTY_BOOKING_DRAFT }),
}));

export const bookingDraftStore = {
  get: (): BookingDraft => useBookingDraftStore.getState().draft,
  clear: (): void => useBookingDraftStore.getState().clear(),
};
